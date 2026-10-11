// MeshCentral pins runtime module versions independently from npm. Keep its check
// aligned with the audited override; never silently patch an unknown release.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = require('meshcentral/package.json');
if (pkg.version !== '1.2.5') throw new Error('Revisar patch-engine ao atualizar MeshCentral.');
const file = require.resolve('meshcentral');
let code = readFileSync(file, 'utf8');
const before = "'compression@1.8.1'";
const after = "'compression@1.8.2'";
if (code.includes(before)) {
  if (code.split(before).length !== 2) throw new Error('Marcador de patch ambíguo.');
  writeFileSync(file, code.replace(before, after));
} else if (!code.includes(after)) throw new Error('Patch incompatível com o motor instalado.');
// ACME 4 uses a private Axios adapter path removed in Axios 1. Use the public API
// so the ACME client can receive Axios security fixes without a protocol rewrite.
const acmeFile = require.resolve('acme-client/src/axios');
const acmeBefore = "const adapter = require('axios/lib/adapters/http');";
const acmeAfter = "const adapter = axios.getAdapter('http');";
let acmeCode = readFileSync(acmeFile, 'utf8');
if (acmeCode.includes(acmeBefore)) writeFileSync(acmeFile, acmeCode.replace(acmeBefore, acmeAfter));
else if (!acmeCode.includes(acmeAfter)) throw new Error('Revisar adaptação do cliente ACME.');
