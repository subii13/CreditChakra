import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // This sandbox exposes the dev server through a proxy whose
    // hostname Vite doesn't recognize by default (Vite 5+ blocks
    // unrecognized Host headers to prevent DNS rebinding). Safe to
    // disable for this local/temporary run behind the sandbox's own
    // network boundary — revisit before any real deployment.
    allowedHosts: true,
    // Whatever hostname the browser uses to reach Vite (a forwarded/
    // proxied one, not necessarily "localhost"), it can't reach the
    // backend on port 4000 directly. Proxying /api same-origin means
    // the browser only ever talks to the Vite origin; Vite (inside
    // this sandbox, where localhost:4000 is real) forwards it.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
})
