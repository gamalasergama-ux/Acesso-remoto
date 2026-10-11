import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, openSync, closeSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { validateConfig } from './config.js';
export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export function paths() {
  const base = resolve(process.env.GAMA_HOME || resolve(root, 'var'));
  return { base, data: resolve(base, 'data'), files: resolve(base, 'files'), backups: resolve(base, 'backups'), config: resolve(base, 'data/config.json') };
}
export function loadConfig() {
  try { return validateConfig(JSON.parse(readFileSync(paths().config, 'utf8'))); }
  catch (e) { throw new Error(`Configuração: ${e.message}. Execute npm run setup primeiro.`); }
}
export function acquireLock() {
  const p = paths(); mkdirSync(p.base, { recursive: true, mode: 0o700 });
  const file = resolve(p.base, 'runtime.lock');
  let fd;
  try { fd = openSync(file, 'wx', 0o600); }
  catch { throw new Error('Servidor ou manutenção já em execução. Se houve falha, confirme que TODOS os processos pararam antes de remover var/runtime.lock.'); }
  writeFileSync(fd, `${process.pid}\n`); closeSync(fd);
  let done = false;
  const release = () => { if (!done) { done = true; unlinkSync(file); } };
  process.once('exit', release);
  return release;
}
export function runEngine(extra = []) {
  const p = paths();
  for (const dir of [p.data, p.files, p.backups]) mkdirSync(dir, { recursive: true, mode: 0o700 });
  // Secret CLI values travel through stdin, never in the OS process command line.
  const child = spawn(process.execPath, ['--disable-proto=delete', resolve(root, 'scripts/engine.cjs')], { cwd: root, stdio: ['pipe', 'inherit', 'inherit'] });
  child.stdin.end(JSON.stringify([`--datapath=${p.data}`, `--filespath=${p.files}`, '--launch', ...extra]));
  return child;
}

export function requireAdministrator() {
  let rows;
  try { rows = readFileSync(resolve(paths().data, 'meshcentral.db'), 'utf8').trim().split('\n').map(line => JSON.parse(line)); }
  catch { throw new Error('Crie o administrador com npm run admin antes de iniciar o servidor.'); }
  const latest = new Map();
  for (const row of rows) if (row._id) latest.set(row._id, row);
  if (![...latest.values()].some(row => row.type === 'user' && row.siteadmin === 4294967295 && !row.$$deleted)) throw new Error('Nenhum administrador encontrado. Execute npm run admin.');
}
