import axios from 'axios';
import { isDemoMode } from '@/lib/auth/demoUsers';
import { getDemoData } from '@/lib/auth/demoData';

const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Demo mode interceptor ──
// On GitHub Pages (no backend), intercept API calls and return demo data
apiClient.interceptors.request.use(async (config) => {
  if (isDemoMode() && config.url) {
    const demoData = getDemoData(config.url);
    if (demoData !== null) {
      const mockResponse = {
        data: { success: true, data: demoData },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
      // Use a custom error to short-circuit the request
      const cancel = new axios.Cancel('demo-mode');
      (cancel as any).demoResponse = mockResponse;
      throw cancel;
    }
  }
  return config;
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // ── Demo mode: return mock data ──
    if (axios.isCancel(error) && (error as any).demoResponse) {
      return Promise.resolve((error as any).demoResponse);
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

export { apiClient as api };
