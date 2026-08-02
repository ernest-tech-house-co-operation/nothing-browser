// 02-concurrent-scripts.js
//
// Simulates "5 different scripts sharing one binary" by making two fully
// independent Piggy instances in the same process (each opens its OWN
// WebSocket connection — from the server's point of view these are two
// unrelated clients, exactly like two separate `node script.js` processes
// would be). Both do real work against the shared daemon AT THE SAME TIME.
//
// Usage:
//   PIGGY_KEY=peaseernest... node 02-concurrent-scripts.js

const { Piggy } = require('../src/piggy');

async function runScript(name, url) {
  const key = process.env.PIGGY_KEY;
  const client = new Piggy();

  console.log(`[${name}] connecting...`);
  await client.launch({ key });

  await client.register('site', url);
  await client.site.navigate();
  const title = await client.site.evaluate(() => document.title);
  console.log(`[${name}] title:`, title);

  await client.close(); // only closes THIS client's tab
  console.log(`[${name}] done`);
}

async function main() {
  if (!process.env.PIGGY_KEY) {
    console.error('Set PIGGY_KEY to the key printed when you started the daemon.');
    process.exit(1);
  }

  console.log('[test2] running two "scripts" concurrently against one daemon...');
  await Promise.all([
    runScript('scriptA', 'https://example.com'),
    runScript('scriptB', 'https://example.org'),
  ]);

  console.log('[test2] PASS — both concurrent connections completed independently.');
  process.exit(0);
}

main().catch(err => {
  console.error('[test2] FAIL:', err.message);
  process.exit(1);
});
