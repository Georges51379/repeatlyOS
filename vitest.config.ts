import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Separate from vite.config.ts rather than merged into it — this project's
// vite.config.ts intentionally stays a plain build/dev config; keeping test
// config in its own file avoids the two concerns fighting over one default
// export's shape as both grow.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
