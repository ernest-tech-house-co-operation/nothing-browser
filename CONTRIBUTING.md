## `CONTRIBUTING.md`

```markdown
# Contributing to Nothing Browser (Piggy Library)

Thanks for wanting to contribute! This document covers the **TypeScript/Bun library** (`nothing-browser` npm package).

> **For the C++ browser (Nothing Browser UI), see the [main repository](https://github.com/BunElysiaReact/nothing-browser).**

---

## Quick Links

- **Documentation:** [nothing-browser-docs.pages.dev](https://nothing-browser-docs.pages.dev/guide/piggy/quickstart)
- **GitHub Issues:** [BunElysiaReact/nothing-browser/issues](https://github.com/BunElysiaReact/nothing-browser/issues)
- **Discord:** [Join server](https://discord.gg/TUxBVQ7y)

---

## ⚠️ Important: Binary Must Support Features First

Piggy is a **client library** that communicates with the Nothing Browser binary over a socket.

**You cannot add a new feature to the library without the binary supporting it.**

```
Binary (C++) → Library (TypeScript) → Documentation
     ↑                ↑                    ↑
   Must exist      Must match          Must explain
   first           the binary           the feature
```

If you send a PR adding `site.newFunction()` to the library, be prepared to answer:

- Where is the binary change?
- What socket command does it use?
- Why do we need this?

**No binary change = PR rejected.**

---

## What We Welcome

| Type | Status |
|------|--------|
| **Bug fixes** | ✅ Merge fast |
| **TypeScript type improvements** | ✅ Merge |
| **Documentation** | ✅ Merge instantly |
| **Tests** | ✅ Merge |
| **Performance improvements** | ✅ Merge |
| **New features (with binary change)** | 🤷 Depends (convince me) |

---

## What We DON'T Accept

| Change | Reason |
|--------|--------|
| **`human/index.ts` changes** | 🚫 100% denied (human mode is finely tuned) |
| **New features without binary change** | 🚫 Denied |
| **Replacing Elysia with Express/Fastify/etc.** | 🚫 Denied (Elysia stays) |
| **Changes to socket protocol without binary** | 🚫 Denied |

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
- [ ] Did you update TypeScript types?
- [ ] Did you update documentation?
- [ ] Did you touch `human/index.ts`? (If yes, don't submit)
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
│   ├── client/          # Socket client
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
await piggy.close();
```

### Run with Local Binary

Make sure you have a `nothing-browser-headless` binary in your project root:

```bash
# Download from releases
wget https://github.com/BunElysiaReact/nothing-browser/releases/download/v0.1.9/nothing-browser-headless-0.1.9-linux-x86_64.tar.gz
tar -xzf nothing-browser-headless-*.tar.gz
chmod +x nothing-browser-headless

# Run your test
bun run test.ts
```

---

## Documentation

If your PR changes the API, update the docs at [nothing-browser-docs](https://github.com/BunElysiaReact/nothing-browser-docs).

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
| New features | Need binary change + convincing |
| `human/index.ts` | ❌ Don't touch |
| Replace Elysia | ❌ No. Never. |
| Community language libs | You build it, you maintain it |

**If you're cool with that, welcome aboard.**

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

*Nothing Ecosystem · Ernest Tech House · Kenya · 2026*

— Pease Ernest
