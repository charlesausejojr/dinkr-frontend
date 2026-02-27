'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { useEstablishments, useEstablishment } from '@/hooks/useEstablishments';
import { useCourtAvailability } from '@/hooks/useCourts';
import { useCoaches, useCoachAvailability } from '@/hooks/useCoaches';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { EstablishmentCard } from '@/components/establishments/EstablishmentCard';
import { CourtCard } from '@/components/courts/CourtCard';
import { Button } from '@/components/ui/Button';
import { BookingConfirmedModal } from '@/components/ui/BookingConfirmedModal';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Establishment, Court, Coach, TimeSlot } from '@/types';

interface ConfirmSummary {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
}

type Step = 1 | 2 | 3 | 4;

// ── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200 rounded-sm', className)} />;
}

// ── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({
  establishment,
  court,
  step,
  onStep,
}: {
  establishment: Establishment | null;
  court: Court | null;
  step: Step;
  onStep: (s: Step) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-body text-court-slate/60 mb-6 flex-wrap">
      <button
        onClick={() => onStep(1)}
        className={cn('hover:text-court-green transition-colors', step === 1 && 'text-court-green font-semibold')}
      >
        All Venues
      </button>
      {establishment && (
        <>
          <ChevronRight size={14} />
          <button
            onClick={() => onStep(2)}
            className={cn('hover:text-court-green transition-colors', step === 2 && 'text-court-green font-semibold')}
          >
            {establishment.name}
          </button>
        </>
      )}
      {court && (
        <>
          <ChevronRight size={14} />
          <button
            onClick={() => onStep(3)}
            className={cn('hover:text-court-green transition-colors', step === 3 && 'text-court-green font-semibold')}
          >
            {court.name}
          </button>
        </>
      )}
      {step === 4 && (
        <>
          <ChevronRight size={14} />
          <span className="text-court-green font-semibold">Confirm</span>
        </>
      )}
    </div>
  );
}

// ── Coach availability single hook wrapper ───────────────────────────────────
function CoachOption({
  coach,
  date,
  startTime,
  endTime,
  selected,
  onSelect,
}: {
  coach: Coach;
  date: string;
  startTime: string;
  endTime: string;
  selected: boolean;
  onSelect: (c: Coach) => void;
}) {
  const { data } = useCoachAvailability(coach.id, date);
  const isAvailable = useMemo(() => {
    if (!data?.slots || !startTime || !endTime) return false;
    // Find all 1-hour slots that fall within the booking window
    const covered = (data.slots as TimeSlot[]).filter(
      s => s.start_time >= startTime && s.end_time <= endTime
    );
    // Must have at least one slot covered and all must be free
    return covered.length > 0 && covered.every(s => s.is_available);
  }, [data, startTime, endTime]);

  if (!isAvailable) return null;

  return (
    <div
      className={cn(
        'border-2 rounded-sm p-3 flex items-center justify-between gap-3 transition-all cursor-pointer',
        selected ? 'border-court-lime bg-court-green/5' : 'border-gray-200 hover:border-court-green/30'
      )}
      onClick={() => onSelect(coach)}
    >
      <div>
        <p className="font-display font-bold text-sm uppercase text-court-green">{coach.name}</p>
        <p className="text-xs font-body text-court-slate/60 mt-0.5 line-clamp-1">{coach.bio}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-display font-bold text-court-lime">₱{coach.rate_per_hour}<span className="text-xs text-court-slate/50 font-body">/hr</span></p>
        {selected && <p className="text-xs text-court-green font-semibold mt-0.5">Selected ✓</p>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function BookCourtPanel() {
  const { isAuthenticated } = useAuthStore();
  const { setAuthModalOpen } = useUIStore();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(1);
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [addCoach, setAddCoach] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [confirmedSummary, setConfirmedSummary] = useState<ConfirmSummary | null>(null);

  const { data: establishments, isLoading: loadingEsts } = useEstablishments(locationFilter || undefined);
  const { data: fullEstablishment, isLoading: loadingEst } = useEstablishment(
    selectedEstablishment?.id ?? null
  );
  const { data: availability, isLoading: loadingSlots } = useCourtAvailability(
    selectedCourt?.id ?? null,
    selectedDate || null
  );
  const { data: coaches } = useCoaches();

  const availableSlots: TimeSlot[] = availability?.slots ?? [];
  const availableStartSlots = availableSlots.filter((s) => s.is_available);
  const endSlots = useMemo(() => {
    if (!selectedStart) return [];
    const startIdx = availableSlots.findIndex((s) => s.start_time === selectedStart);
    if (startIdx === -1) return [];
    const consecutive: TimeSlot[] = [];
    for (let i = startIdx; i < availableSlots.length; i++) {
      if (!availableSlots[i].is_available && i !== startIdx) break;
      consecutive.push(availableSlots[i]);
    }
    return consecutive;
  }, [availableSlots, selectedStart]);

  const duration = useMemo(() => {
    if (!selectedStart || !selectedEnd) return 0;
    const [sh, sm] = selectedStart.split(':').map(Number);
    const [eh, em] = selectedEnd.split(':').map(Number);
    return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, [selectedStart, selectedEnd]);

  const totalPrice = useMemo(() => {
    const courtCost = (selectedCourt?.price_per_hour ?? 0) * duration;
    const coachCost = addCoach && selectedCoach ? selectedCoach.rate_per_hour * duration : 0;
    return courtCost + coachCost;
  }, [selectedCourt, selectedCoach, addCoach, duration]);

  const bookingMutation = useMutation({
    mutationFn: () =>
      api.post('/bookings/', {
        court_id: selectedCourt!.id,
        date: selectedDate,
        start_time: selectedStart,
        end_time: selectedEnd,
        include_coach: addCoach && !!selectedCoach,
        coach_id: addCoach && selectedCoach ? selectedCoach.id : null,
      }),
    onSuccess: () => {
      // Bust availability caches so newly-blocked slots are reflected immediately
      queryClient.invalidateQueries({ queryKey: ['court-availability'] });
      queryClient.invalidateQueries({ queryKey: ['coach-availability'] });
      setConfirmedSummary({
        name: `${selectedEstablishment?.name} · ${selectedCourt?.name}`,
        date: selectedDate,
        startTime: selectedStart,
        endTime: selectedEnd,
        totalPrice: totalPrice,
      });
      setStep(1);
      setSelectedEstablishment(null);
      setSelectedCourt(null);
      setSelectedDate('');
      setSelectedStart('');
      setSelectedEnd('');
      setAddCoach(false);
      setSelectedCoach(null);
    },
  });

  const goToStep = (s: Step) => {
    if (s < step) {
      setStep(s);
      if (s === 1) { setSelectedEstablishment(null); setSelectedCourt(null); }
      if (s === 2) { setSelectedCourt(null); setSelectedDate(''); setSelectedStart(''); setSelectedEnd(''); }
      if (s === 3) { setSelectedStart(''); setSelectedEnd(''); setAddCoach(false); setSelectedCoach(null); }
    }
  };

  const modal = (
    <BookingConfirmedModal
      open={!!confirmedSummary}
      onClose={() => setConfirmedSummary(null)}
      summary={confirmedSummary}
    />
  );

  // ── Step 1: Choose Establishment ─────────────────────────────────────────
  if (step === 1) {
    return (
      <>
      {modal}
      <div>
        <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
          Find a Venue
        </h2>
        <p className="font-body text-court-slate/60 mb-6">Browse pickleball establishments near you.</p>

        <input
          type="text"
          placeholder="Filter by location..."
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="w-full max-w-sm px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm mb-6 bg-white transition-colors"
        />

        {loadingEsts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-72" />)}
          </div>
        ) : !establishments?.length ? (
          <div className="text-center py-16 text-court-slate/40 font-body">
            No venues found. Try a different location.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {establishments.map((est) => (
              <EstablishmentCard
                key={est.id}
                establishment={est}
                selected={selectedEstablishment?.id === est.id}
                onSelect={(e) => {
                  setSelectedEstablishment(e);
                  setStep(2);
                }}
              />
            ))}
          </div>
        )}
      </div>
      </>
    );
  }

  // ── Step 2: Choose Court ─────────────────────────────────────────────────
  if (step === 2 && selectedEstablishment) {
    const courts = (fullEstablishment?.courts ?? []).filter((c) => c.is_active);
    return (
      <div>
        <Breadcrumb establishment={selectedEstablishment} court={null} step={2} onStep={goToStep} />
        <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
          Courts at {selectedEstablishment.name}
        </h2>
        <p className="font-body text-court-slate/60 mb-6">Select a court to check availability.</p>

        {loadingEst ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56" />)}
          </div>
        ) : !courts.length ? (
          <div className="text-center py-16 text-court-slate/40 font-body">No active courts at this venue.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courts.map((court) => (
              <CourtCard
                key={court.id}
                court={court}
                selected={selectedCourt?.id === court.id}
                onSelect={(c) => {
                  setSelectedCourt(c);
                  setStep(3);
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Step 3: Choose Date & Time ───────────────────────────────────────────
  if (step === 3 && selectedCourt) {
    return (
      <div>
        <Breadcrumb establishment={selectedEstablishment} court={selectedCourt} step={3} onStep={goToStep} />
        <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
          Pick a Time
        </h2>
        <p className="font-body text-court-slate/60 mb-6">
          {selectedCourt.name} · ₱{selectedCourt.price_per_hour}/hr
        </p>

        {/* Date picker */}
        <div className="mb-6">
          <label className="block text-xs font-display font-semibold tracking-widest uppercase text-court-slate mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => { setSelectedDate(e.target.value); setSelectedStart(''); setSelectedEnd(''); }}
            className="px-4 py-2.5 border-2 border-gray-200 focus:border-court-green rounded-sm outline-none font-body text-sm bg-white transition-colors"
          />
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="mb-6">
            <label className="block text-xs font-display font-semibold tracking-widest uppercase text-court-slate mb-3">
              Start Time
            </label>
            {loadingSlots ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.start_time}
                    disabled={!slot.is_available}
                    onClick={() => { setSelectedStart(slot.start_time); setSelectedEnd(''); }}
                    className={cn(
                      'py-2 text-xs font-display font-semibold rounded-sm border-2 transition-all',
                      !slot.is_available
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                        : selectedStart === slot.start_time
                          ? 'border-court-lime bg-court-lime/20 text-court-green'
                          : 'border-gray-200 text-court-slate hover:border-court-lime hover:bg-court-lime/10'
                    )}
                  >
                    {slot.start_time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* End time */}
        {selectedStart && (
          <div className="mb-6">
            <label className="block text-xs font-display font-semibold tracking-widest uppercase text-court-slate mb-3">
              End Time
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {endSlots.map((slot) => (
                <button
                  key={slot.end_time}
                  onClick={() => setSelectedEnd(slot.end_time)}
                  className={cn(
                    'py-2 text-xs font-display font-semibold rounded-sm border-2 transition-all',
                    selectedEnd === slot.end_time
                      ? 'border-court-lime bg-court-lime/20 text-court-green'
                      : 'border-gray-200 text-court-slate hover:border-court-lime hover:bg-court-lime/10'
                  )}
                >
                  {slot.end_time}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedStart && selectedEnd && (
          <div className="flex items-center justify-between mt-4">
            <p className="font-body text-sm text-court-slate/60">
              {selectedStart} → {selectedEnd} · {duration}hr · <span className="font-semibold text-court-green">₱{(selectedCourt.price_per_hour * duration).toFixed(2)}</span>
            </p>
            <Button onClick={() => setStep(4)}>Add Coach / Confirm →</Button>
          </div>
        )}
      </div>
    );
  }

  // ── Step 4: Optional Coach + Confirm ────────────────────────────────────
  if (step === 4) {
    return (
      <div>
        <Breadcrumb establishment={selectedEstablishment} court={selectedCourt} step={4} onStep={goToStep} />
        <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
          Confirm Booking
        </h2>

        {/* Summary */}
        <div className="bg-white border-2 border-gray-200 rounded-sm p-5 mb-6">
          <div className="grid grid-cols-2 gap-y-2 text-sm font-body">
            <span className="text-court-slate/60">Venue</span>
            <span className="font-semibold text-court-green">{selectedEstablishment?.name}</span>
            <span className="text-court-slate/60">Court</span>
            <span className="font-semibold">{selectedCourt?.name}</span>
            <span className="text-court-slate/60">Date</span>
            <span className="font-semibold">{selectedDate}</span>
            <span className="text-court-slate/60">Time</span>
            <span className="font-semibold">{selectedStart} → {selectedEnd}</span>
          </div>
        </div>

        {/* Coach toggle */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-display font-bold uppercase tracking-wide text-court-green text-sm">Add a Coach?</p>
              <p className="font-body text-xs text-court-slate/60">Boost your game with a pro</p>
            </div>
            <button
              type="button"
              onClick={() => { setAddCoach(!addCoach); setSelectedCoach(null); }}
              className={cn(
                'relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0',
                addCoach ? 'bg-court-lime' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                  addCoach ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {addCoach && (
            <div className="flex flex-col gap-2">
              {!coaches?.length ? (
                <p className="text-sm font-body text-court-slate/50">No coaches available.</p>
              ) : (
                coaches.map((coach) => (
                  <CoachOption
                    key={coach.id}
                    coach={coach}
                    date={selectedDate}
                    startTime={selectedStart}
                    endTime={selectedEnd}
                    selected={selectedCoach?.id === coach.id}
                    onSelect={setSelectedCoach}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t-2 border-gray-100 pt-4 mb-6">
          <span className="font-display font-bold uppercase text-court-slate tracking-wide">Total</span>
          <span className="font-display font-bold text-2xl text-court-green">₱{totalPrice.toFixed(2)}</span>
        </div>

        {/* CTA */}
        {isAuthenticated() ? (
          <Button
            size="lg"
            className="w-full"
            loading={bookingMutation.isPending}
            onClick={() => bookingMutation.mutate()}
            disabled={addCoach && !selectedCoach}
          >
            Confirm Booking
          </Button>
        ) : (
          <div className="text-center">
            <p className="font-body text-sm text-court-slate/60 mb-3">You need to be signed in to book.</p>
            <Button variant="secondary" size="lg" onClick={() => setAuthModalOpen(true)}>
              Sign In to Book
            </Button>
          </div>
        )}

        {bookingMutation.isError && (
          <p className="text-sm text-red-500 mt-3 text-center">
            {(bookingMutation.error as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Booking failed. Please try again.'}
          </p>
        )}
      </div>
    );
  }

  return null;
}
