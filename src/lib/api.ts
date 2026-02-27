import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const { state } = JSON.parse(raw);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      }
    } catch {
      // corrupted localStorage — ignore
    }
  }
  return config;
});

// On 401, clear stale auth so the user is prompted to sign in again
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Wipe the persisted auth state
      localStorage.removeItem('auth-storage');
      // Dispatch a custom event so the UI can react (open auth modal)
      window.dispatchEvent(new CustomEvent('dinkr:session-expired'));
    }
    return Promise.reject(error);
  }
);
