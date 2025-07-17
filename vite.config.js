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
  worker: {
    format: 'es', // Use ES modules for workers
    plugins: [react()], // Apply the same plugins to workers
  },
  build: {
    outDir: 'dist',
    manifest: true,
    rollupOptions: {
      output: {
        // Ensure proper asset handling for workers
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.worker.js')) {
            return 'assets/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name?.includes('worker')) {
            return 'assets/[name]-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        }
      }
    }
  },
});