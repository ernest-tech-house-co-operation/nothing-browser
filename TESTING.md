# Testing the shared-daemon update

Two bugs got fixed along the way while writing these — both already applied
to the files in this package:

1. **`launch()` never passed a key anywhere.** Against a key-protected
   instance (like the one you've got running with session `pease`), it
   would probe with no key, get rejected, then try to spawn a *second*
   binary — which would immediately fail to bind port 2005 too. Fixed:
   `launch({ key })` now threads the key through both the probe and the
   real connection.
2. **A bad key looked "connected" for a split second.** Qt's
   `QWebSocketServer` accepts the WS handshake before your code gets to
   check the `X-Piggy-Key` header, so the old client code — which resolved
   on the WS `open` event — could be fooled by an accept-then-immediately-
   close. Fixed: the server now sends an explicit `{"type":"ready"}`
   message right after accepting a client, and the JS client waits for
   that (or a close, which now means "rejected") before considering itself
   connected. Also: a rejected key is now clearly distinguished from
   "nothing is listening at all," so a wrong key doesn't trigger a pointless
   duplicate-binary spawn attempt.

## Before you run anything

Your bind error was just a leftover process, not a code bug:

```bash
lsof -i :2005
# if it's an orphaned nothing-browser-headless from an earlier run:
pkill -f nothing-browser-headless
```

Then start the daemon fresh, keep it running in its own terminal, and copy
the key it prints:

```
Session : pease
Key     : peaseernestf3c05a1dc09a45038697067e2cd56578ab72359cc11348f48aeff
```

In every OTHER terminal you use for the test scripts:

```bash
export PIGGY_KEY=peaseernestf3c05a1dc09a45038697067e2cd56578ab72359cc11348f48aeff
```

The scripts `require('../src/piggy')` — drop them into your repo next to
`src/`, or adjust the path if you place them elsewhere. Once the package is
published, swap that for `require('nothing-browser')`.

## The 5 scripts

Run these one at a time (all against the SAME already-running daemon —
don't relaunch it between scripts):

| # | Script | Proves |
|---|--------|--------|
| 1 | `01-join-existing.js` | `launch()` joins your running daemon instead of trying to spawn a second one |
| 2 | `02-concurrent-scripts.js` | Two independent connections can do real work against the daemon at the same time |
| 3 | `03-tab-isolation.js` | A dialog event on clientA's tab is NOT delivered to clientB — tab ownership scoping works |
| 4 | `04-close-is-not-shutdown.js` | `close()` only tears down the calling client; the daemon survives for others |
| 5 | `05-key-auth.js` | A wrong key is rejected outright; the real key still works fine |

```bash
node 01-join-existing.js
node 02-concurrent-scripts.js
node 03-tab-isolation.js
node 04-close-is-not-shutdown.js
node 05-key-auth.js
```

Each prints `PASS` or `FAIL` and exits with the matching code, so you can
also wire them into a `&&`-chain or CI step:

```bash
node 01-join-existing.js && \
node 02-concurrent-scripts.js && \
node 03-tab-isolation.js && \
node 04-close-is-not-shutdown.js && \
node 05-key-auth.js && \
echo "ALL PASS"
```

None of these call `piggy.shutdown()` — that's the real kill switch and
would end your live session. If you want to test it, do it last, on
purpose, in its own throwaway script:

```js
const piggy = require('../src/piggy');
await piggy.launch({ key: process.env.PIGGY_KEY });
await piggy.shutdown(); // kills the daemon for everyone connected to it
```
