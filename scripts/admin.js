import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';
import { Writable } from 'node:stream';
import { createInterface } from 'node:readline/promises';
import { loadConfig, acquireLock, runEngine, paths } from '../src/runtime.js';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
try {
  const { values } = parseArgs({ options: { username: { type: 'string' } } });
  const username = values.username;
  if (!/^[a-z][a-z0-9._-]{2,39}$/.test(username || '')) throw new Error('Usuário: 3–40 letras minúsculas, números, ponto, _ ou -.');
  loadConfig(); acquireLock();
  if (!process.stdin.isTTY) throw new Error('Execute em terminal interativo; senhas não são aceitas por argumentos ou variáveis.');
  process.stdout.write('Senha do administrador (mínimo 14 caracteres; entrada oculta): ');
  const muted = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const rl = createInterface({ input: process.stdin, output: muted, terminal: true });
  const password = await rl.question('');
  process.stdout.write('\nConfirme a senha: ');
  const confirm = await rl.question(''); rl.close(); process.stdout.write('\n');
  if (password !== confirm) throw new Error('Senhas diferentes.');
  if (password.length < 14 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) throw new Error('Use 14–128 caracteres, maiúscula, minúscula, número e símbolo.');
  const hash = await new Promise((ok, fail) => require('meshcentral/pass').hash(password, (e, salt, value) => e ? fail(e) : ok(`${salt},${value}`)));
  const run = extra => new Promise((ok, fail) => { const child = runEngine(extra); child.on('error', fail); child.on('exit', code => code === 0 ? ok() : fail(new Error('Falha na manutenção do banco.'))); });
  // MeshCentral's CLI sometimes exits 0 on errors; check DB state after each command.
  const findUser = () => {
    const rows = readFileSync(`${paths().data}/meshcentral.db`, 'utf8').trim().split('\n').map(line => JSON.parse(line));
    return rows.filter(row => row._id === `user//${username}`).at(-1);
  };
  try { if (findUser()) throw new Error('Usuário já existe. Não alterado.'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  await run([`--createaccount=${username}`, `--hashpass=${hash}`]);
  if (!findUser()?.hash) throw new Error('Criação não confirmada.');
  await run([`--adminaccount=${username}`]);
  if (findUser()?.siteadmin !== 4294967295) throw new Error('Permissão de administrador não confirmada.');
  console.log('Administrador criado. Configure o segundo fator no primeiro login. Guarde os códigos de recuperação.');
} catch (e) { console.error(e.message); process.exitCode = 1; }
