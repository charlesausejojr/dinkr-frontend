import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Coach } from '@/types';

export function useCoaches() {
  return useQuery<Coach[]>({
    queryKey: ['coaches'],
    queryFn: async () => {
      const res = await api.get('/coaches/');
      return res.data;
    },
  });
}

export function useCoach(coachId: string | null | undefined) {
  return useQuery<Coach>({
    queryKey: ['coach', coachId],
    queryFn: async () => {
      const res = await api.get(`/coaches/${coachId}`);
      return res.data;
    },
    enabled: !!coachId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCoachAvailability(coachId: string | null, date: string | null) {
  return useQuery({
    queryKey: ['coach-availability', coachId, date],
    queryFn: async () => {
      const res = await api.get(`/availability/coach/${coachId}`, { params: { date } });
      return res.data;
    },
    enabled: !!coachId && !!date,
    staleTime: 0, // always refetch — bookings change availability in real time
  });
}
