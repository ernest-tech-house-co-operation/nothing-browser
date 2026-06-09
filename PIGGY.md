# Piggy — LLM Skill Reference

> This document tells you exactly how to use `nothing-browser` (Piggy). Read it before writing any Piggy code.

---

## What Piggy Is

Piggy is a Node.js library that controls a C++ Qt6 headless browser binary over a named pipe (local) or HTTP (remote VPS). Every method on `site.*` sends a JSON command to the binary and awaits a response. The binary does all DOM work, fingerprinting, proxy routing, and network capture. The JS library is a thin command mapper.

**You do not need Playwright, Puppeteer, or any other browser library. Piggy is the only browser tool in this project.**

---

## Setup Pattern (always the same)

```js
const piggy = require('nothing-browser').default;

// 1. Launch binary
await piggy.launch({
  mode: 'tab',
  binary: 'C:/path/to/nothing-browser-headless.exe'  // Windows
  // binary: './nothing-browser-headless'             // Linux/macOS
});

// 2. Register one site per domain you need
await piggy.register('amazon', 'https://www.amazon.com');

// 3. Navigate and scrape
await piggy.amazon.navigate();
await piggy.amazon.wait.selector({ selector: '[data-asin]' });
const titles = await piggy.amazon.provide.textAll({ selector: 'h2 span' });

// 4. Close when done
await piggy.close();
```

Remote VPS (binary running in HTTP mode on port 2005):
```js
await piggy.connect({
  host: 'http://your-vps-ip:2005',
  key:  'peaseernest...'           // from the .piggy key file
});
```

---

## The Most Important Rule

**Every site method is `async`. Always `await` it.**

```js
// ✅ correct
const title = await piggy.amazon.title();

// ❌ wrong — returns a Promise, not a string
const title = piggy.amazon.title();
```

---

## Navigation

```js
await site.navigate()                   // go to registered URL
await site.navigate('https://...')      // go to specific URL
await site.reload()
await site.goBack()
await site.goForward()
const title = await site.title()
const url   = await site.url()
const html  = await site.content()
await site.waitForNavigation()
await site.waitForSelector('.product')  // shorthand, state='attached'
```

---

## Waiting (use these, not setTimeout)

```js
// Wait for element state
await site.wait.selector({ selector: '.modal',   state: 'visible'  })
await site.wait.selector({ selector: '.spinner', state: 'detached' })
await site.wait.selector({ selector: '.item',    state: 'attached' })  // default
await site.wait.selector({ selector: '.item',    state: 'hidden'   })

// Wait for custom JS condition
await site.wait.function({ js: "document.querySelectorAll('.item').length >= 10" })
await site.wait.function({ js: "window.__DATA__ && window.__DATA__.loaded", timeout: 10000 })

// Plain delay (use sparingly)
await site.wait(1000)
```

---

## Extracting Data

### Quick text / attribute

```js
const price  = await site.provide.text({ selector: '.price' })
const prices = await site.provide.textAll({ selector: '.price' })
const href   = await site.provide.attr({ selector: 'a.buy', attr: 'href' })
const hrefs  = await site.provide.attrAll({ selector: 'a', attr: 'href' })
```

### Structured

```js
const table   = await site.provide.table({ selector: '#data-table' })
// → { headers: string[], rows: string[][] }

const form    = await site.provide.form({ selector: '#checkout' })
// → { fieldName: value, ... }

const links   = await site.provide.links()
// → [{ text, href, title }]

const images  = await site.provide.images()
// → [{ src, alt, width, height }]

const meta    = await site.provide.meta()
// → { description: '...', 'og:title': '...', ... }

const select  = await site.provide.select({ selector: '#country' })
// → { value: 'US', options: [{ text, value, selected }] }

const json    = await site.provide.json()
// → parsed JSON-LD or __NEXT_DATA__ etc
```

### Heavy data (arrays of objects) — use evaluate

```js
const products = await site.evaluate(`
  Array.from(document.querySelectorAll('[data-asin]')).map(el => ({
    asin:  el.getAttribute('data-asin'),
    title: el.querySelector('h2 span')?.textContent?.trim(),
    price: parseFloat(el.querySelector('.a-price-whole')?.textContent || '0'),
  }))
`)
```

---

## Finding Elements (returns ElementDescriptor[])

```js
const cards = await site.find.css('.product-card')
// → [{ tag, id, cls, text, html, attrs, href, src, value }]

// Use card.cls for parent scoping in provide.*
const price = await site.provide.text({ selector: '.price', parent: cards[0].cls })

// Other find methods
await site.find.byText({ text: 'Add to Cart', exact: true })
await site.find.byAttr({ attr: 'data-id', value: '42' })
await site.find.byRole({ role: 'button', name: 'Submit' })
await site.find.exists('.modal')    // → boolean
await site.find.count('.item')      // → number
await site.find.visible('.btn')     // → boolean
```

---

## Interactions

```js
await site.click('#submit')
await site.type('#search', 'laptop', { clear: true })
await site.select('#country', 'US')
await site.hover('.dropdown')
await site.scroll.to('#footer')
await site.scroll.by(500)
await site.keyboard.press('Enter')
await site.keyboard.combo('Control+A')
```

**Dialog warning:** Never `await` a click that opens an alert/confirm/prompt — the page freezes. Do:
```js
site.click('#delete-btn').catch(() => {})
await site.wait(500)
await site.dialog.accept()
```

---

## Human Mode

```js
// Global — adds random delays to all interactions
piggy.actHuman(true)

// Per-site profile
await site.human.set({ typingSpeed: 'slow', clickDelay: 'cautious', mouseWiggle: true })
await site.human.type({ selector: '#password', text: 'secret', clear: true })
await site.human.click({ selector: 'button[type=submit]' })
```

---

## Cookies

```js
await site.cookies.set('session', 'abc123', 'example.com')
const cookie = await site.cookies.get('session', 'example.com')
await site.cookies.delete('session', 'example.com')   // domain required
const all = await site.cookies.list()
```

---

## Session Persistence

```js
const session = await site.session.export()
// save to disk...

await site.session.import(savedSession)
await site.navigate()   // already logged in

await site.session.reload()   // hot-reload cookies.json from disk
```

---

## Expose Function (Browser → Node RPC)

```js
await site.exposeFunction('saveProduct', async (data) => {
  await db.insert(data)
  return { saved: true }
})

// Browser can now call: const result = await window.saveProduct({ ... })
```

One-shot expose + inject:
```js
await site.exposeAndInject(
  'onMessage',
  async (data) => { console.log(data) },
  (fnName) => `
    document.addEventListener('click', e => window.${fnName}({ x: e.clientX }))
  `
)
```

---

## Network Capture

```js
await site.capture.start()
await site.navigate('https://example.com/login')
await site.capture.stop()

const requests = await site.capture.requests()
const loginReq = requests.find(r => r.url.includes('/api/login'))
console.log(JSON.parse(loginReq.resBody))

const wsFrames = await site.capture.ws()
```

---

## Request Interception

```js
// Block trackers
await site.intercept.block('*google-analytics.com*')

// Mock an API
await site.intercept.respond('/api/products', {
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify([{ id: 1, name: 'Test' }])
})

// Add auth header
await site.intercept.headers('*/api/*', { Authorization: `Bearer ${token}` })

// Modify real response
await site.intercept.modifyResponse('*/api/feed*', async (res) => {
  const data = await res.json()
  data.items = data.items.map(i => ({ ...i, _scraped: true }))
  return { body: JSON.stringify(data) }
})
```

---

## Proxy

```js
await piggy.proxy.load('./proxies.txt')
await piggy.proxy.test()
await piggy.proxy.rotation('perrequest')
await piggy.proxy.config({ skipDead: true })

piggy.proxy.on('proxy:exhausted', async () => {
  await piggy.proxy.fetch('https://api.proxy-service.com/list.txt')
  await piggy.proxy.test()
})
```

---

## Multi-Site Parallel

```js
await piggy.register('amazon', 'https://amazon.com')
await piggy.register('ebay',   'https://ebay.com')

// Parallel — returns array
const titles = await piggy.all([piggy.amazon, piggy.ebay]).title()
// ['Amazon title', 'eBay title']

// Parallel — returns named object
const titles = await piggy.diff([piggy.amazon, piggy.ebay]).title()
// { amazon: 'Amazon title', ebay: 'eBay title' }
```

---

## API Server

Routes are registered as commands to the C++ binary (Elysia runs inside the binary):

```js
piggy.amazon.api('/search', async (params, query, body) => {
  const term = query.q ?? 'laptop'
  await piggy.amazon.navigate(`https://amazon.com/s?k=${term}`)
  await piggy.amazon.wait.selector({ selector: '[data-asin]' })
  const asins = await piggy.amazon.provide.attrAll({ selector: '[data-asin]', attr: 'data-asin' })
  return { term, count: asins.length, asins }
}, { ttl: 60000, method: 'GET' })

await piggy.serve(3000, { title: 'Amazon API', version: '1.0.0' })
// GET http://localhost:3000/amazon/search?q=laptop
// Docs http://localhost:3000/openapi
// Health http://localhost:3000/health
```

---

## Plugins

Piggy has four official plugins. Every plugin uses `piggy.extend()` except `nothing-store` which uses `store.attach(piggy)`. Always install plugins **after** `piggy.launch()` and **after** `piggy.register()`.
plugins in piggy are esentialy topping piggy can scrape very effectivelywithout any plugins because the developer put the logic in c++ plugins just give you more control over solid apis the storage api is included in the official ibrary but nothing-storage(you will read about it soon) gives the user more control over the api
---

### nothing-whatsapp

**Install:**
```bash
npm install nothing-whatsapp
```

**When to use:** Any WhatsApp Web automation — listening for messages, sending messages, getting chats/contacts, reacting, deleting, archiving.

**Full setup:**
```js
const piggy = require('nothing-browser').default;
const wa    = require('nothing-whatsapp');

await piggy.launch({ mode: 'tab', binary: 'C:/path/nothing-browser-headless.exe' });
await piggy.register('whatsapp', 'https://web.whatsapp.com', { single: true });

// Install plugin AFTER register
await piggy.extend(
  wa({
    onReady:      (d) => console.log('WAWeb ready, version:', d.version),
    onMessage:    (d) => console.log('New message:', d.body),
    onMessageAck: (d) => console.log('Ack:', d.ack),
    onStateChange:(d) => console.log('State:', d.state),
    onSynced:     ()  => console.log('Synced'),
    onQR:         (d) => console.log('Scan QR:', d.qrData),
    onScanned:    ()  => console.log('Authenticated!'),
    onQRTimeout:  ()  => console.log('QR rotated'),
  })
);

await piggy.whatsapp.navigate();
```

**All callback options:**

| Option | When fired |
|--------|-----------|
| `onReady(d)` | WAWeb fully booted. `d.version` = WAWeb version string |
| `onSynced()` | Message sync complete |
| `onStateChange(d)` | Connection state changed. `d.state` = string |
| `onBattery(d)` | Battery info. `d.battery` = object |
| `onError(d)` | Boot/internal error. `d.stage`, `d.message` |
| `onMessage(d)` | New incoming message. `d` = serialized message object |
| `onMessageChange(d)` | Message updated |
| `onMessageAck(d)` | Read receipt. `d.ack` = number |
| `onMessageRevoke(d)` | Message deleted |
| `onMessageEdit(d)` | Message edited. `d.newBody`, `d.prevBody` |
| `onMediaUploaded(d)` | Media upload complete |
| `onCiphertext(d)` | Encrypted message (resend triggered automatically) |
| `onChatUnread(d)` | Chat unread count changed |
| `onChatRemoved(d)` | Chat deleted |
| `onQR(d)` | QR ready. `d.qrData` = `'data:image/png;base64,...'` |
| `onScanned()` | QR scanned, session authenticated |
| `onQRTimeout()` | QR expired and rotated (~20s) |

**Or use `site.on()` directly (no callback options needed):**
```js
piggy.whatsapp.on('message',      d => console.log(d.body))
piggy.whatsapp.on('qr',           d => console.log(d.qrData))
piggy.whatsapp.on('qr:scanned',   () => console.log('authenticated'))
piggy.whatsapp.on('wa:ready',     d => console.log(d.version))
piggy.whatsapp.on('message:ack',  d => console.log(d.ack))
```

**`site.wa.*` API (all async):**
```js
// Auth
await piggy.whatsapp.wa.getConnectionInfo()     // → { wid, ... }
await piggy.whatsapp.wa.isAuthenticated()        // → boolean

// Messages
await piggy.whatsapp.wa.getMessageById(id)
await piggy.whatsapp.wa.getChatMessages(chatId, limit?)   // default 50

// Chats
await piggy.whatsapp.wa.getChatById(chatId)
await piggy.whatsapp.wa.getAllChats()

// Contacts
await piggy.whatsapp.wa.getContactById(contactId)
await piggy.whatsapp.wa.getAllContacts()
await piggy.whatsapp.wa.getProfilePicUrl(contactId)

// Actions
await piggy.whatsapp.wa.sendMessage(chatId, content, opts?)
await piggy.whatsapp.wa.sendSeen(chatId)
await piggy.whatsapp.wa.sendReaction(messageId, reaction)  // e.g. '👍'
await piggy.whatsapp.wa.deleteMessage(messageId, everyone?)
await piggy.whatsapp.wa.starMessage(messageId, star)
await piggy.whatsapp.wa.archiveChat(chatId, archive)
await piggy.whatsapp.wa.muteChat(chatId, duration?)
await piggy.whatsapp.wa.pinChat(chatId, pin)
await piggy.whatsapp.wa.setPresence(chatId, available)

// Custom JS with auto-serialization (safe for Backbone/circular refs)
await piggy.whatsapp.wa.evaluate(js)
await piggy.whatsapp.wa.evaluateHeavy(js)   // wraps in safeSerialize
```

**Force fresh QR (clear session):**
```js
// Requires nothing-innerstorage
await piggy.whatsapp.store.clear()
await piggy.whatsapp.navigate()
```

---

### nothing-innerstorage

**Install:**
```bash
npm install nothing-innerstorage
```

**When to use:** Reading or writing `localStorage`/`sessionStorage`/`IndexedDB` from Node.js, saving/restoring full session snapshots, forcing a fresh login.

**Setup:**
```js
const storage = require('nothing-innerstorage');

await piggy.launch({ ... });
await piggy.register('whatsapp', 'https://web.whatsapp.com');

await piggy.extend(storage());   // installs site.store namespace
```

**Full API (`site.store.*`):**
```js
// Dump all storage at once
await site.store.dump()          // → { localStorage: {}, sessionStorage: {} }

// Clear ALL localStorage + sessionStorage (force fresh QR / fresh login)
await site.store.clear()

// localStorage
await site.store.local.get('keyName')         // auto JSON.parse
await site.store.local.set('keyName', value)  // auto JSON.stringify
await site.store.local.delete('keyName')
await site.store.local.clear()
await site.store.local.all()                  // → plain object

// sessionStorage
await site.store.session.get('keyName')
await site.store.session.set('keyName', value)
await site.store.session.delete('keyName')
await site.store.session.clear()
await site.store.session.all()

// IndexedDB
await site.store.idb.databases()              // → [{ name, version }]
await site.store.idb.export('wawc', 'user-device')   // → records[]
await site.store.idb.clearStore('wawc', 'user-device')

// Snapshots (localStorage + sessionStorage + cookies in one object)
const snap = await site.store.snapshot()
require('fs').writeFileSync('./session.json', JSON.stringify(snap))

const snap = JSON.parse(require('fs').readFileSync('./session.json'))
await site.store.restore(snap)
await site.navigate()            // loads straight into authenticated session
```

---

### nothing-store

**Install:**
```bash
npm install nothing-store
# SQLite support (optional)
npm install better-sqlite3
```

**When to use:** Saving scraped data to disk with schema validation. Drops extra fields. Coerces types. Writes JSON or SQLite.

**Step 1 — create `piggy.store.json` in your project root:**
```json
{
  "stores": [
    {
      "name": "products",
      "destination": "./data/products.json",
      "fields": {
        "id":       { "type": "string" },
        "title":    { "type": "string" },
        "price":    { "type": "number" },
        "inStock":  { "type": "boolean", "default": false },
        "category": { "type": "string",  "default": "Uncategorized" }
      }
    },
    {
      "name": "errors",
      "destination": "./data/errors.db",
      "fields": {
        "url":     { "type": "string" },
        "message": { "type": "string" },
        "ts":      { "type": "number" }
      }
    }
  ]
}
```

**Step 2 — attach:**
```js
const store = require('nothing-store');

await piggy.launch({ ... });
await piggy.register('amazon', 'https://www.amazon.com');

store.attach(piggy);   // NOT piggy.extend() — use store.attach()
```

**Step 3 — use:**
```js
// Schema name defaults to the site name ('amazon' → looks for store named 'amazon')
const result = await piggy.amazon.store(products)
// → { stored: 20, skipped: 0 }

// Explicit schema name
const result = await piggy.amazon.store(products, 'products')
const result = await piggy.amazon.store({ url, message, ts }, 'errors')

// Single record or array — both work
await piggy.amazon.store({ id: '1', title: 'Mouse', price: 29.99 })
await piggy.amazon.store([...manyProducts])
```

**Schema rules:**

| Situation | Result |
|-----------|--------|
| Extra field in data | Silently dropped |
| Missing field, has `default` | Uses default value |
| Missing field, no default | Stored as `null` |
| `number` field gets `'29.99'` string | Coerced to `29.99` |
| `number` field gets `'abc'` | Stored as `null` |
| Non-object record in array | Skipped, counted in `skipped` |

**SQLite:** change `destination` to `.db` — same code, writes to a table named after the store. `_id` and `_ts` columns added automatically.

**Reload schema without restart:**
```js
store.reloadSchema()
```

---

### nothing-qrcpp

**Install:**
```bash
npm install nothing-qrcpp
```

**When to use:** When you need typed QR callbacks for WhatsApp or any site that emits `qr`/`qr:scanned`/`qr:timeout` events. The C++ QR detector runs automatically without this package — this just adds typed callbacks and the `site.qr` control API.

**Setup:**
```js
const qrcpp = require('nothing-qrcpp');

await piggy.launch({ ... });
await piggy.register('whatsapp', 'https://web.whatsapp.com', { single: true });

await piggy.extend(
  qrcpp({
    onQR:      (d) => console.log(`Scan QR (attempt ${d.attempts}):`, d.qrData),
    onScanned: ()  => console.log('Authenticated!'),
    onTimeout: ()  => console.log('QR rotated — new one coming...'),
  })
);

await piggy.whatsapp.navigate();
```

**Callbacks:**

| Option | `data` | When |
|--------|--------|------|
| `onQR(d)` | `{ tabId, qrData, attempts }` | New or rotated QR. `qrData` = `'data:image/png;base64,...'` |
| `onScanned(d)` | `{ tabId }` | QR canvas disappeared — auth succeeded |
| `onTimeout(d)` | `{ tabId }` | QR expired and rotated (~20s) |

**`site.qr` control API (added by this plugin):**
```js
const state = await piggy.whatsapp.qr.status()
// → { waiting: true, attempts: 2 }

await piggy.whatsapp.qr.force()   // skip the 500ms poll, check immediately
```

**Without this package** (the events fire regardless):
```js
piggy.whatsapp.on('qr',         d => console.log(d.qrData))
piggy.whatsapp.on('qr:scanned', () => console.log('done'))
piggy.whatsapp.on('qr:timeout', () => console.log('rotated'))
```

---

### Plugin install order

Always:
1. `piggy.launch()` or `piggy.connect()`
2. `piggy.register(name, url)`
3. Install plugins (`piggy.extend(...)` or `store.attach(piggy)`)
4. `site.navigate()`

```js
// ✅ correct order
await piggy.launch({ binary: '...' });
await piggy.register('whatsapp', 'https://web.whatsapp.com');
await piggy.extend(wa({ onMessage: d => console.log(d) }));
await piggy.extend(storage());
store.attach(piggy);
await piggy.whatsapp.navigate();

// ❌ wrong — extending before register means no sites exist yet
await piggy.extend(wa({ ... }));
await piggy.register('whatsapp', '...');
```

### Using multiple plugins together

```js
const piggy   = require('nothing-browser').default;
const wa      = require('nothing-whatsapp');
const storage = require('nothing-innerstorage');
const store   = require('nothing-store');
const qrcpp   = require('nothing-qrcpp');

await piggy.launch({ mode: 'tab', binary: 'C:/path/nothing-browser-headless.exe' });
await piggy.register('whatsapp', 'https://web.whatsapp.com', { single: true });

// Install all plugins
await piggy.extend(wa({ onReady: d => console.log('ready', d.version) }));
await piggy.extend(storage());
await piggy.extend(qrcpp({ onQR: d => console.log('scan:', d.qrData) }));
store.attach(piggy);

// Force fresh QR (clear old session)
await piggy.whatsapp.store.clear();
await piggy.whatsapp.navigate();

// Listen for messages and save them
piggy.whatsapp.on('message', async (msg) => {
  console.log('New message:', msg.body);
  await piggy.whatsapp.store({ body: msg.body, from: msg.from, ts: Date.now() }, 'messages');
});
```

---

## Iframe

```js
const frames = await site.iframe.list()
// [{ index, id, name, src }]

await site.iframe.waitSel({ frameIndex: 0, selector: '#payment-form', timeout: 10000 })
await site.iframe.type({ frameIndex: 0, selector: '#card-number', text: '4111111111111111' })
await site.iframe.click({ frameIndex: 0, selector: '#submit' })
const text = await site.iframe.text({ frameIndex: 0, selector: '.total' })
```

---

## Screenshot & PDF

```js
// Always use headful for screenshots (headless has a known blank render bug)
const b64 = await site.screenshot()
require('fs').writeFileSync('./shot.png', Buffer.from(b64, 'base64'))

// Or save directly
await site.screenshot('./shot.png')

// PDF works in both modes
await site.pdf('./page.pdf')

// Block images for faster scraping (unblock before screenshot)
await site.blockImages()
await site.navigate(url)
await site.unblockImages()   // must unblock before screenshotting
await site.wait(2000)
await site.screenshot('./shot.png')
```

---

## Tabs

```js
const tabId = await piggy.tabs.new()
await piggy.tabs.close(tabId)
// or
await piggy.tabs.close({ tabId })

const all = await piggy.tabs.list()
```

---

## Events

```js
// Tab-specific
piggy.onEvent('captcha', 'default', d => console.log('CAPTCHA:', d.captchaType))
piggy.onEvent('blocked', '*',       d => console.log('Block:', d.blockType))

// Site-level
site.on('navigate', url => console.log('→', url))
site.on('qr',       d   => console.log('QR:', d.qrData))
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `await`ing a dialog-triggering click | Use `.catch(() => {})` then call dialog method |
| `cookies.delete()` without domain | Domain is required |
| Screenshot in headless mode | Use headful binary for screenshots |
| Not waiting before extracting | Always `wait.selector` before `provide.*` or `evaluate` |
| Using `nothing-server` (Elysia npm package) | The API server is built into the binary — use `site.api()` + `piggy.serve()` |
| Calling `site.url()` synchronously | It's async — `await site.url()` |
| Assuming `find.css()` returns DOM nodes | It returns `ElementDescriptor[]` — plain objects with text/attrs/etc |

---

## File Layout

```
project/
├── index.js               ← your scraper
├── piggy.store.json        ← nothing-store schema (if used)
├── nothing-browser-headless.exe  ← the binary (Windows)
├── piggy.log              ← auto-created by ernest-logger
├── identity.json          ← auto-created — DO NOT EDIT
├── profile.json           ← auto-created — safe to edit
├── cookies.json           ← auto-created — persistent cookies
```

---

## When to Use Which Method

| Goal | Use |
|------|-----|
| Get text from one element | `provide.text({ selector })` |
| Get text from many elements | `provide.textAll({ selector })` |
| Get all links on page | `provide.links()` |
| Extract a table | `provide.table({ selector })` |
| Extract form values | `provide.form({ selector })` |
| Get complex objects (Backbone, React state) | `evaluate(js)` with `JSON.stringify` in the JS |
| Wait for something to appear | `wait.selector({ selector, state: 'attached' })` |
| Wait for something to disappear | `wait.selector({ selector, state: 'detached' })` |
| Wait for custom condition | `wait.function({ js })` |
| Avoid bot detection | `piggy.actHuman(true)` + proxy rotation |
| Persist login across runs | `session.export()` / `session.import()` |
| Force fresh WhatsApp QR | `store.clear()` before navigate |
| Debug network requests | `capture.start()` → navigate → `capture.stop()` → `capture.requests()` |
| Mock an API endpoint | `intercept.respond(pattern, response)` |
| Run same scrape on 3 sites | `piggy.all([s1, s2, s3]).evaluate(js)` |
| Save scraped data | `nothing-store` plugin with `piggy.store.json` schema |

---
## Types of errors
When a user recives some of this errors this is the cause 
await piggy.site.somefunctionname 
error
somefunctionname is undefined
this means the js library is out of date askthe user to update to the latest version of the js lib
command not found error
this error comes from the c++ binary this means the user is trying to use a new api with an old binary 
 
*Nothing Ecosystem · Ernest Tech House · Kenya · 2026*
