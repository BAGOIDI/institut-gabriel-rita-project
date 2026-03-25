import axios from 'axios';
import io from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Base URLs mapped via Traefik
const API_URLS = {
  CORE: `${BASE_URL}/api/core`,
  PLANNING: `${BASE_URL}/api/planning`,
  DASHBOARD: `${BASE_URL}/api/dashboard`,
  FINANCE: `${BASE_URL}/api/finance`,
  REPORTS: `${BASE_URL}/api/reports`,
};

// Axios instances
export const dashboardApi = axios.create({ baseURL: API_URLS.DASHBOARD });
export const financeApi = axios.create({ baseURL: API_URLS.FINANCE });
export const coreApi = axios.create({ baseURL: API_URLS.CORE });
export const reportsApi = axios.create({ baseURL: API_URLS.REPORTS });

// Interceptor to add auth token
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

dashboardApi.interceptors.request.use(addAuthToken);
financeApi.interceptors.request.use(addAuthToken);
coreApi.interceptors.request.use(addAuthToken);
reportsApi.interceptors.request.use(addAuthToken);

// WebSocket Connection (Direct to service port or via Traefik if configured for WS)
// For dev/docker, direct port is often easier, but let's try relative path if proxied
export const socket = io('http://localhost:3003', {
  transports: ['websocket'],
  autoConnect: true,
});