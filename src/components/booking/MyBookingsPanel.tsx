'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Booking, CoachBooking } from '@/types';


const MapDisplay = dynamic(
  () => import('@/components/ui/MapDisplay').then(m => m.MapDisplay),
  { ssr: false, loading: () => <div className="w-full h-48 rounded-sm bg-gray-100 animate-pulse" /> }
);

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useMyBookings() {
  const { isAuthenticated } = useAuthStore();
  return useQuery<Booking[]>({
    queryKey: ['my-bookings'],
    queryFn: () => api.get('/bookings/my').then(r => r.data),
    enabled: isAuthenticated(),
  });
}

function useMyCoachBookings() {
  const { isAuthenticated } = useAuthStore();
  return useQuery<CoachBooking[]>({
    queryKey: ['my-coach-bookings'],
    queryFn: () => api.get('/coach-bookings/my').then(r => r.data),
    enabled: isAuthenticated(),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isBookingCompleted(date: string, endTime: string): boolean {
  const [h, m] = endTime.split(':').map(Number);
  const end = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
  return end < new Date();
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed:  'bg-court-lime/20 text-court-green border-court-lime',
    completed:  'bg-blue-50 text-blue-600 border-blue-200',
    cancelled:  'bg-red-50 text-red-500 border-red-200',
    pending:    'bg-yellow-50 text-yellow-600 border-yellow-200',
  };
  const labels: Record<string, string> = {
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    pending:   'Pending',
  };
  return (
    <span className={`px-2 py-0.5 border rounded-full text-xs font-display font-bold uppercase ${colors[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ── Court booking card ────────────────────────────────────────────────────────
function CourtBookingCard({ booking }: { booking: Booking }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => api.delete(`/bookings/${booking.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['court-availability'] });
      queryClient.invalidateQueries({ queryKey: ['coach-availability'] });
    },
  });

  const completed = booking.status === 'confirmed' && isBookingCompleted(booking.date, booking.end_time);
  const displayStatus = completed ? 'completed' : booking.status;
  const canCancel = booking.status === 'confirmed' && !completed;

  const hasLocation = booking.establishment_latitude != null && booking.establishment_longitude != null;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-sm overflow-hidden">
      {/* Header row */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate/40 mb-0.5">
              Court Booking
            </p>
            <p className="font-display font-bold text-court-green uppercase tracking-tight">
              {booking.date}
            </p>
          </div>
          <StatusBadge status={displayStatus} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-body">
          <span className="text-court-slate/50">Time</span>
          <span className="font-semibold">{booking.start_time} → {booking.end_time}</span>
          <span className="text-court-slate/50">Total</span>
          <span className="font-display font-bold text-court-lime">₱{booking.total_price.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              loading={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel Booking
            </Button>
          )}
          {!canCancel && <div />}
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1 text-xs font-display font-bold uppercase tracking-widest text-court-green/60 hover:text-court-green transition-colors"
          >
            Booking Details
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        </div>

        {cancel.isError && (
          <p className="text-xs text-red-500">Failed to cancel. Please try again.</p>
        )}
      </div>

      {/* Collapsible details */}
      {open && (
        <div className="border-t-2 border-gray-100 bg-gray-50 px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-body">
            {booking.establishment_name && (
              <>
                <span className="text-court-slate/50 font-semibold">Venue</span>
                <span className="font-semibold text-court-green">{booking.establishment_name}</span>
              </>
            )}
            {booking.court_name && (
              <>
                <span className="text-court-slate/50 font-semibold">Court</span>
                <span className="font-semibold">{booking.court_name}</span>
              </>
            )}
            {booking.establishment_location && (
              <>
                <span className="text-court-slate/50 font-semibold">Location</span>
                <span className="font-semibold">{booking.establishment_location}</span>
              </>
            )}
          </div>

          {hasLocation && (
            <div>
              <p className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate/40 mb-2">
                Map
              </p>
              <MapDisplay
                lat={booking.establishment_latitude!}
                lng={booking.establishment_longitude!}
                label={booking.establishment_name || 'Venue'}
              />
            </div>
          )}

          {booking.include_coach && booking.coach_id && (
            <div className="pt-1 border-t border-gray-200">
              <p className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate/40 mb-2">
                Coach
              </p>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-sm px-3 py-2.5">
                {booking.coach_avatar_url ? (
                  <img
                    src={booking.coach_avatar_url}
                    alt={booking.coach_name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-court-green flex items-center justify-center shrink-0">
                    <span className="font-display font-bold text-court-lime text-sm uppercase">
                      {booking.coach_name?.[0] ?? 'C'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-court-green uppercase tracking-tight">
                    {booking.coach_name || 'Coach'}
                  </p>
                  {booking.coach_bio && (
                    <p className="text-xs font-body text-court-slate/50 truncate">{booking.coach_bio}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Coach booking card ────────────────────────────────────────────────────────
function CoachBookingCard({ booking }: { booking: CoachBooking }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => api.delete(`/coach-bookings/${booking.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-coach-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['coach-availability'] });
    },
  });

  const completed = booking.status === 'confirmed' && isBookingCompleted(booking.date, booking.end_time);
  const displayStatus = completed ? 'completed' : booking.status;
  const canCancel = booking.status === 'confirmed' && !completed;

  return (
    <div className="bg-white border-2 border-gray-200 rounded-sm overflow-hidden">
      {/* Header row */}
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate/40 mb-0.5">
              Coach Booking
            </p>
            <p className="font-display font-bold text-court-green uppercase tracking-tight">
              {booking.date}
            </p>
          </div>
          <StatusBadge status={displayStatus} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-body">
          <span className="text-court-slate/50">Time</span>
          <span className="font-semibold">{booking.start_time} → {booking.end_time}</span>
          <span className="text-court-slate/50">Total</span>
          <span className="font-display font-bold text-court-lime">₱{booking.total_price.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              loading={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel Booking
            </Button>
          )}
          {!canCancel && <div />}
          <button
            onClick={() => setOpen(v => !v)}
            className="flex items-center gap-1 text-xs font-display font-bold uppercase tracking-widest text-court-green/60 hover:text-court-green transition-colors"
          >
            Booking Details
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
          </button>
        </div>

        {cancel.isError && (
          <p className="text-xs text-red-500">Failed to cancel. Please try again.</p>
        )}
      </div>

      {/* Collapsible details */}
      {open && (
        <div className="border-t-2 border-gray-100 bg-gray-50 px-5 py-4 flex flex-col gap-3">
          {/* Coach mini profile */}
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-sm px-3 py-2.5">
            {booking.coach_avatar_url ? (
              <img
                src={booking.coach_avatar_url}
                alt={booking.coach_name}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-court-green flex items-center justify-center shrink-0">
                <span className="font-display font-bold text-court-lime text-sm uppercase">
                  {booking.coach_name?.[0] ?? 'C'}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-sm text-court-green uppercase tracking-tight">
                {booking.coach_name || 'Coach'}
              </p>
              {booking.coach_bio && (
                <p className="text-xs font-body text-court-slate/50 truncate">{booking.coach_bio}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-body">
            <span className="text-court-slate/50 font-semibold">Date</span>
            <span className="font-semibold">{booking.date}</span>
            <span className="text-court-slate/50 font-semibold">Session</span>
            <span className="font-semibold">{booking.start_time} → {booking.end_time}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return <div className="h-36 rounded-sm bg-gray-100 animate-pulse" />;
}

// ── Main panel ────────────────────────────────────────────────────────────────
export function MyBookingsPanel() {
  const { isAuthenticated } = useAuthStore();
  const { setAuthModalOpen } = useUIStore();
  const { data: courtBookings, isLoading: loadingCourt } = useMyBookings();
  const { data: coachBookings, isLoading: loadingCoach } = useMyCoachBookings();

  if (!isAuthenticated()) {
    return (
      <div className="text-center py-16">
        <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
          My Bookings
        </h2>
        <p className="font-body text-court-slate/60 mb-6">Sign in to view your booking history.</p>
        <Button variant="secondary" onClick={() => setAuthModalOpen(true)}>Sign In</Button>
      </div>
    );
  }

  const isLoading = loadingCourt || loadingCoach;
  const allEmpty = !isLoading && !courtBookings?.length && !coachBookings?.length;

  const upcomingCourt   = courtBookings?.filter(b => b.status === 'confirmed' && !isBookingCompleted(b.date, b.end_time)) ?? [];
  const completedCourt  = courtBookings?.filter(b => b.status === 'confirmed' && isBookingCompleted(b.date, b.end_time))  ?? [];
  const cancelledCourt  = courtBookings?.filter(b => b.status === 'cancelled')  ?? [];

  const upcomingCoach   = coachBookings?.filter(b => b.status === 'confirmed' && !isBookingCompleted(b.date, b.end_time)) ?? [];
  const completedCoach  = coachBookings?.filter(b => b.status === 'confirmed' && isBookingCompleted(b.date, b.end_time))  ?? [];
  const cancelledCoach  = coachBookings?.filter(b => b.status === 'cancelled')  ?? [];

  const hasUpcoming   = upcomingCourt.length > 0  || upcomingCoach.length > 0;
  const hasCompleted  = completedCourt.length > 0  || completedCoach.length > 0;
  const hasCancelled  = cancelledCourt.length > 0  || cancelledCoach.length > 0;

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-3xl font-bold text-court-green uppercase tracking-tight mb-2">
        My Bookings
      </h2>
      <p className="font-body text-court-slate/60 mb-8">
        All your court and coach reservations in one place.
      </p>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} />)}
        </div>
      )}

      {allEmpty && (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-sm">
          <p className="font-display text-lg uppercase text-court-slate/30">No bookings yet</p>
          <p className="font-body text-sm text-court-slate/40 mt-1">
            Head to "Book a Court" or "Book a Coach" to get started.
          </p>
        </div>
      )}

      {hasUpcoming && (
        <div className="mb-10">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm text-court-slate/50 mb-4">
            Upcoming
          </h3>
          <div className="flex flex-col gap-4">
            {upcomingCourt.map(b => <CourtBookingCard key={b.id} booking={b} />)}
            {upcomingCoach.map(b => <CoachBookingCard key={b.id} booking={b} />)}
          </div>
        </div>
      )}

      {hasCompleted && (
        <div className="mb-10">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm text-blue-400 mb-4">
            Completed
          </h3>
          <div className="flex flex-col gap-4">
            {completedCourt.map(b => <CourtBookingCard key={b.id} booking={b} />)}
            {completedCoach.map(b => <CoachBookingCard key={b.id} booking={b} />)}
          </div>
        </div>
      )}

      {hasCancelled && (
        <div>
          <h3 className="font-display font-bold uppercase tracking-widest text-sm text-court-slate/30 mb-4">
            Cancelled
          </h3>
          <div className="flex flex-col gap-4 opacity-60">
            {cancelledCourt.map(b => <CourtBookingCard key={b.id} booking={b} />)}
            {cancelledCoach.map(b => <CoachBookingCard key={b.id} booking={b} />)}
          </div>
        </div>
      )}
    </div>
  );
}
