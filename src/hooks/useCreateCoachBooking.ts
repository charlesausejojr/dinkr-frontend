import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateCoachBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/coach-bookings/', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-bookings'] });
      // Bust all coach availability caches so blocked slots appear immediately
      queryClient.invalidateQueries({ queryKey: ['coach-availability'] });
    },
  });
}
