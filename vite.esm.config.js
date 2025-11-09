import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'esm',
    emptyOutDir: true,
    minify: 'terser',
    copyPublicDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/utils/viz-entry.js'),
      fileName: () => 'kedro-viz.mjs',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['plotly.js-dist-min'],
      output: {
        format: 'es',
        entryFileNames: 'kedro-viz.mjs',
        exports: 'auto',
        paths: {
          'plotly.js-dist-min': 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.26.0/+esm',
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
      },
      output: {
        comments: false,
      },
    },
    sourcemap: false,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});