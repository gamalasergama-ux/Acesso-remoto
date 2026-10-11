import https from 'node:https';
import { readFileSync } from 'node:fs';
import { loadConfig, paths } from '../src/runtime.js';
try {
  const config = loadConfig();
  const cert = readFileSync(`${paths().data}/root-cert-public.crt`);
  const local = config.settings.cert === 'gama.localhost';
  const req = https.get({ hostname: '127.0.0.1', port: config.settings.port, servername: config.settings.cert, path: '/', ca: local ? cert : undefined, timeout: 5000 }, res => {
    res.resume();
    if (res.statusCode !== 200) { console.error(`Servidor respondeu HTTP ${res.statusCode}`); process.exitCode = 1; }
    else console.log('HTTPS e página de login respondendo. Isto NÃO testa controle Windows nem emissão/renovação externa do certificado.');
  });
  req.on('timeout', () => req.destroy(new Error('Servidor não respondeu em 5s.')));
  req.on('error', e => { console.error(e.message); process.exitCode = 1; });
} catch (e) { console.error(e.message); process.exitCode = 1; }
