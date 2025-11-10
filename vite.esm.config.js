import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Plugin to sanitize problematic regex patterns in the bundle
const sanitizeRegexPlugin = () => {
  return {
    name: 'sanitize-regex',
    generateBundle(options, bundle) {
      Object.keys(bundle).forEach(fileName => {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && chunk.code) {
          let code = chunk.code;
          
          // Fix overly permissive character range [$_A-z] -> [$_A-Za-z]
          code = code.replace(/\[\$_A-z\]/g, '[$_A-Za-z]');
          
          // Fix incomplete string escaping - target the exact problematic pattern
          code = code.replace(
            '"\\\\$1"',
            '"\\\\\\\\$1"'
          );
          
          // Also fix variations with single quotes
          code = code.replace(
            "'\\\\$1'",
            "'\\\\\\\\$1'"
          );
          
          // Fix other problematic regex patterns
          code = code.replace(/illegal:\s*\/\#\(\?\!\[\$_A-z\]\)\//g, 'illegal: /#(?![\\$_A-Za-z])/');
          
          chunk.code = code;
        }
      });
    },
  };
};

export default defineConfig({
  plugins: [react(), sanitizeRegexPlugin()],
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