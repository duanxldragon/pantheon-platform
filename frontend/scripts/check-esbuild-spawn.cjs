const { spawn } = require('node:child_process');
const path = require('node:path');

const esbuildExe = path.resolve(__dirname, '../node_modules/@esbuild/win32-x64/esbuild.exe');

try {
  const child = spawn(esbuildExe, ['--version'], {
    stdio: ['pipe', 'pipe', 'inherit'],
    windowsHide: true,
  });

  let stdout = '';

  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString();
  });

  child.on('error', (error) => {
    console.error('esbuild spawn failed:', error.code || error.message);
    console.error('This terminal cannot use the standard Vite + esbuild dev path yet.');
    console.error('Keep the fallback config, or fix the host policy / terminal environment first.');
    process.exit(1);
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`esbuild spawn ok: ${stdout.trim()}`);
      console.log('You can try standard dev mode with: npm run dev:standard');
      return;
    }

    console.error(`esbuild exited with code ${code}`);
    process.exit(code || 1);
  });
} catch (error) {
  console.error('esbuild spawn threw:', error.code || error.message);
  process.exit(1);
}
