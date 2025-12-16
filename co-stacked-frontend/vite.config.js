import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [react()],
    server: {
      host: isDev ? true : undefined, // allow external hosts only in dev
      allowedHosts: isDev
        ? [
            'localhost',
            '127.0.0.1',
            'costacked.co.za',
            'www.costacked.co.za'
          ]
        : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: !isDev, // optional, helpful in production debugging
    },
  };
});