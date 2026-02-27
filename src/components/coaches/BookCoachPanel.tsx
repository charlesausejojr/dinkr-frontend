'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { useCoaches, useCoachAvailability } from '@/hooks/useCoaches';
import { useCreateCoachBooking } from '@/hooks/useCreateCoachBooking';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { CoachCard } from '@/components/coaches/CoachCard';
import { Button } from '@/components/ui/Button';
import { BookingConfirmedModal } from '@/components/ui/BookingConfirmedModal';
import { cn } from '@/lib/utils';
import type { Coach } from '@/types';

const TIME_SLOTS = [
  '06:00','07:00','08:00','09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00',
];

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

interface ConfirmSummary {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
}

// ── Right panel: booking form ─────────────────────────────────────────────────
function CoachBookingForm({ coach }: { coach: Coach }) {
  const { isAuthenticated } = useAuthStore();
  const { setAuthModalOpen } = useUIStore();
  const createBooking = useCreateCoachBooking();

  const [date, setDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmSummary | null>(null);

  const { data: availability, isLoading } = useCoachAvailability(coach.id, date);

  const startIdx = startTime ? TIME_SLOTS.indexOf(startTime) : -1;
  const endOptions = startTime
    ? TIME_SLOTS.slice(startIdx + 1)
    : [];

  const hours =
    startTime && endTime
      ? (toMinutes(endTime) - toMinutes(startTime)) / 60
      : 0;
  const total = hours * coach.rate_per_hour;

  const isSlotAvailable = (start: string) => {
    const slot = availability?.slots.find((s: { start_time: string; is_available: boolean }) => s.start_time === start);
    return slot?.is_available ?? false;
  };

  const handleBook = () => {
    if (!isAuthenticated()) { setAuthModalOpen(true); return; }
    if (!startTime || !endTime) return;
    createBooking.mutate(
      { coach_id: coach.id, date, start_time: startTime, end_time: endTime },
      {
        onSuccess: () => {
          setConfirmed({
            name: coach.name,
            date,
            startTime: startTime!,
            endTime: endTime!,
            totalPrice: total,
          });
          setStartTime(null);
          setEndTime(null);
        },
      }
    );
  };

  return (
    <>
      <div className="bg-white rounded-sm border-2 border-court-lime p-5 flex flex-col gap-5 animate-fade-in">
        <div>
          <p className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate/50 mb-1">Booking</p>
          <h3 className="font-display text-xl font-bold text-court-green uppercase">{coach.name}</h3>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">Date</label>
          <input
            type="date"
            value={date}
            min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
            onChange={e => { setDate(e.target.value); setStartTime(null); setEndTime(null); }}
            className="px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white"
          />
        </div>

        {/* Time slot grid */}
        <div>
          <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">
            Start Time
          </label>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-9 rounded-sm bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {TIME_SLOTS.slice(0, -1).map(slot => {
                const available = isSlotAvailable(slot);
                const isSelected = startTime === slot;
                return (
                  <button
                    key={slot}
                    disabled={!available}
                    onClick={() => { setStartTime(slot); setEndTime(null); }}
                    className={cn(
                      'py-2 text-xs font-display font-bold uppercase rounded-sm transition-all',
                      isSelected
                        ? 'bg-court-green text-court-lime'
                        : available
                        ? 'bg-court-lime/20 text-court-green hover:bg-court-lime hover:text-court-green'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* End time */}
        {startTime && (
          <div className="flex flex-col gap-1 animate-fade-in">
            <label className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate">End Time</label>
            <select
              value={endTime ?? ''}
              onChange={e => setEndTime(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white"
            >
              <option value="">Select end time...</option>
              {endOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        {/* Price preview */}
        {hours > 0 && (
          <div className="bg-court-green/5 border border-court-green/10 rounded-sm p-4 flex items-center justify-between animate-fade-in">
            <span className="font-body text-sm text-court-slate">
              {hours}h × ₱{coach.rate_per_hour}/hr
            </span>
            <span className="font-display font-bold text-xl text-court-lime">₱{total.toFixed(2)}</span>
          </div>
        )}

        {/* CTA */}
        {isAuthenticated() ? (
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={!startTime || !endTime}
            loading={createBooking.isPending}
            onClick={handleBook}
          >
            Confirm Booking
          </Button>
        ) : (
          <Button variant="ghost" size="lg" className="w-full" onClick={() => setAuthModalOpen(true)}>
            Sign In to Book
          </Button>
        )}

        {createBooking.isError && (
          <p className="text-sm text-red-500 text-center">
            {(createBooking.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Booking failed'}
          </p>
        )}
      </div>

      <BookingConfirmedModal
        open={!!confirmed}
        onClose={() => setConfirmed(null)}
        summary={confirmed}
      />
    </>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function BookCoachPanel() {
  const { data: coaches, isLoading } = useCoaches();
  const [selected, setSelected] = useState<Coach | null>(null);

  return (
    <div>
      <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
        Book a Coach
      </h2>
      <p className="font-body text-court-slate/60 mb-8">
        Select a coach, then choose your date and time.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: coach list */}
        <div className="flex flex-col gap-4">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 rounded-sm bg-gray-100 animate-pulse" />
              ))
            : coaches?.length === 0
            ? (
              <div className="text-center py-12 text-court-slate/40 font-body">
                No coaches listed yet.
              </div>
            )
            : coaches?.map(coach => (
              <CoachCard
                key={coach.id}
                coach={coach}
                onSelect={c => setSelected(c)}
                selected={selected?.id === coach.id}
              />
            ))}
        </div>

        {/* Right: booking form */}
        <div>
          {selected ? (
            <CoachBookingForm coach={selected} />
          ) : (
            <div className="h-full min-h-[200px] rounded-sm border-2 border-dashed border-gray-200 flex items-center justify-center text-court-slate/30 font-body text-sm">
              Select a coach to see availability →
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
