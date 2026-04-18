# `nothing-browser`

<p align="center">
  <img src="nothing_browser_pig_pink.svg" width="160" alt="Nothing Browser logo"/>
</p>

<h1 align="center">nothing-browser</h1>
<p align="center"><em>Does nothing... except everything that matters.</em></p>

<p align="center">
  <a href="https://www.npmjs.com/package/nothing-browser"><img src="https://img.shields.io/npm/v/nothing-browser" alt="npm version"/></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/BunElysiaReact/nothing-browser" alt="license"/></a>
  <a href="https://github.com/BunElysiaReact/nothing-browser/releases"><img src="https://img.shields.io/github/v/release/BunElysiaReact/nothing-browser" alt="releases"/></a>
</p>

**A scraper-first headless browser library** powered by the Nothing Browser Qt6/Chromium engine. Control real browser tabs, intercept network traffic, spoof fingerprints, capture WebSockets — all from Bun + TypeScript.

```ts
import piggy from "nothing-browser";

await piggy.launch();
await piggy.register("books", "https://books.toscrape.com");
await piggy.books.navigate();

const books = await piggy.books.evaluate(() =>
  Array.from(document.querySelectorAll(".product_pod")).map(el => ({
    title: el.querySelector("h3 a")?.getAttribute("title") ?? "",
    price: el.querySelector(".price_color")?.textContent?.trim() ?? "",
  }))
);

console.log(books);
await piggy.close();
```

> **📚 Full documentation is available here:**  
> [https://nothing-browser-docs.pages.dev/guide/piggy/quickstart](https://nothing-browser-docs.pages.dev/guide/piggy/quickstart)

---

## Why nothing-browser?

|                         | nothing-browser | Puppeteer | Playwright |
|------------------------|----------------|-----------|------------|
| Imports                | **1**          | 5–10      | 5–10       |
| Lines to scrape a site | **~20**        | 80–200    | 80–200     |
| Fingerprint spoofing   | ✅ built in    | ❌ plugin  | ❌ plugin  |
| Network capture        | ✅ built in    | ❌ manual  | ❌ manual  |
| Built-in API server    | ✅             | ❌        | ❌         |
| Cloudflare bypass      | ✅ passes      | ⚠️ often blocked | ⚠️ often blocked |
| **Browser → Node.js RPC** | ✅ **`exposeFunction`** | ✅ `page.exposeFunction` | ✅ `page.exposeFunction` |

One import. No 47 plugins to avoid detection. Just write your scraper and go.

---

## Requirements

- **[Bun](https://bun.sh) ≥ 1.0**
- A **Nothing Browser binary** placed in your **project root** (see [Binaries](#binaries))

---

## Binaries

Download the correct binary from **[GitHub Releases](https://github.com/BunElysiaReact/nothing-browser/releases)**.

| Binary | What it is | Where it goes |
|--------|-----------|---------------|
| `nothing-browser` | Full UI browser app (DevTools, YouTube, Plugins) | Install system-wide |
| `nothing-browser-headless` | No window, no GPU – for automated scraping | **Your project root** |
| `nothing-browser-headful` | Visible window, script-controlled – for debugging | **Your project root** |

The library communicates with the binary in your project root over a local socket.

---

## Install

```bash
bun add nothing-browser
```

Then download the binary and place it in your project root.

<details>
<summary><strong>Linux</strong></summary>

```bash
# Headless (most common for scraping)
tar -xzf nothing-browser-headless-*-linux-x86_64.tar.gz
chmod +x nothing-browser-headless

# Headful (visible window)
tar -xzf nothing-browser-headful-*-linux-x86_64.tar.gz
chmod +x nothing-browser-headful

# Full browser (system-wide)
sudo dpkg -i nothing-browser_*_amd64.deb
```
</details>

<details>
<summary><strong>Windows</strong></summary>

Download the `.zip` → extract → place `.exe` in your project root.
</details>

<details>
<summary><strong>macOS</strong></summary>

Download the `.tar.gz` → extract → place binary in your project root.
</details>

---

## Headless vs Headful

```ts
// Headless – no display, runs anywhere (default)
await piggy.launch({ mode: "tab", binary: "headless" });

// Headful – visible window for debugging
await piggy.launch({ mode: "tab", binary: "headful" });
```

Switching is just changing one word.

---

## Key Features (with Examples)

### 🔥 Browser → Node.js RPC (`exposeFunction`)

Call Node.js functions directly from browser JavaScript.

```ts
await piggy.whatsapp.exposeFunction("onNewMessage", async (message) => {
  await db.messages.insert(message);
  return { saved: true, id: crypto.randomUUID() };
});
```

### 📡 Request Interception

Block, redirect, or serve custom responses.

```ts
await piggy.app.intercept.respond("*/api/users*", async () => ({
  status: 200,
  body: JSON.stringify([{ id: 1, name: "Cached User" }])
}));
```

### 🧠 Human Mode

Add random delays, typos, and natural scrolling.

```ts
piggy.actHuman(true);
await piggy.books.click(".product_pod h3 a");
```

### 💾 Session Persistence

Save and restore cookies, storage, and state.

```ts
await piggy.site.session.export(); // save
await piggy.site.session.import(data); // restore
```

### 🚀 Built‑in API Server

Turn your scraper into a REST API.

```ts
piggy.books.api("/list", async () => ({ books }));
await piggy.serve(3000);
// GET http://localhost:3000/books/list
```

> **For many more examples** (WebSocket capture, multi‑site scraping, PDF/screenshot, middleware, etc.), see the **[full documentation](https://nothing-browser-docs.pages.dev/guide/piggy/quickstart)**.

---

## API Reference (Quick)

### Core

| Method | Description |
|--------|-------------|
| `piggy.launch(opts?)` | Start browser (`mode`, `binary`) |
| `piggy.register(name, url)` | Register a site → `piggy.<name>` |
| `piggy.actHuman(enable)` | Enable human‑like timing |
| `piggy.expose(name, handler)` | Global RPC function |
| `piggy.serve(port)` | Start API server |
| `piggy.close(opts?)` | Close gracefully or force |

### Site Methods

| Category | Methods |
|----------|---------|
| **Navigation** | `navigate()`, `reload()`, `goBack()`, `goForward()`, `waitForSelector()` |
| **Interactions** | `click()`, `type()`, `hover()`, `select()`, `keyboard.press()`, `scroll.to()` |
| **Data** | `evaluate()`, `fetchText()`, `fetchLinks()`, `fetchImages()` |
| **RPC** | `exposeFunction()`, `unexposeFunction()`, `exposeAndInject()` |
| **Network** | `capture.start()`, `intercept.respond()`, `intercept.modifyResponse()`, `blockImages()` |
| **Session** | `cookies.set()`, `session.export()`, `session.import()` |
| **Output** | `screenshot()`, `pdf()` |

> **Full API reference:** [https://nothing-browser-docs.pages.dev/guide/piggy/api-reference](https://nothing-browser-docs.pages.dev/guide/piggy/api-reference)

---

## How `exposeFunction` Works

1. Browser injects a Promise‑returning stub into `window.fnName`.
2. Calls are queued to `__NOTHING_QUEUE__`.
3. C++ polls the queue (every 250ms) and sends the call via socket.
4. Your Node.js handler runs.
5. The result is sent back and the browser’s Promise resolves.

The function survives page navigations (injected at `DocumentCreation`) and works in both tab and process modes.

---

## Binary Download Links

| Platform | Headless | Headful | Full Browser |
|----------|----------|---------|--------------|
| Linux x86_64 (deb) | `nothing-browser-headless_*_amd64.deb` | `nothing-browser-headful_*_amd64.deb` | `nothing-browser_*_amd64.deb` |
| Linux x86_64 (tar.gz) | `nothing-browser-headless-*-linux-x86_64.tar.gz` | `nothing-browser-headful-*-linux-x86_64.tar.gz` | `nothing-browser-*-linux-x86_64.tar.gz` |
| Windows x64 | `nothing-browser-headless-*-windows-x64.zip` | `nothing-browser-headful-*-windows-x64.zip` | `nothing-browser-*-windows-x64.zip` |
| macOS | `nothing-browser-headless-*-macos.tar.gz` | `nothing-browser-headful-*-macos.tar.gz` | `nothing-browser-*-macos.dmg` |

➡️ **[All releases on GitHub](https://github.com/BunElysiaReact/nothing-browser/releases)**

---

## Contributing & Security

- **Contributing:** See the [Contributing Guide](https://nothing-browser-docs.pages.dev/guide/community/contributing)
- **Security issues:** Email `ernesttechhouse@gmail.com` (not a public issue)

---

## License

MIT © [Ernest Tech House](https://github.com/BunElysiaReact/nothing-browser)

---

*Part of the [Nothing Ecosystem](https://nothing-browser-docs.pages.dev). Built in Kenya 🇰🇪*