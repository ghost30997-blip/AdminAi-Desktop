
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Garante que os caminhos sejam relativos para funcionar no protocolo file:// do Electron
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-utils': ['xlsx', 'jszip', 'jspdf']
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
