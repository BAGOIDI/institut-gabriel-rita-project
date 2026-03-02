import axios from 'axios';
import io from 'socket.io-client';

// Base URLs mapped via Traefik
const API_URLS = {
  CORE: '/api/core',
  PLANNING: '/api/planning',
  DASHBOARD: '/api/dashboard',
  FINANCE: '/api/finance',
};

// Axios instances
export const dashboardApi = axios.create({ baseURL: API_URLS.DASHBOARD });
export const financeApi = axios.create({ baseURL: API_URLS.FINANCE });
export const coreApi = axios.create({ baseURL: API_URLS.CORE });

// WebSocket Connection (Direct to service port or via Traefik if configured for WS)
// For dev/docker, direct port is often easier, but let's try relative path if proxied
export const socket = io('http://localhost:3003', {
  transports: ['websocket'],
  autoConnect: true,
});