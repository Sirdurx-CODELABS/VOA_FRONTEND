import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    let token = localStorage.getItem('voa_token');
    if (!token) {
      try {
        const raw = localStorage.getItem('voa_auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          token = parsed?.state?.token || null;
        }
      } catch {}
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      let portal = 'org';
      try {
        const raw = localStorage.getItem('voa_auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          portal = parsed?.state?.portal || 'org';
        }
      } catch {}
      localStorage.removeItem('voa_auth');
      localStorage.removeItem('voa_doctor_auth');
      window.location.href = portal === 'hms' ? '/hms/login' : '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
