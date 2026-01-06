
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Padrão para hospedagem na Web (Vercel)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'document-utils': ['xlsx', 'jszip', 'jspdf', 'jspdf-autotable']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true
  }
});
