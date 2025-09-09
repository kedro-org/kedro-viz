import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'esmt',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/utils/viz-entry.js'),
      formats: ['es'],
      fileName: () => 'kedro-viz.production.mjs',
    },
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'kedro-viz.production.mjs',
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
    minify: 'esbuild',
    sourcemap: false,
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});
