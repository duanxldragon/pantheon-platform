const { EventEmitter } = require('events');
const childProcess = require('node:child_process');
const path = require('path');
const { pathToFileURL } = require('url');

const originalExec = childProcess.exec;
function createFakeChild(stdoutText = '') {
  const emitter = new EventEmitter();
  emitter.stdout = null;
  emitter.stderr = null;
  emitter.pid = 0;
  emitter.kill = () => {};
  process.nextTick(() => {
    emitter.emit('exit', 0);
    emitter.emit('close', 0);
  });
  return emitter;
}

childProcess.exec = function patchedExec(command, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  const text = typeof command === 'string' ? command.trim().toLowerCase() : '';
  if (text.startsWith('net use')) {
    if (typeof callback === 'function') {
      process.nextTick(() => callback(null, ''));
    }
    return createFakeChild('');
  }
  return originalExec.call(childProcess, command, options, callback);
};

(async () => {
  const pkgPath = require.resolve('vite/package.json');
  const cliPath = path.join(path.dirname(pkgPath), 'dist/node/cli.js');
  await import(pathToFileURL(cliPath).href);
})();
