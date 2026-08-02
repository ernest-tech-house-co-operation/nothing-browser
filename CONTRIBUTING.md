# Contributing to Nothing Browser (Piggy Library)

Thanks for wanting to contribute! This document covers the **TypeScript/Bun library** (`nothing-browser` npm package).

> **For the C++ browser (Nothing Browser UI), see the [main repository](https://github.com/BunElysiaReact/nothing-browser).**

---

## Quick Links

- **Documentation:** [nothing-browser-docs.pages.dev](https://nothing-browser-docs.pages.dev/guide/piggy/quickstart)
- **Wire protocol (v2.0.0+):** [`PROTOCOL.md`](PROTOCOL.md)
- **GitHub Issues:** [BunElysiaReact/nothing-browser/issues](https://github.com/BunElysiaReact/nothing-browser/issues)
- **Discord:** [Join server](https://discord.gg/TUxBVQ7y)

---

## ⚠️ Important: Binary Must Support Features First

Piggy is a **client library** that communicates with the Nothing Browser binary over a WebSocket, on a fixed port (2005 — always, hardcoded, never a config option). As of v2.0.0 the binary is a shared daemon: any number of client connections — this library, someone's Python script, a raw `websocat` session — can talk to one running instance at once, all speaking the same JSON-over-WebSocket protocol described in [`PROTOCOL.md`](PROTOCOL.md).

**You cannot add a new feature to the library without the binary supporting it.**

```
Binary (C++) → Wire protocol (PROTOCOL.md) → Library (TypeScript) → Documentation
     ↑                    ↑                        ↑                     ↑
   Must exist         Must document            Must match           Must explain
   first              the command              the binary            the feature
```

Because the wire protocol is now the actual contract other languages build
against (not just an implementation detail of this library), a new or
changed command needs **`PROTOCOL.md` updated in the same PR**, not just
the TypeScript wrapper. If you send a PR adding `site.newFunction()` to
the library, be prepared to answer:

- Where is the binary change?
- What WebSocket command does it use, and is it in `PROTOCOL.md`?
- Why do we need this?

**No binary change = PR rejected. Binary change without a `PROTOCOL.md` update = also rejected.**

---

## What We Welcome

| Type | Status |
|------|--------|
| **Bug fixes** | ✅ Merge fast |
| **TypeScript type improvements** | ✅ Merge |
| **Documentation** | ✅ Merge instantly |
| **Tests** | ✅ Merge |
| **Performance improvements** | ✅ Merge |
| **New features (with binary change + `PROTOCOL.md` update)** | 🤷 Depends (convince me) |

---

## What We DON'T Accept

| Change | Reason |
|--------|--------|
| **`human/index.ts` changes** | 🚫 100% denied (human mode is finely tuned) |
| **New features without binary change** | 🚫 Denied |
| **Replacing Elysia with Express/Fastify/etc.** | 🚫 Denied (Elysia stays) |
| **Changes to the WebSocket protocol without a binary change *and* a `PROTOCOL.md` update** | 🚫 Denied |
| **Changing the fixed port (2005) or making it configurable** | 🚫 Denied — this is deliberate, see `PROTOCOL.md` |
| **Reverting `close()` to kill the whole shared daemon** | 🚫 Denied — that's what `shutdown()` is for; `close()` being per-connection is intentional (v2.0.0) |

---

## Code Style

### TypeScript

```ts
// ✅ Good
async function scrapeData(url: string): Promise<Data> {
    const site = await piggy.register("temp", url);
    await site.navigate();
    return await site.evaluate(() => ({ ... }));
}

// ❌ Bad
async function scrapeData(url){ // no types
    let site = await piggy.register("temp",url)
    await site.navigate()
    return await site.evaluate(()=>({...}))
}
```

### Imports

```ts
// ✅ Good - single import
import piggy from "nothing-browser";

// ❌ Bad - don't import internal paths unless necessary
import { PiggyClient } from "nothing-browser/piggy/client";
```

---

## PR Checklist

Before submitting a PR:

- [ ] Does it fix a bug? (Explain the bug)
- [ ] Does it add a feature? (If yes, where's the binary change?)
- [ ] Does it touch the wire protocol? (If yes, is `PROTOCOL.md` updated?)
- [ ] Did you update TypeScript types?
- [ ] Did you update documentation?
- [ ] Did you touch `human/index.ts`? (If yes, don't submit)
- [ ] If it touches connection/lifecycle logic — did you test it against a shared instance (two clients connected at once), not just a freshly spawned one?
- [ ] Did you run `bun test` (if tests exist)?
- [ ] Did you run `bun run build` to ensure no errors?

---

## Development Setup

```bash
# Clone
git clone https://github.com/BunElysiaReact/nothing-browser.git
cd nothing-browser

# Install dependencies
bun install

# Build the library
bun run build

# Run tests (if any)
bun test
```

---

## Project Structure

```
nothing-browser/
├── piggy/
│   ├── client/          # WebSocket client (fixed port 2005, join-or-launch logic)
│   ├── launch/          # Binary detection & spawning
│   ├── register.ts      # Site registration
│   ├── server.ts        # Elysia API server
│   └── index.ts         # Main export
├── examples/            # Example scripts
├── test/                # Tests
├── package.json
└── tsconfig.json
```

---

## Testing Your Changes

### Manual Test

```ts
// Create a test file
import piggy from "./piggy/index.ts";

await piggy.launch();
await piggy.register("test", "https://example.com");
await piggy.test.navigate();
const title = await piggy.test.title();
console.log(title);
await piggy.close(); // closes only THIS script's tab — the binary keeps running
```

Note that `piggy.close()` won't stop the binary process anymore (v2.0.0+)
— it's per-connection now. If your test script is the only thing running
and you want the binary to actually exit afterward, call
`await piggy.shutdown()` instead of `close()`.

### Testing shared-daemon / multi-client behavior

If your change touches `PiggyServer`, connection handling, tab ownership,
or anything lifecycle-related, don't just test it against a single
freshly-spawned instance — that'll pass even if you've broken isolation
between clients. Start a daemon manually, then run two client scripts
against it concurrently and confirm they don't interfere with each other
(events, tab ownership, `close()` scope). `PROTOCOL.md` has example
clients you can adapt for this; a quick raw `ws`/`websocat` script that
logs every message it receives is usually the fastest way to catch a
regression here.

### Run with Local Binary

Make sure you have a `nothing-browser-headless` binary in your project root:

```bash
# Download the latest release from GitHub
# (check https://github.com/BunElysiaReact/nothing-browser/releases for the current tag)
wget https://github.com/BunElysiaReact/nothing-browser/releases/latest/download/nothing-browser-headless-linux-x86_64.tar.gz
tar -xzf nothing-browser-headless-*.tar.gz
chmod +x nothing-browser-headless

# Run your test
bun run test.ts
```

---

## Documentation

If your PR changes the API, update the docs at [nothing-browser-docs](https://github.com/BunElysiaReact/nothing-browser-docs). If it changes the wire protocol, update [`PROTOCOL.md`](PROTOCOL.md) too — that's the reference other-language client authors rely on, so it needs to stay accurate even when a change is "just" internal to how this library uses the protocol.

The docs are VitePress. To preview locally:

```bash
cd docs
bun install
bun run dev
```

---

## Getting Help

- **Discord:** [Join server](https://discord.gg/TUxBVQ7y) - `#piggy` channel
- **GitHub Discussions:** [Start a discussion](https://github.com/BunElysiaReact/nothing-browser/discussions)
- **Email:** ernesttechhouse@gmail.com

---

## The Bottom Line

| Rule | Status |
|------|--------|
| Bug fixes | ✅ Yes, please |
| Documentation | ✅ Yes, please |
| TypeScript types | ✅ Yes, please |
| New features | Need binary change + `PROTOCOL.md` update + convincing |
| `human/index.ts` | ❌ Don't touch |
| Replace Elysia | ❌ No. Never. |
| Making port 2005 configurable | ❌ No. It's fixed on purpose. |
| Reverting `close()` to a global kill | ❌ No. Use/extend `shutdown()` instead. |
| Community language libs | You build it, you maintain it — `PROTOCOL.md` is your spec |

**If you're cool with that, welcome aboard.**

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

*Nothing Ecosystem · Ernest Tech House · Kenya · 2026*

— Pease Ernest