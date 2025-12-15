import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'admin.costacked.co.za',
      'www.admin.costacked.co.za',
      'localhost',
      '127.0.0.1',
      '154.66.197.173'
    ]
  }
})
