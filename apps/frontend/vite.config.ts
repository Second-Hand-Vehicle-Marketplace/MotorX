import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) return 'firebase';
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react-vendor';
          if (id.includes('node_modules/@tanstack')) return 'query-vendor';
          if (id.includes('node_modules/axios')) return 'http-vendor';
          return undefined;
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // The dev server only answers to localhost and IP addresses unless a hostname is listed here
    // (e.g. the EC2 public DNS name). Comma-separated; a leading dot allows all subdomains.
    allowedHosts: (process.env.VITE_ALLOWED_HOSTS ?? '').split(',').map((host) => host.trim()).filter(Boolean),
  },
});
