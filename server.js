import { loadConfig, acquireLock, runEngine, requireAdministrator } from './src/runtime.js';
try {
  loadConfig();
  acquireLock();
  requireAdministrator();
  const child = runEngine();
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('error', error => { console.error(error.message); process.exit(1); });
  child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
} catch (error) { console.error(error.message); process.exitCode = 1; }
