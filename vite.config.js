import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  define: {
    'process.env': {},
  },
  plugins: [react()],
  server: {
    port: 4141,
    proxy: {
      '/api': {
        target: 'http://localhost:4142',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: { dedupe: ['react', 'react-dom'] },
  build: {
    outDir: 'dist',
    manifest: true,
  },
});