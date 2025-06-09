import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  base: '/',
  plugins: [
    react()
  ],
  server: {
    port: 4141,
    proxy: {
      '/api': {
        target: 'http://localhost:4142', // Adjust to your FastAPI backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
}));
