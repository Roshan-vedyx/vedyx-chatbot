import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // for resolving paths

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // this tells Vite to resolve '@' to the 'src' folder
    },
  },
  optimizeDeps: {
    include: ['katex'],
  },
  build: {
    commonjsOptions: {
      // This helps handle dynamic imports
      requireReturnsDefault: 'auto',
    },
  },
  css: {
    postcss: './postcss.config.js', // Ensure the PostCSS config is loaded
  },
});
