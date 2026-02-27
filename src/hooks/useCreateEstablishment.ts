import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateEstablishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/establishments/', data).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['establishments'] }),
  });
}

export function useAddCourt(establishmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post(`/establishments/${establishmentId}/courts`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment', establishmentId] });
      queryClient.invalidateQueries({ queryKey: ['establishments'] });
    },
  });
}

export function useDeactivateCourt(establishmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courtId: string) =>
      api.patch(`/establishments/${establishmentId}/courts/${courtId}`, { is_active: false }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment', establishmentId] });
      queryClient.invalidateQueries({ queryKey: ['establishments'] });
    },
  });
}

export function useUpdateEstablishment(establishmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.patch(`/establishments/${establishmentId}`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment', establishmentId] });
      queryClient.invalidateQueries({ queryKey: ['establishments'] });
    },
  });
}
