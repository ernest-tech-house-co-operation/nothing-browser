# nothing-browser — Full API Reference

> Binary v0.1.14+ | Library v0.0.20+  
> Ernest Tech House · Kenya · 2026

---

## Install

```bash
npm install nothing-browser
```

---

## Quick Start

```js
const piggy = require('nothing-browser').default;

await piggy.launch({ mode: 'tab', binary: 'C:/path/to/nothing-browser-headless.exe' });
await piggy.register('amazon', 'https://www.amazon.com');

await piggy.amazon.navigate();
const title = await piggy.amazon.title();
console.log(title);

await piggy.close();
```

---

## Global (`piggy.*`)

### Launch & Connect

> **Transport note:** all of this runs over a single WebSocket on a fixed
> port (**2005**, never configurable). `launch()` first checks whether an
> instance is already listening there — if so it just joins it instead of
> spawning a new binary, so any number of scripts can share one browser.
> Writing your scraping logic in something other than JS? See
> [`PROTOCOL.md`](PROTOCOL.md) for the raw wire protocol.

| Method | Parameters | Description |
|--------|-----------|-------------|
| `piggy.launch(opts?)` | `{ mode?, binary?, args? }` | Join an already-running instance on port 2005 if one exists; otherwise spawn the binary and connect |
| `piggy.connect(opts)` | `{ host, key? }` | Connect to a specific instance (local or remote) on port 2005 |
| `piggy.close(opts?)` | `{ force? }` | Close **only this script's** tabs and connection. The shared binary keeps running for anyone else connected to it. `force` kills the local child process too, if this script spawned one. |
| `piggy.shutdown()` | — | The real kill switch — terminates the shared binary for every connected script. Not the same as `close()`. |
| `piggy.detect(binary)` | `string` | Returns binary path or `null` |

**`launch` options:**

| Option | Values | Default |
|--------|--------|---------|
| `mode` | `'tab'` \| `'process'` | `'tab'` |
| `binary` | `'headless'` \| `'headful'` \| `'/path/to/exe'` | `'headless'` |
| `args` | `string[]` | `[]` |

**`connect` example:**
```js
await piggy.connect({
  host: '203.0.113.5', // bare hostname or IP — port is always 2005
  key:  'peaseernestbd7436aecf7041a39532a03308b8ee3350495f3cdb534b8294f9d'
});
```

The instance you're connecting to only enforces `key` if it was started
with one (the headless daemon asks "require a connection key?" on first
run). Local instances typically don't need one.

---

### Register

```js
await piggy.register(name, url, opts?)
```

| Option | Type | Description |
|--------|------|-------------|
| `pool` | `number` | Number of tabs for concurrency |
| `binary` | `string` | Override binary for this site |

Creates `piggy[name]` as a dot-notation site object.

---

### Behavior

| Method | Description |
|--------|-------------|
| `piggy.actHuman(enable)` | Enable/disable global human-like delays |
| `piggy.mode(mode)` | Set `'tab'` or `'process'` mode |

---

### Tabs

```js
piggy.tabs.new()           // → Promise<tabId>
piggy.tabs.list()          // → Promise<string[]>
piggy.tabs.close(tabId)    // string or { tabId }
piggy.tab                  // alias for piggy.tabs
```

---

### Proxy (global)

`piggy.proxy` is an **EventEmitter** — use `piggy.proxy.on(event, handler)`.

```js
piggy.proxy.load('./proxies.txt')
piggy.proxy.fetch('https://proxy-service.com/list.txt')
piggy.proxy.ovpn('./nordvpn.ovpn')
piggy.proxy.set({ host, port, type?, user?, pass? })
piggy.proxy.set({ proxy: 'socks5://user:pass@host:1080' })
piggy.proxy.enable()
piggy.proxy.disable()
piggy.proxy.test()
piggy.proxy.testStop()
piggy.proxy.next()
piggy.proxy.rotation(mode, interval?)   // mode: 'none'|'timed'|'perrequest'
piggy.proxy.current()                   // → { proxy, host, port, latency, health }
piggy.proxy.stats()                     // → { total, alive, dead, ... }
piggy.proxy.list(limit?)
piggy.proxy.config({ skipDead?, autoCheck? })
piggy.proxy.save('./alive.txt', 'alive')  // filter: 'all'|'alive'|'dead'
```

**Proxy events:**
```js
piggy.proxy.on('proxy:changed',       ({ proxy, latency }) => {})
piggy.proxy.on('proxy:loaded',        ({ count }) => {})
piggy.proxy.on('proxy:fetch:failed',  ({ error }) => {})
piggy.proxy.on('proxy:check:started', ({ total }) => {})
piggy.proxy.on('proxy:alive',         ({ index, latency }) => {})
piggy.proxy.on('proxy:dead',          ({ index, latency }) => {})
piggy.proxy.on('proxy:check:done',    ({ alive, dead }) => {})
piggy.proxy.on('proxy:exhausted',     () => {})
piggy.proxy.on('proxy:ovpn:loaded',   ({ remote, port }) => {})
```

---

### API Server

The API server is built into the C++ binary (Elysia). `serve()` tells the binary to start it.

```js
await piggy.serve(3000, { title?, version?, description?, hostname? })
await piggy.stopServer()
await piggy.routes()
```

Routes are registered on the site object — see `site.api()` below.

---

### Events

```js
piggy.onEvent(eventName, tabId, handler)
// tabId: specific tabId string, or '*' for all tabs
```

> Since a binary instance can now be shared across multiple scripts,
> tab-scoped events (`navigate`, `dialog`, `exposed_call`) are only
> delivered to the script whose connection created that tab — not
> broadcast to every script sharing the instance. Proxy events remain
> global, since proxy state applies to the whole process.

| Event | Data | When |
|-------|------|------|
| `navigate` | `{ tabId, url }` | Page navigated |
| `captcha` | `{ tabId, captchaType }` | CAPTCHA detected |
| `captcha:resolved` | `{ tabId }` | CAPTCHA solved |
| `blocked` | `{ tabId, blockType }` | Bot block detected |
| `dialog` | `{ tabId, dialogType, message, defaultValue }` | JS dialog appeared |
| `exposed_call` | `{ tabId, name, callId, data }` | Browser called exposed fn |

---

### Multi-site

```js
// Run same method on multiple sites → array
const titles = await piggy.all([piggy.amazon, piggy.ebay]).title()

// Run same method → { siteName: result }
const titles = await piggy.diff([piggy.amazon, piggy.ebay]).title()
```

---

### Expose (global)

```js
await piggy.expose(name, fn, tabId?)    // expose to all sites (or one tab)
await piggy.unexpose(name, tabId?)
```

---

### Other

```js
piggy.usePiggy(name)                    // get registered site, throws if missing
piggy.extend(pluginFn, siteName?)       // install plugin on site(s)
piggy.identity.get()
piggy.identity.set(opts)
```

---

## Site (`piggy.mysite.*`)

Every `register()` call creates a site object.

### Navigation

```js
site.navigate(url?)           // url defaults to registered URL
site.reload()
site.goBack()
site.goForward()
site.title()                  // → string
site.url()                    // → string
site.content()                // → full HTML string
site.waitForNavigation()
site.waitForSelector(selector, timeout?)
site.waitForResponse(pattern?)
site.wait(ms)                 // plain delay
site.noclose()
site.close()
site.poolStats()              // → { idle, busy, queued, total }
```

---

### Wait

```js
site.wait.selector({ selector, state?, timeout? })
// state: 'attached' | 'detached' | 'visible' | 'hidden'  (default: 'attached')

site.wait.function({ js, timeout? })
// js: string returning boolean

site.wait.response(pattern?)
site.wait.navigation()
site.wait(ms)                  // plain timeout
```

---

### Interactions

```js
site.click(selector, opts?)           // opts: { retries?, timeout? }
site.doubleClick(selector)
site.hover(selector)
site.type(selector, text, opts?)      // opts: { delay?, clear?, retries? }
site.select(selector, value)

site.scroll.to(selector)
site.scroll.by(px)

site.keyboard.press(key)
site.keyboard.combo(combo)            // e.g. 'Control+C'

site.mouse.move(x, y)
site.mouse.drag(from, to)             // { x, y } coords

site.evaluate(js, ...args)
```

---

### Find

All return `Promise<ElementDescriptor[]>`. Params match the docs exactly.

```js
site.find.css(selector)
site.find.all(selector)
site.find.first(selector)
site.find.byText({ text, selector?, exact? })
site.find.byAttr({ attr, value?, selector? })
site.find.byTag(tag)
site.find.byPlaceholder(text)
site.find.byRole({ role, name? })
site.find.closest({ selector, ancestor })
site.find.parent(selector)
site.find.children(selector)
site.find.filter({ selector, attr, value })
site.find.count(selector)              // → number
site.find.exists(selector)             // → boolean
site.find.visible(selector)            // → boolean
site.find.enabled(selector)            // → boolean
site.find.checked(selector)            // → boolean
```

---

### Provide

Params are objects matching the docs (selector, parent?, attr?, etc.)

```js
site.provide.text({ selector, parent? })
site.provide.textAll({ selector, parent? })
site.provide.html({ selector, parent? })
site.provide.attr({ selector, attr, parent? })
site.provide.attrAll({ selector, attr, parent? })
site.provide.table({ selector })
site.provide.list({ selector, itemSel?, parent? })
site.provide.links({ selector?, parent? })
site.provide.images({ selector?, parent? })
site.provide.form({ selector })
site.provide.page()
site.provide.div({ selector })
site.provide.meta()
site.provide.select({ selector })
site.provide.json({ selector? })
```

---

### Fetch (legacy)

```js
site.fetch.text({ query })
site.fetch.textAll({ selector })
site.fetch.attr({ selector, attr })
site.fetch.attrAll({ selector, attr })
site.fetch.links({ query })
site.fetch.links.all()
site.fetch.image({ query })
```

---

### Search (legacy)

```js
site.search.css({ query })
site.search.id({ query })
```

---

### Capture

```js
site.capture.start()
site.capture.stop()
site.capture.requests()   // → CapturedRequest[]
site.capture.ws()         // → WebSocketFrame[]
site.capture.cookies()    // → CapturedCookie[]
site.capture.storage()    // → StorageEntry[]
site.capture.clear()
```

---

### Intercept

```js
site.intercept.block(pattern)
site.intercept.redirect(pattern, redirectUrl)
site.intercept.headers(pattern, headers)
site.intercept.respond(pattern, response)     // response: object | async fn
site.intercept.modifyResponse(pattern, fn)
site.intercept.clear(type?)
// type: 'block'|'redirect'|'headers'|'respond'|'modifyResponse'
```

---

### Cookies

```js
site.cookies.set(name, value, domain, path?)
site.cookies.get(name, domain?)
site.cookies.delete(name, domain)      // domain is required
site.cookies.list(domain?)
```

---

### Session

```js
site.session.export()
site.session.import(data)
site.session.reload()
site.session.paths()
site.session.cookiesPath()
site.session.profilePath()
site.session.wsPath()
site.session.pingsPath()
site.session.setWsSave(enabled?)       // default true
site.session.setPingsSave(enabled?)
```

---

### Expose (RPC)

```js
await site.exposeFunction(name, async (data) => { return result; })
await site.unexposeFunction(name)
await site.clearExposedFunctions()
await site.exposeAndInject(name, fn, injectionJs)
// injectionJs: string or (fnName) => string
await site.addInitScript(js)
// js: string or () => void function
```

---

### Iframe

```js
site.iframe.list()
site.iframe.evaluate({ frameIndex?, id?, name?, src?, js })
site.iframe.click({ frameIndex?, id?, name?, src?, selector })
site.iframe.type({ frameIndex?, id?, name?, src?, selector, text })
site.iframe.text({ frameIndex?, id?, name?, src?, selector })
site.iframe.html({ frameIndex?, id?, name?, src? })
site.iframe.waitSel({ frameIndex?, id?, name?, src?, selector, timeout? })
```

---

### Captcha & Block

```js
site.captcha.status()                         // → { detected, paused, type }
site.captcha.blockStatus()                    // → { detected, type }
site.captcha.resolve(token?)
site.captcha.pause()
site.captcha.check()                          // → boolean
site.captcha.setAutoRetry(enabled)
site.captcha.blockRetry()
site.captcha.waitForResolution(timeout?)
site.captcha.onCaptcha(tabId, handler)
site.captcha.onCaptchaResolved(tabId, handler)
site.captcha.onBlocked(tabId, handler)
site.captcha.onBlockRetry(tabId, handler)

site.block.status()
site.block.retry()
```

---

### Dialog

```js
site.dialog.accept(text?)
site.dialog.dismiss()
site.dialog.status()                          // → { pending, type, message, defaultValue }
site.dialog.setAutoAction(action)             // 'accept' | 'dismiss' | ''
site.dialog.upload(selector, filePath)
site.dialog.waitAndAccept(timeout?)
site.dialog.waitAndDismiss(timeout?)
site.dialog.onDialog(tabId, handler)
```

> ⚠️ Never `await` a click that triggers a dialog — the page freezes. Use `.catch(() => {})` and then call the dialog method.

---

### Human

```js
site.human.set({ typingSpeed?, clickDelay?, scrollSpeed?, mouseWiggle? })
// typingSpeed: 'slow'|'normal'|'fast'
// clickDelay:  'cautious'|'normal'|'fast'
// scrollSpeed: 'slow'|'normal'|'fast'

site.human.get()
site.human.type({ selector, text, clear?, speed? })
site.human.click({ selector, force? })
```

---

### Screenshot & PDF

```js
site.screenshot(filePath?)    // returns base64 if no path
site.pdf(filePath?)
site.blockImages()
site.unblockImages()
```

---

### QR

```js
site.qr.status()    // → { waiting, attempts }
site.qr.force()
```

---

### Storage (raw)

```js
site.storage.dump()    // → { localStorage, sessionStorage }
site.storage.clear()
```

---

### API (site-level route registration)

```js
site.api(path, handler, opts?)
// path:    e.g. '/search'  → registers at /siteName/search
// handler: async (params, query, body) => result
// opts:    { method?, ttl?, before?, detail? }
```

---

### Proxy (per-tab)

Same API as global `piggy.proxy` but scoped to this tab.

---

### Events

```js
site.on(event, handler)     // returns site (chainable)
site.once(event, handler)
site.off(event, handler)
site.emit(event, data)
```

---

## Plugins

| Package | What it adds |
|---------|-------------|
| `nothing-whatsapp` | `site.wa.*` — WAWeb event bridge, message/chat/contact API |
| `nothing-store` | `site.store(data, schema?)` — schema-validated JSON/SQLite persistence |
| `nothing-innerstorage` | `site.store.local.*`, `site.store.session.*`, `site.store.idb.*`, snapshots |
| `nothing-qrcpp` | Typed QR callbacks + `site.qr.status/force` |

All plugins use `piggy.extend(plugin(opts))`.

---

## Logging

`nothing-browser` uses `ernest-logger` internally. Logs go to console and `./piggy.log`.

```js
// Access the logger directly
const { log } = require('nothing-browser');
log.info('hello');
log.error('something failed');
log.network('request sent');
```

To silence: set `LOG_LEVEL=error` or configure ernest-logger before requiring the library.

---

*Nothing Ecosystem · Ernest Tech House · Kenya · 2026*
