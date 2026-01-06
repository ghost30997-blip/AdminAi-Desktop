
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Injeta o polyfill de process de forma que as bibliotecas encontrem process.env.API_KEY
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.version': JSON.stringify('v20.0.0'),
    'process.platform': JSON.stringify('browser'),
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000, // Aumenta o limite para evitar o aviso do build
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'libs-vendor': ['xlsx', 'jszip', 'jspdf', 'idb', '@google/genai']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true
  }
});
