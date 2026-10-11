import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
test('ACME HTTP adapter works with patched Axios, including response errors', async t => {
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url === '/directory') res.end(JSON.stringify({ newNonce: 'https://ca.example/nonce' }));
    else { res.statusCode = 400; res.end(JSON.stringify({ type: 'urn:ietf:params:acme:error:malformed' })); }
  });
  await new Promise(ok => server.listen(0, '127.0.0.1', ok));
  t.after(() => new Promise(ok => server.close(ok)));
  const axios = require('acme-client/src/axios');
  const url = `http://127.0.0.1:${server.address().port}`;
  const result = await axios.request({ url: `${url}/directory`, proxy: false });
  assert.equal(result.data.newNonce, 'https://ca.example/nonce');
  await assert.rejects(axios.request({ url: `${url}/bad`, proxy: false }), e => e.response.status === 400);
  const acme = require('acme-client'); assert.equal(typeof acme.forge.createPrivateKey, 'function'); assert.equal(typeof acme.Client, 'function');
});
