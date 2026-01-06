
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    // Essencial para o SDK do Gemini e bibliotecas que esperam ambiente Node
    'process.env': process.env 
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
