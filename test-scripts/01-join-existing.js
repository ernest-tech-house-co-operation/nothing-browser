// 01-join-existing.js
//
// Run this while your headless binary is already running (which it is —
// you've got it up in another terminal). This script should JOIN it, not
// spawn a second copy. If it tried to spawn one, you'd see a second
// "Failed to bind port 2005" error like the one you already hit.
//
// Usage:
//   PIGGY_KEY=peaseernest... node 01-join-existing.js
//
// Swap the require() path below for require('nothing-browser') once
// you're testing against the published package instead of the repo.

const piggy = require('nothing-browser');

async function main() {
  const key = process.env.PIGGY_KEY || "pease";
  if (!key) {
    console.error('Set PIGGY_KEY to the key printed when you started the daemon.');
    process.exit(1);
  }

  console.log('[test1] launching (should JOIN, not spawn)...');
  await piggy.launch({ key });

  console.log('[test1] connected. Registering a site + navigating...');
  await piggy.register('example', 'https://example.com');
  await piggy.example.navigate();

  const title = await piggy.example.evaluate(() => document.title);
  console.log('[test1] page title:', title);

  console.log('[test1] closing MY tabs only (daemon should stay up)...');
  await piggy.close();

  console.log('[test1] PASS — joined an existing instance, did work, closed cleanly.');
  process.exit(0);
}

main().catch(err => {
  console.error('[test1] FAIL:', err.message);
  process.exit(1);
});
