import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_BACKEND = process.env.VITE_BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: 'sonner@2.0.3', replacement: 'sonner' },
      { find: 'react-hook-form@7.55.0', replacement: 'react-hook-form' },
    ],
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api': {
        target: DEFAULT_BACKEND,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/lucide-react/') || id.includes('node_modules/lucide/')) {
            return 'icons';
          }
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      onwarn({ code, message }) {
        if (code === 'CIRCULAR_DEPENDENCY' || code === 'EVAL' || message?.includes('Circular chunk')) {
          return;
        }
      },
    },
  },
});
