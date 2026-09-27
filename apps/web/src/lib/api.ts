import axios from 'axios';

const apiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Terjadi kesalahan pada server';
    return Promise.reject(new Error(message));
  },
);

// In-memory cache untuk GET requests (Stale-While-Revalidate)
// Menghilangkan skeleton loading & delay saat pengguna berpindah-pindah halaman
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30000; // 30 detik

export const api = {
  get: async <T = any, R = T>(url: string, config?: any): Promise<R> => {
    const key = url + JSON.stringify(config || {});
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      // Background silent revalidation
      apiInstance.get(url, config).then((fresh) => {
        cache.set(key, { data: fresh, timestamp: Date.now() });
      }).catch(() => {});
      return cached.data as R;
    }

    const data = await apiInstance.get(url, config);
    cache.set(key, { data, timestamp: Date.now() });
    return data as R;
  },
  post: async <T = any, R = T>(url: string, data?: any, config?: any): Promise<R> => {
    cache.clear(); // Bersihkan cache saat ada mutasi data baru
    return apiInstance.post(url, data, config) as Promise<R>;
  },
  put: async <T = any, R = T>(url: string, data?: any, config?: any): Promise<R> => {
    cache.clear();
    return apiInstance.put(url, data, config) as Promise<R>;
  },
  patch: async <T = any, R = T>(url: string, data?: any, config?: any): Promise<R> => {
    cache.clear();
    return apiInstance.patch(url, data, config) as Promise<R>;
  },
  delete: async <T = any, R = T>(url: string, config?: any): Promise<R> => {
    cache.clear();
    return apiInstance.delete(url, config) as Promise<R>;
  },
  clearCache: () => cache.clear(),
};

export default api;
