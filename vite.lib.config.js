import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'lib',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/components/app/index.js'),
      fileName: (format) =>
        format === 'es'
          ? 'components/app/index.mjs'
          : 'components/app/index.js',
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'plotly.js-dist-min',
      ],
      output: [
        {
          format: 'es',
          entryFileNames: 'components/app/index.mjs',
          chunkFileNames: 'chunks/[name].mjs',
          assetFileNames: (assetInfo) =>
            (assetInfo.name || '').endsWith('.css')
              ? 'styles/styles.min.css'
              : 'assets/[name][extname]',
          exports: 'auto',
        },
        {
          format: 'cjs',
          entryFileNames: 'components/app/index.js',
          chunkFileNames: 'chunks/[name].js',
          assetFileNames: (assetInfo) =>
            (assetInfo.name || '').endsWith('.css')
              ? 'styles/styles.min.css'
              : 'assets/[name][extname]',
          exports: 'auto',
        },
      ],
    },
    minify: true,
    sourcemap: false,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  define: {
    'process.env': {},
  },
});