
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Injeta a API_KEY diretamente no código durante o build
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    // Garante que referências globais a 'process' não quebrem no browser
    'process.browser': true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'ui-libs': ['lucide-react'],
          'document-libs': ['xlsx', 'jszip', 'jspdf', 'jspdf-autotable'],
          'ai-sdk': ['@google/genai']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true
  }
});
