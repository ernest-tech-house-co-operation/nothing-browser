// 05-key-auth.js
//
// Your daemon is running with a key required. This test proves two things:
//   1. A wrong key gets rejected (not silently "connected" then broken).
//   2. The right key connects fine.
// This specifically exercises the ready-ack fix — without it, a bad key
// would look "connected" for a moment (WS handshake succeeds) before the
// server closes it, and older client code could have been fooled by that.
//
// Usage:
//   PIGGY_KEY=peaseernest... node 05-key-auth.js

const { Piggy } = require('../src/piggy');

async function main() {
  const key = process.env.PIGGY_KEY;
  if (!key) {
    console.error('Set PIGGY_KEY to the key printed when you started the daemon.');
    process.exit(1);
  }

  // ── Negative case: wrong key should fail, not "sort of" connect ────────────
  console.log('[test5] trying a deliberately wrong key (should fail)...');
  const badClient = new Piggy();
  let wrongKeyRejected = false;
  try {
    await badClient.launch({ key: key + '-definitely-wrong' });
    console.error('[test5] uh oh — wrong key was ACCEPTED, that is a bug');
  } catch (err) {
    wrongKeyRejected = true;
    console.log('[test5] wrong key correctly rejected:', err.message);
  }

  // ── Positive case: right key should work normally ──────────────────────────
  console.log('[test5] trying the real key (should succeed)...');
  const goodClient = new Piggy();
  await goodClient.launch({ key });
  await goodClient.register('site', 'https://example.com');
  await goodClient.site.navigate();
  const title = await goodClient.site.evaluate(() => document.title);
  console.log('[test5] connected with correct key, title:', title);
  await goodClient.close();

  if (wrongKeyRejected) {
    console.log('[test5] PASS — auth correctly gates the shared daemon.');
    process.exit(0);
  } else {
    console.error('[test5] FAIL — wrong key was not rejected.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[test5] FAIL:', err.message);
  process.exit(1);
});
