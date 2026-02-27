import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { Coach } from '@/types';

export function useMyCoachProfile() {
  const user = useAuthStore(s => s.user);
  const coaches = useQuery<Coach[]>({
    queryKey: ['coaches'],
    queryFn: () => api.get('/coaches/').then(r => r.data),
    enabled: !!user,
  });
  const myProfile = coaches.data?.find(c => c.user_id === user?.id) ?? null;
  return { ...coaches, myProfile };
}

export function useCreateCoach() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/coaches/', data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coaches'] }),
  });
}

export function useUpdateCoach(coachId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.patch(`/coaches/${coachId}`, data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coaches'] }),
  });
}
