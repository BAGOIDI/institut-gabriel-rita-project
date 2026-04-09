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

// WebSocket Connection (relative path - will use current host)
export const socket = io({
  transports: ['websocket', 'polling'],
  autoConnect: true,
  path: '/api/dashboard/socket.io',
});