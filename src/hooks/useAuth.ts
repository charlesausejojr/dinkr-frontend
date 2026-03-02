import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useRegister() {
  const setAuth = useAuthStore(s => s.setAuth);
  return useMutation({
    mutationFn: async (data: { email: string; password: string; full_name: string }) => {
      await api.post('/auth/register', data);
      const loginRes = await api.post('/auth/login', { email: data.email, password: data.password });
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${loginRes.data.access_token}` },
      });
      return { token: loginRes.data.access_token, user: meRes.data };
    },
    onSuccess: ({ token, user }) => setAuth(user, token),
  });
}

export function useLogin() {
  const setAuth = useAuthStore(s => s.setAuth);
  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const loginRes = await api.post('/auth/login', data);
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${loginRes.data.access_token}` },
      });
      return { token: loginRes.data.access_token, user: meRes.data };
    },
    onSuccess: ({ token, user }) => setAuth(user, token),
  });
}

export function useClerkTokenExchange() {
  const setAuth = useAuthStore(s => s.setAuth);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clerkToken: string) => {
      const res = await api.post('/auth/clerk', { token: clerkToken });
      const meRes = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });
      return { token: res.data.access_token, user: meRes.data };
    },
    onSuccess: ({ token, user }) => {
      setAuth(user, token);
      queryClient.invalidateQueries();
    },
  });
}
