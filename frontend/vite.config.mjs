import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_BACKEND = process.env.VITE_BACKEND_URL ?? 'http://localhost:8080';
const REACT_CJS_DEV_ALIAS_PREFIX = '/@pantheon-react-cjs-dev/';
const REACT_CJS_DEV_MODULES = new Map([
  ['react', 'react/cjs/react.development.js'],
  ['react/jsx-runtime', 'react/cjs/react-jsx-runtime.development.js'],
  ['react/jsx-dev-runtime', 'react/cjs/react-jsx-dev-runtime.development.js'],
  ['react-dom', 'react-dom/cjs/react-dom.development.js'],
  ['react-dom/client', 'react-dom/cjs/react-dom-client.development.js'],
  ['scheduler', 'scheduler/cjs/scheduler.development.js'],
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createReactCjsDevInteropPlugin() {
  const virtualPrefix = '\0pantheon-react-cjs-dev:';
  const moduleCache = new Map();

  function readModule(moduleId) {
    if (moduleCache.has(moduleId)) {
      return moduleCache.get(moduleId);
    }

    const relativePath = REACT_CJS_DEV_MODULES.get(moduleId);
    if (!relativePath) {
      return null;
    }

    const source = fs
      .readFileSync(path.resolve(__dirname, 'node_modules', relativePath), 'utf8')
      .replaceAll('process.env.NODE_ENV', '"development"');
    const dependencies = Array.from(
      new Set(Array.from(source.matchAll(/require\((['"])([^'"]+)\1\)/g), (match) => match[2])),
    ).filter((dependency) => REACT_CJS_DEV_MODULES.has(dependency));
    const exportNames = Array.from(
      new Set(Array.from(source.matchAll(/\bexports\.([A-Za-z_$][\w$]*)\s*=/g), (match) => match[1])),
    ).sort();

    const moduleInfo = { source, dependencies, exportNames };
    moduleCache.set(moduleId, moduleInfo);
    return moduleInfo;
  }

  function generateModuleCode(moduleId) {
    const moduleInfo = readModule(moduleId);
    if (!moduleInfo) {
      return null;
    }

    const dependencyImports = moduleInfo.dependencies
      .map((dependency, index) => `import __dep_${index} from ${JSON.stringify(dependency)};`)
      .join('\n');
    const dependencyResolver = moduleInfo.dependencies.length
      ? `const __deps = {\n${moduleInfo.dependencies
          .map((dependency, index) => `  ${JSON.stringify(dependency)}: __dep_${index},`)
          .join('\n')}\n};`
      : 'const __deps = {};';
    const namedExports = moduleInfo.exportNames
      .map((exportName) => `export const ${exportName} = __cjs.${exportName};`)
      .join('\n');

    return `${dependencyImports}
${dependencyResolver}
const module = { exports: {} };
const exports = module.exports;
const require = (id) => {
  if (id in __deps) {
    return __deps[id];
  }
  throw new Error(\`Unsupported CommonJS dependency in ${moduleId}: \${id}\`);
};

(function (module, exports, require) {
${moduleInfo.source}
})(module, exports, require);

const __cjs = module.exports;

export default __cjs;
${namedExports}
`;
  }

  return {
    name: 'pantheon-react-cjs-dev-interop',
    apply: 'serve',
    enforce: 'pre',
    resolveId(id) {
      if (id.startsWith(REACT_CJS_DEV_ALIAS_PREFIX)) {
        return `${virtualPrefix}${id.slice(REACT_CJS_DEV_ALIAS_PREFIX.length)}`;
      }

      return null;
    },
    load(id) {
      if (!id.startsWith(virtualPrefix)) {
        return null;
      }

      return generateModuleCode(id.slice(virtualPrefix.length));
    },
  };
}

function stripReactSwcOptimizeDepsPlugin() {
  return {
    name: 'pantheon-strip-react-swc-optimize-deps',
    apply: 'serve',
    configResolved(config) {
      if (!config.optimizeDeps?.include?.length) {
        return;
      }

      config.optimizeDeps.include = config.optimizeDeps.include.filter(
        (dependency) => !REACT_CJS_DEV_MODULES.has(dependency),
      );
    },
  };
}

function canUseStandardViteDev() {
  if (process.env.PANTHEON_STANDARD_VITE === '1') {
    return true;
  }

  if (process.env.PANTHEON_STANDARD_VITE === '0') {
    return false;
  }

  try {
    const result = spawnSync(process.execPath, ['-v'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
      encoding: 'utf8',
    });

    return !result.error && result.status === 0;
  } catch {
    return false;
  }
}

export default defineConfig(({ command }) => {
  const isServe = command === 'serve';
  const useStandardViteDev = isServe && canUseStandardViteDev();
  const useReactCjsDevInterop = isServe && !useStandardViteDev;

  return {
    plugins: [
      react(),
      ...(useReactCjsDevInterop
        ? [createReactCjsDevInteropPlugin(), stripReactSwcOptimizeDepsPlugin()]
        : []),
    ],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: [
        ...(useReactCjsDevInterop
          ? Array.from(REACT_CJS_DEV_MODULES.keys(), (moduleId) => ({
              find: new RegExp(`^${escapeRegExp(moduleId)}$`),
              replacement: `${REACT_CJS_DEV_ALIAS_PREFIX}${moduleId}`,
            }))
          : []),
        { find: '@', replacement: path.resolve(__dirname, './src') },
        { find: 'sonner@2.0.3', replacement: 'sonner' },
        { find: 'react-hook-form@7.55.0', replacement: 'react-hook-form' },
        { find: '@', replacement: path.resolve(__dirname, './src') },
      ],
    },
    server: {
      port: 3000,
      open: false,
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
     * 当前 Windows 环境会阻止 Vite 在开发态启动依赖预构建所需的 esbuild 子进程（spawn EPERM）。
     * 默认保留一个仅 dev 生效的兜底兼容层；若本机已恢复标准链路，可设置 PANTHEON_STANDARD_VITE=1 关闭它。
     */
    optimizeDeps: useReactCjsDevInterop
      ? {
          noDiscovery: true,
          include: [],
          exclude: Array.from(REACT_CJS_DEV_MODULES.keys()),
        }
      : undefined,
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
  };
});
