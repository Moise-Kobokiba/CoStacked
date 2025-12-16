import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  // List of allowed dev hosts (can also come from .env)
  const allowedDevHosts = [
    'localhost',
    '127.0.0.1',
    process.env.VITE_DEV_HOST1, // optional: admin.costacked.co.za
    process.env.VITE_DEV_HOST2  // optional: www.admin.costacked.co.za
  ].filter(Boolean);

  return {
    plugins: [react()],

    server: isDev
      ? {
          host: true,           // allow external host access
          allowedHosts: allowedDevHosts
        }
      : undefined,            // ignored in production

    build: {
      outDir: 'dist',
      sourcemap: !isDev
    }
  };
});