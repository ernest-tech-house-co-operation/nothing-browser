// 03-tab-isolation.js
//
// The whole point of the ownership tracking in PiggyServer: clientA opens
// a tab and triggers a JS `confirm()` dialog on it. clientB — a totally
// separate connection, own tab, own everything — should NEVER see that
// dialog event. Before this update, events were broadcast to every
// connected client; this test proves that's no longer true.
//
// Usage:
//   PIGGY_KEY=peaseernest... node 03-tab-isolation.js

const { Piggy } = require('../src/piggy');

async function main() {
  const key = process.env.PIGGY_KEY;
  if (!key) {
    console.error('Set PIGGY_KEY to the key printed when you started the daemon.');
    process.exit(1);
  }

  const clientA = new Piggy();
  const clientB = new Piggy();

  await clientA.launch({ key });
  await clientB.launch({ key });

  let aSawDialog = false;
  let bSawDialog = false;

  clientA.on('dialog', () => { aSawDialog = true; console.log('[clientA] saw dialog event (expected)'); });
  clientB.on('dialog', () => { bSawDialog = true; console.log('[clientB] saw dialog event (SHOULD NOT HAPPEN)'); });

  await clientA.register('siteA', 'https://example.com');
  await clientB.register('siteB', 'https://example.org');

  await clientA.siteA.navigate();
  await clientB.siteB.navigate();

  // Trigger a confirm() dialog only on clientA's tab.
  clientA.siteA.evaluate(() => { setTimeout(() => confirm('are you sure?'), 100); });

  // Give the event time to arrive (or not).
  await new Promise(r => setTimeout(r, 1500));

  // Clean up: dismiss the dialog if it's still pending so it doesn't hang.
  await clientA.siteA.dialog.dismiss().catch(() => {});

  await clientA.close();
  await clientB.close();

  if (aSawDialog && !bSawDialog) {
    console.log('[test3] PASS — dialog event was scoped to the owning client only.');
    process.exit(0);
  } else {
    console.error(`[test3] FAIL — aSawDialog=${aSawDialog} bSawDialog=${bSawDialog}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('[test3] FAIL:', err.message);
  process.exit(1);
});
