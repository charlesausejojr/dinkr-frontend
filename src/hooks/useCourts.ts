import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCourtAvailability(courtId: string | null, date: string | null) {
  return useQuery({
    queryKey: ['court-availability', courtId, date],
    queryFn: async () => {
      const res = await api.get(`/availability/court/${courtId}`, { params: { date } });
      return res.data;
    },
    enabled: !!courtId && !!date,
    staleTime: 0, // always refetch — bookings change availability in real time
  });
}
