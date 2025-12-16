import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allow external hosts
    allowedHosts: [
      'costacked.co.za',
      'www.costacked.co.za',
      'localhost',
      '127.0.0.1',
      '154.66.197.173' // optional: your server IP
    ]
  }
});