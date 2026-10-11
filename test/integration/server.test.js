import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import https from 'node:https';
import net from 'node:net';
import { buildConfig } from '../../src/config.js';
const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '../..');
const password = 'Test-Only-Gama-849!';
function execute(file, args, env, input) {
  return new Promise((ok, fail) => {
    const child = spawn(process.execPath, [file, ...args], { cwd: root, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = ''; child.stdout.on('data', c => output += c); child.stderr.on('data', c => output += c);
    child.stdin.end(input); child.on('error', fail); child.on('close', code => ok({ code, output }));
  });
}
const port = await new Promise(ok => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); }); });
test('real HTTPS server: bootstrap, login, assets, denied registration, protected relay, persistence', { timeout: 240000 }, async t => {
  const home = mkdtempSync(resolve(tmpdir(), 'gama-test-')); const data = resolve(home, 'data'); mkdirSync(data);
  const env = { ...process.env, GAMA_HOME: home };
  const config = buildConfig({ dataDir: data, webDir: resolve(root, 'web'), port });
  writeFileSync(resolve(data, 'config.json'), JSON.stringify(config));
  let server, output = '';
  t.after(async () => {
    if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(ok => server.once('close', ok)); }
    rmSync(home, { recursive: true, force: true });
  });
  const blocked = await execute('server.js', [], env);
  assert.notEqual(blocked.code, 0); assert.match(blocked.output, /administrador/);
  const engine = async args => execute('scripts/engine.cjs', [], env, JSON.stringify([`--datapath=${data}`, `--filespath=${resolve(home, 'files')}`, '--launch', ...args]));
  const hash = await new Promise((ok, fail) => require('meshcentral/pass').hash(password, (e, salt, h) => e ? fail(e) : ok(`${salt},${h}`)));
  assert.match((await engine(['--createaccount=testadmin', `--hashpass=${hash}`])).output, /Done/);
  assert.match((await engine(['--adminaccount=testadmin'])).output, /Done/);
  const start = async () => {
    output = ''; server = spawn(process.execPath, ['server.js'], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    server.stdout.on('data', c => output += c); server.stderr.on('data', c => output += c);
    await new Promise((ok, fail) => { const timer = setInterval(() => {
      if (output.includes('HTTPS server running')) { clearInterval(timer); ok(); }
      else if (server.exitCode !== null) { clearInterval(timer); fail(new Error(output)); }
    }, 100); setTimeout(() => { clearInterval(timer); fail(new Error(`Startup timeout: ${output}`)); }, 120000).unref(); });
  };
  await start();
  const ca = readFileSync(resolve(data, 'root-cert-public.crt'));
  function request(path, { body, cookie } = {}) {
    return new Promise((ok, fail) => {
      const req = https.request({ host: '127.0.0.1', port, servername: 'gama.localhost', ca, path, method: body ? 'POST' : 'GET', headers: { Host: `gama.localhost:${port}`, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) } : {}), ...(cookie ? { Cookie: cookie } : {}) } }, res => { let text = ''; res.on('data', c => text += c); res.on('end', () => ok({ status: res.statusCode, headers: res.headers, text })); });
      req.on('error', fail); req.setTimeout(15000, () => req.destroy(new Error(`Request timeout: ${path}`))); req.end(body);
    });
  }
  await t.test('TLS page, branding, mobile page and custom assets', async () => {
    const r = await request('/'); assert.equal(r.status, 200); assert.match(r.text, /Gama Remote/);
    assert.match(r.text, /scripts\/custom.js/); assert.match(r.text, /styles\/custom.css/);
    for (const path of ['/scripts/custom.js', '/scripts/gestures.js', '/styles/custom.css', '/gama-ajuda.html']) assert.equal((await request(path)).status, 200, path);
    assert.equal((await request('/?mobile=1')).status, 200);
    const doctor = await execute('scripts/doctor.js', [], env); assert.equal(doctor.code, 0, doctor.output);
  });
  await t.test('public signup denied without creating an account', async () => {
    const r = await request('/createaccount', { body: 'username=intruder&password1=AnyPassword123!&password2=AnyPassword123!' });
    assert.ok([200, 302, 401, 403, 404].includes(r.status));
    assert.ok(!readFileSync(resolve(data, 'meshcentral.db'), 'utf8').includes('user//intruder'));
  });
  let authenticatedCookie;
  await t.test('invalid login does not authenticate; login cookie is HttpOnly and Secure', async () => {
    const bad = await request('/login', { body: 'action=login&username=testadmin&password=wrong' });
    const badCookie = (bad.headers['set-cookie'] || []).map(x => x.split(';')[0]).join('; ');
    const page = await request('/', { cookie: badCookie }); assert.match(page.text, /Login|loginpanel/);
    const login = await request('/login', { body: new URLSearchParams({ action: 'login', username: 'testadmin', password }).toString() });
    assert.equal(login.status, 200);
    const cookies = login.headers['set-cookie'] || []; assert.ok(cookies.length);
    assert.ok(cookies.some(c => /httponly/i.test(c) && /secure/i.test(c)));
    const cookie = cookies.map(x => x.split(';')[0]).join('; ');
    authenticatedCookie = cookie;
    const authenticated = await request('/', { cookie });
    assert.match(authenticated.text, /testadmin/);
    assert.match(authenticated.text, /two.factor|2FA|twoFactor/i);
  });
  await t.test('TOTP enrollment via authenticated API and second factor required on next login', async () => {
    const WebSocket = createRequire(require.resolve('meshcentral'))('ws');
    const otplib = createRequire(require.resolve('meshcentral'))('otplib');
    const secret = await new Promise((ok, fail) => {
      const ws = new WebSocket(`wss://127.0.0.1:${port}/control.ashx`, { ca, servername: 'gama.localhost', headers: { Host: `gama.localhost:${port}`, Origin: `https://gama.localhost:${port}`, Cookie: authenticatedCookie } });
      let secret;
      const timer = setTimeout(() => { ws.terminate(); fail(new Error('TOTP API timeout')); }, 8000);
      ws.on('open', () => ws.send(JSON.stringify({ action: 'otpauth-request' })));
      ws.on('message', raw => {
        const msg = JSON.parse(raw.toString());
        if (msg.action === 'otpauth-request') {
          if (!msg.secret) { clearTimeout(timer); ws.terminate(); fail(new Error(`TOTP request denied: ${msg.err}`)); return; }
          secret = msg.secret;
          ws.send(JSON.stringify({ action: 'otpauth-setup', secret, token: otplib.generateSync({ secret }) }));
        }
        if (msg.action === 'otpauth-setup') { clearTimeout(timer); ws.close(); msg.success ? ok(secret) : fail(new Error('TOTP setup failed')); }
      });
      ws.on('error', e => { clearTimeout(timer); fail(e); });
    });
    assert.ok(secret);
    const challenge = await request('/login', { body: new URLSearchParams({ action: 'login', username: 'testadmin', password }).toString() });
    // Password alone produces a login page, not the authenticated device UI.
    assert.match(challenge.text, /tokenInput/);
    assert.doesNotMatch(challenge.text, /userinfo\s*=\s*null/);
    const wrong = await request('/login', { body: new URLSearchParams({ action: 'login', username: 'testadmin', password, token: '000000' }).toString() });
    assert.doesNotMatch(wrong.text, /userinfo\s*=\s*null/);
    const valid = await request('/login', { body: new URLSearchParams({ action: 'login', username: 'testadmin', password, token: otplib.generateSync({ secret }) }).toString() });
    assert.match(valid.text, /userinfo\s*=\s*null/);
    const cookie = valid.headers['set-cookie'].map(x => x.split(';')[0]).join('; ');
    const mobile = await request('/?mobile=1', { cookie });
    assert.match(mobile.text, /deskToggleTrackpad/); assert.match(mobile.text, /scripts\/custom.js/);
  });
  await t.test('unauthenticated websocket cannot control a device', async () => {
    const WebSocket = createRequire(require.resolve('meshcentral'))('ws');
    await new Promise((ok, fail) => {
      const ws = new WebSocket(`wss://127.0.0.1:${port}/meshrelay.ashx?p=2&id=gama-unauthorized-test&nodeid=node//unauthorized`, { ca, servername: 'gama.localhost', headers: { Host: `gama.localhost:${port}` } });
      const timer = setTimeout(() => { ws.terminate(); fail(new Error('Unauthorized relay stayed open')); }, 35000);
      ws.on('message', () => { clearTimeout(timer); ws.terminate(); fail(new Error('Unauthenticated relay sent data')); });
      ws.on('close', () => { clearTimeout(timer); ok(); });
      ws.on('error', () => { clearTimeout(timer); ok(); });
    });
  });
  await t.test('second instance denied and state survives restart', async () => {
    const collision = await execute('server.js', [], env); assert.notEqual(collision.code, 0); assert.match(collision.output, /em execução/);
    server.kill('SIGTERM'); await new Promise(ok => server.once('close', ok));
    await start(); assert.equal((await request('/')).status, 200);
    assert.match(readFileSync(resolve(data, 'meshcentral.db'), 'utf8'), /user\/\/testadmin/);
  });
});
