import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Security headers for local dev/preview. Production hosting (not chosen
// yet) needs the equivalent configured at that host — see public/_headers
// (Netlify/Cloudflare Pages convention) for the same values applied there.
const securityHeaders = {
  // Clickjacking: refuse to be framed by anyone, anywhere.
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { headers: securityHeaders },
  preview: { headers: securityHeaders },
})
