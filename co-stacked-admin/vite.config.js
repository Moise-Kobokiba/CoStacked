import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: mode === 'development' ? {
    host: true,
    allowedHosts: [
      'admin.costacked.co.za',
      'www.admin.costacked.co.za',
      'localhost',
      '127.0.0.1',
      '154.66.197.173'
    ]
  } : undefined
}));