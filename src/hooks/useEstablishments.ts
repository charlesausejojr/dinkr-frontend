import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Establishment } from '@/types';

export function useEstablishments(location?: string) {
  return useQuery<Establishment[]>({
    queryKey: ['establishments', location],
    queryFn: async () => {
      const res = await api.get('/establishments/', { params: location ? { location } : {} });
      return res.data;
    },
  });
}

export function useEstablishment(id: string | null) {
  return useQuery<Establishment>({
    queryKey: ['establishment', id],
    queryFn: async () => {
      const res = await api.get(`/establishments/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}
