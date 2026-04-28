import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const CMP_CONSENT_SCRIPT =
  '<script src="https://kedro.org/consent/kedro-consent.js" defer></script>';

// Injects the Kedro CMP consent script into index.html when
// VITE_INJECT_CONSENT_SCRIPT=true. Used exclusively by the demo.kedro.org
// GitHub Pages deploy; normal builds are unaffected.
function injectConsentScript() {
  return {
    name: 'inject-consent-script',
    transformIndexHtml(html) {
      if (process.env.VITE_INJECT_CONSENT_SCRIPT !== 'true') {
        return html;
      }
      return html.replace(
        '</head>',
        `    ${CMP_CONSENT_SCRIPT}\n  </head>`
      );
    },
  };
}

export default defineConfig({
  base: './',
  define: {
    'process.env': {},
  },
  plugins: [react(), injectConsentScript()],
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