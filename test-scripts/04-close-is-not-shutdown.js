// 04-close-is-not-shutdown.js
//
// Before this update, `close` killed the whole binary — deadly for a
// shared daemon. Now `piggy.close()` should only tear down the caller's
// own tabs/connection. This test proves the daemon survives clientA
// closing, by having clientB successfully do work AFTER clientA is gone.
//
// Usage:
//   PIGGY_KEY=peaseernest... node 04-close-is-not-shutdown.js

const { Piggy } = require('../src/piggy');

async function main() {
  const key = process.env.PIGGY_KEY;
  if (!key) {
    console.error('Set PIGGY_KEY to the key printed when you started the daemon.');
    process.exit(1);
  }

  const clientA = new Piggy();
  await clientA.launch({ key });
  await clientA.register('siteA', 'https://example.com');
  await clientA.siteA.navigate();
  console.log('[test4] clientA did work, now calling close()...');
  await clientA.close();
  console.log('[test4] clientA closed. Daemon should still be alive for everyone else.');

  // If close() had actually killed the daemon, this would fail to connect.
  const clientB = new Piggy();
  await clientB.launch({ key });
  await clientB.register('siteB', 'https://example.org');
  await clientB.siteB.navigate();
  const title = await clientB.siteB.evaluate(() => document.title);
  console.log('[test4] clientB connected AFTER clientA closed, title:', title);
  await clientB.close();

  console.log('[test4] PASS — close() was per-client; the shared daemon kept running.');
  process.exit(0);
}

main().catch(err => {
  console.error('[test4] FAIL:', err.message);
  process.exit(1);
});
