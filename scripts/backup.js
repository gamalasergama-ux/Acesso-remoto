import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { paths, loadConfig, acquireLock } from '../src/runtime.js';
try {
  loadConfig(); acquireLock();
  const p = paths(); mkdirSync(p.backups, { recursive: true, mode: 0o700 });
  const target = mkdtempSync(resolve(p.backups, `gama-${new Date().toISOString().replaceAll(':', '-')}-`));
  cpSync(p.data, resolve(target, 'data'), { recursive: true, errorOnExist: true, force: false });
  cpSync(p.files, resolve(target, 'files'), { recursive: true, errorOnExist: true, force: false });
  writeFileSync(resolve(target, 'backup.json'), JSON.stringify({ format: 1, created: new Date().toISOString(), source: p.base, engine: '1.2.5', encrypted: false }, null, 2), { mode: 0o600 });
  console.log(`Backup offline criado em ${target}. Contém chaves privadas e dados: criptografe antes de transferir e mantenha fora do servidor.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
