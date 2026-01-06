
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Substitui variáveis de ambiente por literais de string durante o build para o SDK do Gemini
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'utils-xlsx': ['xlsx'],
          'utils-pdf': ['jspdf', 'jspdf-autotable'],
          'utils-zip': ['jszip']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true
  }
});
