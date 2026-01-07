import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Prioritize VITE_GEMINI_API_KEY for Vercel/Vite standard, falling back to older names
  const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || env.VITE_API_KEY || env.API_KEY || '';

  return {
    plugins: [react()],
    base: '/',
    define: {
      // Ensure process.env.API_KEY is defined for existing services/geminiService.ts
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.browser': true,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 3000, 
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'document-tools': ['xlsx', 'jszip', 'jspdf', 'jspdf-autotable'],
            'gemini-api': ['@google/genai']
          }
        }
      }
    },
    server: {
      port: 3000,
      strictPort: true
    }
  };
});