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
    alias: {
      'sonner@2.0.3': 'sonner',
      'react-hook-form@7.55.0': 'react-hook-form',
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: DEFAULT_BACKEND,
        changeOrigin: true,
        /**
         * Keep the /api prefix for compatibility with the backend router that already exposes /api/v1.
         * If your backend listens on another port just override VITE_BACKEND_URL.
         */
        // rewrite: (path) => path.startsWith('/api/v1') ? path : path.replace(/^\/api\//, '/api/v1/'),
      },
    },
  },
  /**
   * Windows Server 2019 的安全策略会阻止 Node 在 dev server / optimizeDeps 阶段调用带 pipe 的 esbuild 子进程。
   * 关闭依赖自动发现后，Vite 会按需使用原始 ESM，虽然首屏稍慢但可避免 EPERM。
   */
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    /**
     * 暂时关闭前端压缩，在 CI/Linux 环境可将 minify/cssMinify 重新开启。
     */
    minify: false,
    cssMinify: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Isolate heavyweight icon packs to prevent huge vendor bundle
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
