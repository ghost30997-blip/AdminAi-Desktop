
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Define apenas as variáveis necessárias para evitar o erro "process is not defined"
    // e permitir que o SDK do Gemini acesse a API_KEY injetada pela plataforma.
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'utils-vendor': ['xlsx', 'jszip', 'jspdf', 'idb']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: true
  }
});
