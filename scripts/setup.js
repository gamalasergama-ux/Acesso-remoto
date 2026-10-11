import { mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { paths, root } from '../src/runtime.js';
import { buildConfig, validateConfig } from '../src/config.js';
try {
  const { values: v } = parseArgs({ options: { production: { type: 'boolean' }, hostname: { type: 'string' }, email: { type: 'string' }, port: { type: 'string' } } });
  const p = paths();
  const config = validateConfig(buildConfig({ production: v.production, hostname: v.hostname, email: v.email, port: v.port ? Number(v.port) : 8443, dataDir: p.data, webDir: resolve(root, 'web') }));
  for (const dir of [p.base, p.data, p.files, p.backups]) mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(p.config, JSON.stringify(config, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log('Configuração criada sem cadastro público. Próximo: npm run admin -- --username SEU_USUARIO');
  console.log(v.production ? 'Produção exige DNS, TCP 80/443 e auditoria de segurança aprovada. Veja docs/instalacao.md.' : 'Modo local: https://gama.localhost:8443 (somente loopback), certificado de desenvolvimento.');
} catch (error) { console.error(error.code === 'EEXIST' ? 'Configuração já existe; não foi sobrescrita.' : error.message); process.exitCode = 1; }
