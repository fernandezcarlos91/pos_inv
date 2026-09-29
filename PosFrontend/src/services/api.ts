import axios from 'axios';

// En producción el frontend se sirve por nginx, que redirige /api/* al backend (mismo origen, sin CORS).
// En desarrollo, vite.config.ts aplica un proxy equivalente.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de request para adjuntar token JWT
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Interceptor de response para manejar errores 401
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
      console.log('Sesión expirada o no autorizada');
    }
    return Promise.reject(error);
  }
);

export default api;