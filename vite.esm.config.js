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
          
          // Fix incomplete string escaping in escapeGroup function specifically
          code = code.replace(
            /return\s+group\.replace\(\/\(\[=!:\$\\?\/\(\)\]\)\/g,\s*"\\\\?\$1"\);/g,
            'return group.replace(/([=!:$\\/()])/g, "\\\\\\\\$1");'
          );
          
          // Fix the exact pattern from the error
          code = code.replace(
            'group.replace(/([=!:$\\/()])/g, "\\\\$1")',
            'group.replace(/([=!:$\\/()])/g, "\\\\\\\\$1")'
          );
          
          // Broader pattern for any replace with this specific regex
          code = code.replace(
            /\.replace\(\/\(\[=!:\$\\\/\(\)\]\)\/g,\s*"\\\\?\$1"\)/g,
            '.replace(/([=!:$\\/()])/g, "\\\\\\\\$1")'
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
      external: ['plotly.js-dist-min', 'mermaid'],
      output: {
        format: 'es',
        entryFileNames: 'kedro-viz.mjs',
        exports: 'auto',
        paths: {
          'plotly.js-dist-min': 'https://cdn.jsdelivr.net/npm/plotly.js-dist-min@2.26.0/+esm',
          'mermaid': 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs',
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