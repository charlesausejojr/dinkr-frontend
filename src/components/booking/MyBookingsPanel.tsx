'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useCoach } from '@/hooks/useCoaches';
import { Button } from '@/components/ui/Button';
import type { Booking, CoachBooking } from '@/types';

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

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: 'bg-court-lime/20 text-court-green border-court-lime',
    cancelled:  'bg-red-50 text-red-500 border-red-200',
    pending:    'bg-yellow-50 text-yellow-600 border-yellow-200',
  };
  return (
    <span className={`px-2 py-0.5 border rounded-full text-xs font-display font-bold uppercase ${colors[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
      {status}
    </span>
  );
}

// ── Coach mini-card (shown inside a court booking) ───────────────────────────
function CoachMiniCard({ coachId }: { coachId: string }) {
  const { data: coach } = useCoach(coachId);
  if (!coach) return (
    <div className="h-14 rounded-sm bg-gray-100 animate-pulse mt-1" />
  );

  return (
    <div className="flex items-center gap-3 bg-court-green/5 border border-court-green/10 rounded-sm px-3 py-2.5 mt-1">
      {coach.avatar_url ? (
        <img src={coach.avatar_url} alt={coach.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-court-green flex items-center justify-center shrink-0">
          <span className="font-display font-bold text-court-lime text-xs uppercase">{coach.name[0]}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm text-court-green uppercase tracking-tight">{coach.name}</p>
        {coach.bio && (
          <p className="text-xs font-body text-court-slate/50 truncate">{coach.bio}</p>
        )}
      </div>
      <span className="font-display font-bold text-court-lime text-sm shrink-0">
        ₱{coach.rate_per_hour}<span className="text-court-slate/40 text-xs font-body">/hr</span>
      </span>
    </div>
  );
}

// ── Court booking card ────────────────────────────────────────────────────────
function CourtBookingCard({ booking }: { booking: Booking }) {
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => api.delete(`/bookings/${booking.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['court-availability'] });
      queryClient.invalidateQueries({ queryKey: ['coach-availability'] });
    },
  });

  return (
    <div className="bg-white border-2 border-gray-200 rounded-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate/40 mb-0.5">
            Court Booking
          </p>
          <p className="font-display font-bold text-court-green uppercase tracking-tight">
            {booking.date}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-body">
        <span className="text-court-slate/50">Time</span>
        <span className="font-semibold">{booking.start_time} → {booking.end_time}</span>
        <span className="text-court-slate/50">Total</span>
        <span className="font-display font-bold text-court-lime">₱{booking.total_price.toFixed(2)}</span>
      </div>

      {booking.include_coach && booking.coach_id && (
        <div>
          <p className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate/40 mb-1">
            Coach
          </p>
          <CoachMiniCard coachId={booking.coach_id} />
        </div>
      )}

      {booking.status === 'confirmed' && (
        <div className="pt-1">
          <Button
            variant="danger"
            size="sm"
            loading={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            Cancel Booking
          </Button>
          {cancel.isError && (
            <p className="text-xs text-red-500 mt-1">Failed to cancel. Please try again.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Coach booking card ────────────────────────────────────────────────────────
function CoachBookingCard({ booking }: { booking: CoachBooking }) {
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => api.delete(`/coach-bookings/${booking.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-coach-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['coach-availability'] });
    },
  });

  return (
    <div className="bg-white border-2 border-gray-200 rounded-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate/40 mb-0.5">
            Coach Booking
          </p>
          <p className="font-display font-bold text-court-green uppercase tracking-tight">
            {booking.date}
          </p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div>
        <p className="text-xs font-display font-semibold tracking-widest uppercase text-court-slate/40 mb-1">Coach</p>
        <CoachMiniCard coachId={booking.coach_id} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-body">
        <span className="text-court-slate/50">Time</span>
        <span className="font-semibold">{booking.start_time} → {booking.end_time}</span>
        <span className="text-court-slate/50">Total</span>
        <span className="font-display font-bold text-court-lime">₱{booking.total_price.toFixed(2)}</span>
      </div>

      {booking.status === 'confirmed' && (
        <div className="pt-1">
          <Button
            variant="danger"
            size="sm"
            loading={cancel.isPending}
            onClick={() => cancel.mutate()}
          >
            Cancel Booking
          </Button>
          {cancel.isError && (
            <p className="text-xs text-red-500 mt-1">Failed to cancel. Please try again.</p>
          )}
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

  const confirmedCourt  = courtBookings?.filter(b => b.status === 'confirmed')  ?? [];
  const cancelledCourt  = courtBookings?.filter(b => b.status === 'cancelled')  ?? [];
  const confirmedCoach  = coachBookings?.filter(b => b.status === 'confirmed')  ?? [];
  const cancelledCoach  = coachBookings?.filter(b => b.status === 'cancelled')  ?? [];

  const hasActive    = confirmedCourt.length > 0 || confirmedCoach.length > 0;
  const hasCancelled = cancelledCourt.length > 0  || cancelledCoach.length > 0;

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

      {/* Active bookings */}
      {hasActive && (
        <div className="mb-10">
          <h3 className="font-display font-bold uppercase tracking-widest text-sm text-court-slate/50 mb-4">
            Upcoming
          </h3>
          <div className="flex flex-col gap-4">
            {confirmedCourt.map(b => <CourtBookingCard key={b.id} booking={b} />)}
            {confirmedCoach.map(b => <CoachBookingCard key={b.id} booking={b} />)}
          </div>
        </div>
      )}

      {/* Cancelled bookings */}
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
