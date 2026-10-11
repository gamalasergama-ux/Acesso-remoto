import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConfig, validateConfig } from '../src/config.js';
const opts = { dataDir: '/tmp/gama/data', webDir: '/tmp/gama/web' };
test('local binding, strong sessions, mandatory MFA and visible local consent', () => {
  const c = validateConfig(buildConfig(opts));
  assert.equal(c.settings.portBind, '127.0.0.1');
  assert.equal(c.settings.cert, 'gama.localhost');
  assert.equal(c.settings.redirPort, 0);
  assert.equal(c.domains[''].newAccounts, false);
  assert.equal(c.domains[''].userConsentFlags.desktopprompt, true);
  assert.notEqual(c.settings.sessionKey, buildConfig(opts).settings.sessionKey);
});
test('production uses direct TLS and explicit DNS/ACME settings', () => {
  const c = buildConfig({ ...opts, production: true, hostname: 'remote.example.com', email: 'admin@example.com' });
  assert.equal(c.settings.aliasPort, 443); assert.equal(c.settings.redirAliasPort, 80);
  assert.equal(c.letsencrypt.production, true); assert.equal(c.settings.tlsOffload, undefined);
});
test('reject invalid hostname, ports, email and public development binding', () => {
  for (const hostname of ['https://example.com', 'localhost', '1.2.3.4', 'example.com/evil', 'bad\n.example.com', '-bad.com']) assert.throws(() => buildConfig({ ...opts, production: true, hostname, email: 'a@b.com' }));
  for (const port of [0, 443, 65536, NaN, 8443.5]) assert.throws(() => buildConfig({ ...opts, port }));
  assert.throws(() => buildConfig({ ...opts, hostname: '0.0.0.0' }));
  assert.throws(() => buildConfig({ ...opts, production: true, hostname: 'remote.example.com' }));
});
test('reject accidental weakening of security profile', () => {
  const edits = [c => c.domains[''].newAccounts = true, c => c.domains[''].passwordRequirements.force2factor = false, c => c.settings.sessionKey = 'password', c => c.domains[''].consentMessages.autoAcceptIfNoUser = true, c => c.settings.portBind = '0.0.0.0', c => c.settings.tlsOffload = true];
  for (const edit of edits) { const c = buildConfig(opts); edit(c); assert.throws(() => validateConfig(c)); }
});
