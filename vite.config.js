import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ['katex'],
  },
  build: {
    commonjsOptions: {
      requireReturnsDefault: 'auto',
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    host: "127.0.0.1",  
    port: 5173,
    strictPort: true,
    cors: {
      origin: "*",
      methods: ["GET", "POST"], 
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups", // ✅ Fixes Firebase popup login issue
      "Cross-Origin-Embedder-Policy": "require-corp", // Ensures proper embedding
      "Access-Control-Allow-Origin": "*", 
    },
  },
});
