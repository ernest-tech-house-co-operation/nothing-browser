
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

---

A scraper-first headless browser library powered by the Nothing Browser Qt6/Chromium engine. Control real browser tabs, intercept network traffic, spoof fingerprints, capture WebSockets — all from Bun + TypeScript.

---

## Why nothing-browser

Yes, we are bragging. Here's why.

| | nothing-browser | Puppeteer | Playwright |
|---|---|---|---|
| Imports | **1** | 5–10 | 5–10 |
| Lines to scrape a site | **~20** | 80–200 | 80–200 |
| Fingerprint spoofing | ✅ built in | ❌ plugin needed | ❌ plugin needed |
| Network capture | ✅ built in | ❌ manual | ❌ manual |
| Built-in API server | ✅ | ❌ | ❌ |
| Cloudflare bypass | ✅ passes | ⚠️ often blocked | ⚠️ often blocked |
| Headless detection bypass | ✅ built in | ❌ manual | ❌ manual |
| Session persistence | ✅ built in | ❌ manual | ❌ manual |
| Human mode | ✅ built in | ❌ manual | ❌ manual |
| **Browser → Node.js RPC** | ✅ **exposeFunction** | ✅ page.exposeFunction | ✅ page.exposeFunction |

One import. No middleware soup. No 47 plugins to avoid detection. No CAPTCHAs on sites that Puppeteer chokes on. Just write your scraper and go.

---

## Requirements

- [Bun](https://bun.sh) ≥ 1.0
- A Nothing Browser binary placed in your **project root** (see below)

---

## Binaries

There are three binaries. All downloaded from the same place — [GitHub Releases](https://github.com/BunElysiaReact/nothing-browser/releases).

| Binary | What it is | Where it goes |
|--------|-----------|---------------|
| `nothing-browser` | Full UI browser app — DevTools, YouTube tab, Plugins, etc. | Install system-wide |
| `nothing-browser-headless` | No window, no GPU. Runs as a background daemon for the scraping lib. | **Your project root** |
| `nothing-browser-headful` | Visible browser window, script-controlled. Useful when a site needs a real display. | **Your project root** |

The lib talks to whichever binary is in your project root over a local socket. You pick headless or headful depending on your use case.

---

## Install

```bash
bun add nothing-browser
```

Then download the binary for your platform from [GitHub Releases](https://github.com/BunElysiaReact/nothing-browser/releases) and place it in your project root.

### Linux

**Headless** (no visible window — most common for scraping)
```bash
tar -xzf nothing-browser-headless-*-linux-x86_64.tar.gz
chmod +x nothing-browser-headless
```

**Headful** (visible window, script-controlled)
```bash
tar -xzf nothing-browser-headful-*-linux-x86_64.tar.gz
chmod +x nothing-browser-headful
```

**Full browser** (system-wide install, for using the UI)
```bash
sudo dpkg -i nothing-browser_*_amd64.deb
```

### Windows

Download the `.zip` → extract → place the exe in your project root.

### macOS

Download the `.tar.gz` → extract → place the binary in your project root.

---

## Quick Start

```ts
import piggy from "nothing-browser";

await piggy.launch({ mode: "tab" });
await piggy.register("books", "https://books.toscrape.com");

await piggy.books.navigate();
await piggy.books.waitForSelector(".product_pod");

const books = await piggy.books.evaluate(() =>
  Array.from(document.querySelectorAll(".product_pod")).map(el => ({
    title: el.querySelector("h3 a")?.getAttribute("title") ?? "",
    price: el.querySelector(".price_color")?.textContent?.trim() ?? "",
  }))
);

console.log(books);
await piggy.close();
```

That's it. One import, one register, scrape, done.

---

## Headless vs Headful

**Headless** — no display needed, runs anywhere including CI.

```ts
await piggy.launch({ mode: "tab", binary: "headless" }); // default
```

**Headful** — opens a real visible Chromium window your script drives. Use this when a site detects headless or requires a real display.

```ts
await piggy.launch({ mode: "tab", binary: "headful" });
```

Same API either way. Switching is just changing one word.

---

## Examples

### 🔥 NEW: Browser → Node.js RPC with `exposeFunction`

Call Node.js functions directly from browser JavaScript. Perfect for:
- Processing data in real-time as the user navigates
- Handling authentication callbacks
- Streaming WebSocket messages to your backend
- Building browser extensions with Node.js power

```ts
import piggy from "nothing-browser";

await piggy.launch({ mode: "tab" });
await piggy.register("whatsapp", "https://web.whatsapp.com");

// Expose a function that WhatsApp Web can call
await piggy.whatsapp.exposeFunction("onNewMessage", async (message) => {
  console.log("📱 New message:", message);
  
  // Save to database
  await db.messages.insert({
    text: message.text,
    sender: message.sender,
    timestamp: message.timestamp,
  });
  
  // Return value goes back to the browser
  return { saved: true, id: crypto.randomUUID() };
});

// Inject the listener that calls our exposed function
await piggy.whatsapp.evaluate(() => {
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.message-in:not([data-seen])').forEach(el => {
      el.dataset.seen = '1';
      
      // Call the exposed function - returns a Promise!
      window.onNewMessage({
        text: el.innerText,
        timestamp: Date.now(),
        sender: el.querySelector('.sender')?.innerText,
      }).then(result => {
        console.log('Message saved with ID:', result.id);
        el.style.borderLeft = '3px solid green';
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
});

console.log("Listening for WhatsApp messages...");
```
You're absolutely right. Let me add those two critical features to the README documentation. Here's the updated section to add:

## Add this new section after the "Expose Function" section:

```markdown
---

### Request Interception with Custom Response

Block, redirect, or **serve custom responses** to network requests. Perfect for:
- Caching API responses locally
- Mocking endpoints during development
- Serving a local web version cache
- Modifying response bodies on the fly

```ts
import piggy from "nothing-browser";

await piggy.launch({ mode: "tab" });
await piggy.register("app", "https://your-app.com");

// Serve custom response for specific requests
await piggy.app.intercept.respond(
  "*/api/users*",
  async (request) => {
    // Return custom response
    return {
      status: 200,
      contentType: "application/json",
      headers: { "X-Cache": "HIT" },
      body: JSON.stringify({
        users: [
          { id: 1, name: "Cached User 1" },
          { id: 2, name: "Cached User 2" },
        ]
      })
    };
  }
);

// Serve static file from disk
await piggy.app.intercept.respond(
  "*/assets/bundle.js",
  async () => {
    const cached = await Bun.file("./cache/bundle.js").text();
    return {
      status: 200,
      contentType: "application/javascript",
      body: cached,
      headers: { "X-Served-From": "local-cache" }
    };
  }
);

// Dynamic response based on request
await piggy.app.intercept.respond(
  "*/api/product/*",
  async (request) => {
    const productId = request.url.match(/\/product\/(\d+)/)?.[1];
    
    // Check local cache
    const cached = await db.products.find(productId);
    if (cached) {
      return {
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(cached),
        headers: { "X-Cache": "HIT" }
      };
    }
    
    // Let the request through to the server
    return null;
  }
);

// Modify response on the fly
await piggy.app.intercept.modifyResponse(
  "*/api/feed*",
  async (response) => {
    const data = await response.json();
    
    // Add custom field to every item
    data.items = data.items.map(item => ({
      ...item,
      _cached_at: Date.now(),
      _source: 'modified-by-interceptor'
    }));
    
    return {
      body: JSON.stringify(data),
      headers: { "X-Modified": "true" }
    };
  }
);

await piggy.app.navigate();
```

### Response Interceptor API

```ts
// Full response replacement
site.intercept.respond(pattern, handler)
// handler: (request: { 
//   url: string, 
//   method: string, 
//   headers: Record<string, string>,
//   body?: string 
// }) => Promise<{
//   status?: number,           // default: 200
//   contentType?: string,       // default: auto-detect
//   headers?: Record<string, string>,
//   body: string | Buffer
// } | null>                    // return null to pass through

// Modify existing response
site.intercept.modifyResponse(pattern, handler)
// handler: (response: {
//   status: number,
//   headers: Record<string, string>,
//   body: string,
//   json: () => Promise<any>
// }) => Promise<{
//   status?: number,
//   headers?: Record<string, string>,
//   body?: string
// }>

// Block requests (existing)
site.intercept.block(pattern)

// Redirect requests (existing)
site.intercept.redirect(pattern, redirectUrl)

// Add/modify request headers (existing)
site.intercept.headers(pattern, headers)

// Clear all rules for this site
site.intercept.clear()
```

### Web Version Cache Example

```ts
import piggy from "nothing-browser";

// Build a complete offline cache of your web app
const cache = new Map();

await piggy.launch({ mode: "tab" });
await piggy.register("spa", "https://your-spa.com");

// Cache all static assets
await piggy.spa.intercept.respond("*.js", async (req) => {
  const key = req.url;
  if (!cache.has(key)) {
    const response = await fetch(req.url);
    cache.set(key, await response.text());
    console.log(`Cached: ${key}`);
  }
  return {
    status: 200,
    contentType: "application/javascript",
    body: cache.get(key),
    headers: { "X-Cache": "HIT" }
  };
});

await piggy.spa.intercept.respond("*.css", async (req) => {
  const key = req.url;
  if (!cache.has(key)) {
    const response = await fetch(req.url);
    cache.set(key, await response.text());
  }
  return {
    status: 200,
    contentType: "text/css",
    body: cache.get(key)
  };
});

// Cache API responses with TTL
const apiCache = new Map();
await piggy.spa.intercept.respond("*/api/*", async (req) => {
  const key = `${req.method}:${req.url}`;
  const cached = apiCache.get(key);
  
  if (cached && Date.now() < cached.expires) {
    return {
      status: 200,
      contentType: "application/json",
      body: cached.data,
      headers: { "X-Cache": "HIT", "X-Cache-Age": String(Date.now() - cached.timestamp) }
    };
  }
  
  // Pass through - will be cached by modifyResponse
  return null;
});

await piggy.spa.intercept.modifyResponse("*/api/*", async (res) => {
  const key = `${res.url}`;
  const data = await res.json();
  
  apiCache.set(key, {
    data: JSON.stringify(data),
    timestamp: Date.now(),
    expires: Date.now() + 5 * 60 * 1000 // 5 minutes
  });
  
  return {
    body: JSON.stringify(data),
    headers: { ...res.headers, "X-Cache": "MISS" }
  };
});

await piggy.spa.navigate();
// App now runs mostly from local cache!
```

---

### Evaluate on New Document (Script Injection)

Inject JavaScript before any page JavaScript runs. Equivalent to Puppeteer's `page.evaluateOnNewDocument()`. Perfect for:
- Overriding browser APIs before they're accessed
- Setting up global state before page loads
- Disabling features like WebRTC, Canvas, etc.
- Installing persistent event listeners

```ts
import piggy from "nothing-browser";

await piggy.launch({ mode: "tab" });
await piggy.register("site", "https://example.com");

// Inject before ANY page script runs
await piggy.site.addInitScript(`
  // Override navigator properties
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined
  });
  
  // Disable WebRTC
  Object.defineProperty(navigator, 'mediaDevices', {
    get: () => undefined
  });
  
  // Mock geolocation
  navigator.geolocation.getCurrentPosition = (success) => {
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      },
      timestamp: Date.now()
    });
  };
  
  // Set up global state
  window.__MY_APP_CONFIG__ = {
    apiUrl: 'https://my-api.com',
    debug: true,
    version: '1.0.0'
  };
  
  console.log('[InitScript] Injected before page load');
`);

// Add multiple init scripts
await piggy.site.addInitScript(`
  // Second script - runs in order
  window.__FEATURE_FLAGS__ = {
    newUI: true,
    beta: false
  };
`);

// Add init script from a function
await piggy.site.addInitScript(() => {
  // This function will be stringified and injected
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('[Fetch]', args[0]);
    return originalFetch.apply(this, args);
  };
  
  // Disable battery API
  if (navigator.getBattery) {
    navigator.getBattery = undefined;
  }
});

// Add init script that runs in all frames
await piggy.site.addInitScript(`
  // This runs in iframes too
  if (window.self !== window.top) {
    console.log('[InitScript] Running in iframe');
  }
`, { runInAllFrames: true });

// Remove a specific init script
const scriptId = await piggy.site.addInitScript(`...`);
await piggy.site.removeInitScript(scriptId);

// Clear all init scripts
await piggy.site.clearInitScripts();

// Now navigate - scripts will run BEFORE page loads
await piggy.site.navigate();
```

### Init Script API

```ts
// Add script that runs before every page load
site.addInitScript(script, options?)
// script: string | (() => void)
// options: {
//   runInAllFrames?: boolean,        // default: false
//   world?: "main" | "isolated",     // default: "main"
//   name?: string                     // optional identifier
// }
// Returns: string (script ID)

// Remove specific init script
site.removeInitScript(scriptId)

// Remove all init scripts
site.clearInitScripts()

// Get all registered init scripts
site.getInitScripts()
// Returns: Array<{ id: string, name?: string, runInAllFrames: boolean }>
```

### Advanced: Persistent Init Scripts Across Navigations

```ts
// Scripts survive navigation automatically!
await piggy.site.addInitScript(`
  window.__SESSION_ID__ = '${crypto.randomUUID()}';
  window.__START_TIME__ = Date.now();
`);

await piggy.site.navigate("https://example.com/page1");
// Script runs here ✓

await piggy.site.click("a[href='/page2']");
await piggy.site.waitForNavigation();
// Script runs again automatically ✓

// Check that it persisted
const sessionId = await piggy.site.evaluate(() => window.__SESSION_ID__);
console.log(sessionId); // Same UUID across pages!
```

### Complete Anti-Detection Setup

```ts
import piggy from "nothing-browser";

await piggy.launch({ mode: "tab", binary: "headful" });
await piggy.register("stealth", "https://example.com");

// Built-in fingerprint spoofing is already enabled
// Add additional init scripts for maximum stealth

await piggy.stealth.addInitScript(`
  // Remove automation traces
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
  delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
  
  // Override permissions
  const originalQuery = window.navigator.permissions.query;
  window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications' ||
    parameters.name === 'geolocation' ||
    parameters.name === 'camera' ||
    parameters.name === 'microphone'
  ) ? Promise.resolve({ state: 'prompt', onchange: null }) 
    : originalQuery(parameters);
  
  // Fake plugins
  Object.defineProperty(navigator, 'plugins', {
    get: () => [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
      { name: 'Native Client', filename: 'internal-nacl-plugin' }
    ]
  });
  
  // Fake languages
  Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en']
  });
  
  // WebGL vendor spoof
  const getParameter = WebGLRenderingContext.prototype.getParameter;
  WebGLRenderingContext.prototype.getParameter = function(parameter) {
    if (parameter === 37445) return 'Intel Inc.';
    if (parameter === 37446) return 'Intel Iris OpenGL Engine';
    return getParameter.call(this, parameter);
  };
`);

// Block tracking domains
await piggy.stealth.intercept.block("*google-analytics.com*");
await piggy.stealth.intercept.block("*doubleclick.net*");
await piggy.stealth.intercept.block("*facebook.com/tr*");

// Add human-like behavior
piggy.actHuman(true);

await piggy.stealth.navigate();
// You're now virtually undetectable
```

---

## Updated API Reference Section
```ts
// Block requests (existing)
site.intercept.block(pattern)

// Redirect requests (existing)
site.intercept.redirect(pattern, redirectUrl)

// Add/modify request headers (existing)
site.intercept.headers(pattern, headers)

// 🔥 NEW: Serve custom response
site.intercept.respond(pattern, handler)
// handler receives request details, returns response or null

// 🔥 NEW: Modify response on the fly
site.intercept.modifyResponse(pattern, handler)
// handler receives response, returns modifications

// Clear all rules
site.intercept.clear()
```

#### Script Injection
```ts
// 🔥 NEW: Inject before page loads (evaluateOnNewDocument)
site.addInitScript(script, options?)
// script: string | function
// options: { runInAllFrames?: boolean, world?: "main" | "isolated", name?: string }
// Returns: string (script ID)

// 🔥 NEW: Remove specific init script
site.removeInitScript(scriptId)

// 🔥 NEW: Remove all init scripts
site.clearInitScripts()

// 🔥 NEW: List all init scripts
site.getInitScripts()


```ts
await piggy.whatsapp.exposeAndInject(
  "onNewMessage",
  async (message) => {
    await saveToDatabase(message);
    return { ok: true };
  },
  (fnName) => `
    // This runs in the browser
    setInterval(() => {
      const msgs = document.querySelectorAll('.new-message');
      msgs.forEach(msg => {
        window.${fnName}({ text: msg.innerText });
      });
    }, 2000);
  `
);
```

### Structured API with multiple methods

```ts
import { createExposedAPI } from "nothing-browser/register";

await createExposedAPI(piggy.whatsapp, "whatsappAPI", {
  onMessage: async (msg) => {
    await db.messages.insert(msg);
    return { saved: true };
  },
  
  getContacts: async () => {
    return await db.contacts.findAll();
  },
  
  sendReply: async ({ to, text }) => {
    // Your sending logic here
    return { sent: true };
  }
});

// In browser JS:
const result = await window.whatsappAPI({ 
  method: 'sendReply', 
  args: { to: '+1234567890', text: 'Hello!' } 
});
```

### Global expose (available to all sites)

```ts
await piggy.expose("logToServer", async (data) => {
  console.log("[Browser]", data);
  await analytics.track(data.event, data.properties);
  return { logged: true };
});

// Any page can call: window.logToServer({ event: 'pageview' })
```

### Scrape a site and expose it as an API

```ts
import piggy from "nothing-browser";

await piggy.launch({ mode: "tab" });
await piggy.register("books", "https://books.toscrape.com");

await piggy.books.intercept.block("*google-analytics*");
await piggy.books.intercept.block("*doubleclick*");

piggy.books.api("/list", async (_params, query) => {
  const page = query.page ? parseInt(query.page) : 1;
  const url = page === 1
    ? "https://books.toscrape.com"
    : `https://books.toscrape.com/catalogue/page-${page}.html`;

  await piggy.books.navigate(url);
  await piggy.books.waitForSelector(".product_pod", 10000);

  const books = await piggy.books.evaluate(() => {
    const ratingMap: Record<string, number> = {
      One: 1, Two: 2, Three: 3, Four: 4, Five: 5,
    };
    return Array.from(document.querySelectorAll(".product_pod")).map(el => ({
      title:     el.querySelector("h3 a")?.getAttribute("title") ?? "",
      price:     el.querySelector(".price_color")?.textContent?.trim() ?? "",
      rating:    ratingMap[el.querySelector(".star-rating")?.className.replace("star-rating","").trim() ?? ""] ?? 0,
      available: el.querySelector(".availability")?.textContent?.trim() ?? "",
    }));
  });

  return { page, count: books.length, books };
}, { ttl: 300_000 });

piggy.books.noclose();
await piggy.serve(3000);
// GET http://localhost:3000/books/list
// GET http://localhost:3000/books/list?page=2
```

---

### Middleware — auth + logging

```ts
const authMiddleware = async ({ headers, set }: any) => {
  if (headers["x-api-key"] !== "secret") {
    set.status = 401;
    throw new Error("Unauthorized");
  }
};

piggy.books.api("/search", async (_params, query) => {
  // handler
}, { ttl: 120_000, before: [authMiddleware] });
```

---

### Network capture

```ts
await piggy.books.capture.clear();
await piggy.books.capture.start();
await piggy.books.wait(300);

await piggy.books.navigate("https://books.toscrape.com");
await piggy.books.waitForSelector("body", 10000);
await piggy.books.wait(2000);

await piggy.books.capture.stop();

const requests = await piggy.books.capture.requests();
const ws       = await piggy.books.capture.ws();
const cookies  = await piggy.books.capture.cookies();
const storage  = await piggy.books.capture.storage();

console.log(`${requests.length} requests, ${ws.length} WS frames`);
```

---

### Session persistence

```ts
import { existsSync, readFileSync, writeFileSync } from "fs";

const SESSION_FILE = "./session.json";

if (existsSync(SESSION_FILE)) {
  const saved = JSON.parse(readFileSync(SESSION_FILE, "utf8"));
  await piggy.books.session.import(saved);
}

process.on("SIGINT", async () => {
  const session = await piggy.books.session.export();
  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
  await piggy.close({ force: true });
  process.exit(0);
});
```

---

### Human mode

```ts
piggy.actHuman(true);

await piggy.books.click(".product_pod h3 a");
await piggy.books.type("#search", "mystery novels");
await piggy.books.scroll.by(400);
```

Affects `click`, `type`, `hover`, `scroll.by`, `wait` — random delays, simulated typos, self-correction.

---

### Screenshot / PDF

```ts
await piggy.books.screenshot("./out/page.png");
await piggy.books.pdf("./out/page.pdf");

const b64 = await piggy.books.screenshot(); // base64
```

---

### Multi-site parallel scraping

```ts
await piggy.register("site1", "https://example.com");
await piggy.register("site2", "https://example.org");

const titles = await piggy.all([piggy.site1, piggy.site2]).title();
const h1s    = await piggy.diff([piggy.site1, piggy.site2]).fetchText("h1");
// → { site1: "...", site2: "..." }
```

---

## API Reference

### `piggy.launch(opts?)`

| Option | Type | Default |
|--------|------|---------|
| `mode` | `"tab" \| "process"` | `"tab"` |
| `binary` | `"headless" \| "headful"` | `"headless"` |

### `piggy.register(name, url)`
Registers a site. Accessible as `piggy.<name>` after registration.

### `piggy.actHuman(enable)`
Toggles human-like interaction timing globally.

### `piggy.expose(name, handler, tabId?)`
Exposes a function globally (available to all tabs). The handler receives data from the browser and can return a value that resolves the Promise in the browser.

### `piggy.unexpose(name, tabId?)`
Removes a globally exposed function.

### `piggy.serve(port, opts?)`
Starts the Elysia HTTP server. Built-in routes: `GET /health`, `GET /cache/keys`, `DELETE /cache`.

### `piggy.routes()`
Returns all registered API routes with method, path, TTL, and middleware count.

### `piggy.close(opts?)`

```ts
await piggy.close();                // graceful
await piggy.close({ force: true }); // kills everything immediately
```

### Site methods

#### Navigation
```ts
site.navigate(url?)
site.reload() / site.goBack() / site.goForward()
site.waitForNavigation()
site.waitForSelector(selector, timeout?)
site.waitForResponse(urlPattern, timeout?)
site.title() / site.url() / site.content()
site.wait(ms)
```

#### Interactions
```ts
site.click(selector, opts?)
site.doubleClick(selector) / site.hover(selector)
site.type(selector, text, opts?)
site.select(selector, value)
site.keyboard.press(key)
site.keyboard.combo(combo)
site.mouse.move(x, y)
site.mouse.drag(from, to)
site.scroll.to(selector) / site.scroll.by(px)
```

#### Data
```ts
site.fetchText(selector)
site.fetchLinks(selector)
site.fetchImages(selector)
site.search.css(query) / site.search.id(query)
site.evaluate(js | fn, ...args)
```

#### 🔥 Expose Function (RPC)
```ts
// Expose a function that browser JS can call
site.exposeFunction(name, handler)
// handler: (data: any) => Promise<any> | any

// Remove an exposed function
site.unexposeFunction(name)

// Remove all exposed functions for this site
site.clearExposedFunctions()

// Expose and inject in one call
site.exposeAndInject(name, handler, injectionJs)
// injectionJs: string | ((fnName: string) => string)
```

#### Network
```ts
site.capture.start() / .stop() / .clear()
site.capture.requests() / .ws() / .cookies() / .storage()
site.intercept.block(pattern)
site.intercept.redirect(pattern, redirectUrl)
site.intercept.headers(pattern, headers)
site.intercept.clear()
site.blockImages() / site.unblockImages()
```

#### Cookies & Session
```ts
site.cookies.set(name, value, domain, path?)
site.cookies.get(name) / .delete(name) / .list()
site.session.export() / site.session.import(data)
```

#### API
```ts
site.api(path, handler, opts?)
// opts: { ttl?, method?, before?: middleware[] }

site.noclose()
site.screenshot(filePath?) / site.pdf(filePath?)
```

### Helper Functions

```ts
import { createExposedAPI } from "nothing-browser/register";

// Create a structured API with multiple methods
await createExposedAPI(site, apiName, {
  method1: async (args) => { /* ... */ },
  method2: async (args) => { /* ... */ },
});

// Browser calls: window[apiName]({ method: 'method1', args: {...} })
```

---

## How `exposeFunction` Works

1. **Browser injects stub**: `window.fnName` becomes a Promise-returning function
2. **Browser queues calls**: Arguments are pushed to `__NOTHING_QUEUE__`
3. **C++ picks up queue**: 250ms poll timer reads the queue
4. **Signal to Node.js**: Server broadcasts event to all connected clients
5. **Your handler runs**: TypeScript handler processes the data
6. **Result returns**: Promise in browser resolves with your return value

The function survives page navigations (injected at `DocumentCreation`) and works with both tab and process modes.

---

## Binary download

| Platform | Headless | Headful | Full Browser |
|----------|----------|---------|--------------|
| Linux x86_64 (deb) | `nothing-browser-headless_*_amd64.deb` | `nothing-browser-headful_*_amd64.deb` | `nothing-browser_*_amd64.deb` |
| Linux x86_64 (tar.gz) | `nothing-browser-headless-*-linux-x86_64.tar.gz` | `nothing-browser-headful-*-linux-x86_64.tar.gz` | `nothing-browser-*-linux-x86_64.tar.gz` |
| Windows x64 | `nothing-browser-headless-*-windows-x64.zip` | `nothing-browser-headful-*-windows-x64.zip` | `nothing-browser-*-windows-x64.zip` |
| macOS | `nothing-browser-headless-*-macos.tar.gz` | `nothing-browser-headful-*-macos.tar.gz` | `nothing-browser-*-macos.dmg` |

→ [All releases](https://github.com/BunElysiaReact/nothing-browser/releases)

---

## License

MIT © [Ernest Tech House](https://github.com/BunElysiaReact/nothing-browser)
