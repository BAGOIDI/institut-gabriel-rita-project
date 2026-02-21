import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    cors: true,
    allowedHosts: [
      'localhost',
      'unsicker-pluggingly-luciano.ngrok-free.dev',  // Domaine ngrok spécifique
      '.ngrok-free.dev',  // Autoriser tous les sous-domaines ngrok
      '127.0.0.1',
      '0.0.0.0'
    ]
  }
})
