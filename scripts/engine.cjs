'use strict';
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; if (input.length > 16384) process.exit(1); });
process.stdin.on('end', () => {
  process.argv = [process.execPath, require.resolve('meshcentral'), ...JSON.parse(input)];
  input = '';
  require('meshcentral').mainStart();
});
