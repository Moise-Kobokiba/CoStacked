import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [react()],

    // Dev server config (only applies during development)
    server: isDev
      ? {
          host: true, // allow access from any host/IP
          allowedHosts: [
            'localhost',
            '127.0.0.1',
            'costacked.co.za',
            'www.costacked.co.za',
          ],
        }
      : undefined,

    build: {
      outDir: 'dist',
      sourcemap: !isDev, // optional for production debugging
    },
  };
});