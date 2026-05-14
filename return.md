## 🐷 Piggy TypeScript Library – Complete API Reference

> All methods return `Promise<T>` (async).  
> `tabId` defaults to `"default"` unless otherwise noted.  
> Events are emitted via the `piggy` client or `site` objects.

---

### 1. Global `piggy` object (from `piggy.ts`)

#### Launch & Connect

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `launch(opts?)` | `{ mode?: "tab" \| "process", binary?: "headless" \| "headful" \| string }` | `Promise<piggy>` | Spawns the C++ browser binary, connects over local socket. Default `mode="tab"`, `binary="headless"`. |
| `connect(opts)` | `{ host: string, key: string }` | `Promise<piggy>` | Connects to a running Piggy server over HTTP (port 2005). |
| `http(opts)` | `{ host?: string, port?: number, key: string }` | `PiggyHttpClient` | Direct HTTP client without socket (see HTTP section). |

#### Site Registration

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `register(name, url, opts?)` | `name: string, url: string, opts?: { binary?: BinaryMode, pool?: number }` | `Promise<piggy>` | Registers a site. Creates a tab (or pool) and attaches a `site` object as `piggy[name]`. |

#### Global Controls

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `actHuman(enable)` | `enable: boolean` | `piggy` | Enables human‑like delays and typing for all interactions. |
| `mode(m)` | `m: "tab" \| "process"` | `piggy` | Sets default tab mode for subsequent `register` calls. |
| `expose(name, handler, tabId?)` | `name: string, handler: (data: any) => any, tabId?: string` | `Promise<piggy>` | Exposes a global function to all pages (via `expose.function`). |
| `unexpose(name, tabId?)` | `name: string, tabId?: string` | `Promise<piggy>` | Removes an exposed function. |

#### Server & Utilities

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `serve(port, opts?)` | `port: number, opts?: { hostname?, title?, version?, description?, path? }` | `Promise<Elysia>` | Starts an Elysia HTTP server with OpenAPI docs for all registered routes. |
| `stopServer()` | — | `void` | Stops the Elysia server. |
| `routes()` | — | `{ site, method, path, ttl, middlewareCount }[]` | Lists all registered API routes. |
| `all(sites)` | `sites: SiteObject[]` | `Proxy` | Returns a proxy that calls the same method on all sites in parallel. |
| `diff(sites)` | `sites: SiteObject[]` | `Proxy` | Returns a proxy that calls the same method and returns an object keyed by site name. |
| `close(opts?)` | `opts?: { force?: boolean }` | `Promise<void>` | Shuts down client and browser (with or without force). |
| `detect(mode)` | `mode?: BinaryMode` | `string \| null` | Checks if the browser binary exists. |

#### Sub‑API Accessors (lazy‑initialized)

These properties are available after `launch()` or `connect()`:

| Property | Type | Description |
|----------|------|-------------|
| `piggy.tabs` | `TabsClient` | Tab management (`new`, `close`, `list`). |
| `piggy.navigation` | `NavigationClient` | Navigation & page info. |
| `piggy.interactions` | `InteractionsClient` | Click, type, scroll, keyboard, mouse, evaluate. |
| `piggy.media` | `MediaClient` | Screenshot, PDF, image blocking. |
| `piggy.capture` | `CaptureClient` | Network capture (requests, WS, cookies, storage). |
| `piggy.find` | `FindClient` | DOM query with element descriptors. |
| `piggy.provide` | `ProvideClient` | High‑level extraction (text, table, form, JSON…). |
| `piggy.wait` | `WaitClient` | Wait for JS condition or selector state. |
| `piggy.evaluate` | `EvaluateClient` | Run JS with optional timeout. |
| `piggy.fetch` | `FetchClient` | Convenience fetch methods (text, attr, links, images). |
| `piggy.captcha` | `CaptchaClient` | CAPTCHA/block detection and resolution. |
| `piggy.dialog` | `DialogClient` | JavaScript dialogs and file upload. |
| `piggy.human` | `HumanClient` | Human‑like typing and clicking with profiles. |
| `piggy.iframe` | `IframeClient` | Operations inside iframes. |
| `piggy.session` | `SessionClient` | Session persistence (paths, export/import, cookies). |
| `piggy.export` | `ExportClient` | Legacy export, intercept rules, init scripts. |
| `piggy.proxy` | `ProxyClient` wrapper | Proxy pool management and rotation. |

> `piggy.proxy` is a wrapper: `piggy.proxy.load(path)`, `piggy.proxy.next()`, `piggy.proxy.on(event, handler)`, etc.

---

### 2. Site Object (returned by `piggy.register`)

When you register a site, `piggy[name]` becomes a `SiteObject` with the following methods.  
All methods automatically use the site’s tab (or pool) and include retries, screenshots on error, and logging.

#### Navigation & Info

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `navigate(url?, opts?)` | `url?: string, opts?: { retries?: number }` | `Promise<void>` | Navigates to the registered URL (or custom). |
| `reload()` | — | `Promise<void>` | Reloads current page. |
| `goBack()` | — | `Promise<void>` | Goes back in history. |
| `goForward()` | — | `Promise<void>` | Goes forward. |
| `waitForNavigation()` | — | `Promise<void>` | Waits for page load. |
| `title()` | — | `Promise<string>` | Returns page title. |
| `url()` | — | `string` (sync) | Returns current URL (cached). |
| `content()` | — | `Promise<string>` | Returns full HTML. |

#### Waiting

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `wait(ms)` | `ms: number` | `Promise<void>` | Sleeps (adds random jitter in human mode). |
| `waitForSelector(selector, timeout?)` | `selector: string, timeout?: number` | `Promise<void>` | Waits for element to exist. |
| `waitForVisible(selector, timeout?)` | same | `Promise<void>` | Waits for element to be visible. |
| `waitForResponse(pattern, timeout?)` | `pattern: string, timeout?: number` | `Promise<void>` | Waits for a network response matching pattern. |

#### Interactions

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `click(selector, opts?)` | `selector: string, opts?: { retries?, timeout? }` | `Promise<boolean>` | Clicks element. |
| `doubleClick(selector)` | `selector: string` | `Promise<boolean>` | Double‑clicks. |
| `hover(selector)` | `selector: string` | `Promise<boolean>` | Hovers mouse. |
| `type(selector, text, opts?)` | `selector: string, text: string, opts?: { delay?, retries?, clear?, speed? }` | `Promise<boolean>` | Types text. Uses `HumanClient` if `actHuman(true)`. |
| `select(selector, value)` | `selector: string, value: string` | `Promise<boolean>` | Selects option in `<select>`. |
| `evaluate(js, ...args)` | `js: string \| Function, ...args: any[]` | `Promise<any>` | Runs JS in page. |

#### Keyboard & Mouse

| Method | Parameters | Returns |
|--------|------------|---------|
| `keyboard.press(key)` | `key: string` | `Promise<boolean>` |
| `keyboard.combo(combo)` | `combo: string` (e.g. `"Control+C"`) | `Promise<boolean>` |
| `mouse.move(x, y)` | `x: number, y: number` | `Promise<boolean>` |
| `mouse.drag(from, to)` | `from: {x,y}, to: {x,y}` | `Promise<boolean>` |

#### Scroll

| Method | Parameters | Returns |
|--------|------------|---------|
| `scroll.to(selector)` | `selector: string` | `Promise<boolean>` |
| `scroll.by(px)` | `px: number` | `Promise<void>` |

#### Fetch & Search

| Method | Parameters | Returns |
|--------|------------|---------|
| `fetchText(selector)` | `selector: string` | `Promise<string \| null>` |
| `fetchLinks(selector)` | `selector: string` | `Promise<string[]>` |
| `fetchImages(selector)` | `selector: string` | `Promise<string[]>` |
| `search.css(query)` | `query: string` | `Promise<any>` |
| `search.id(query)` | `query: string` | `Promise<any>` |

#### Screenshot & PDF

| Method | Parameters | Returns |
|--------|------------|---------|
| `screenshot(filePath?)` | `filePath?: string` | `Promise<string>` (base64 or file path) |
| `pdf(filePath?)` | `filePath?: string` | `Promise<string>` |
| `blockImages()` / `unblockImages()` | — | `Promise<void>` |

#### Cookies

| Method | Parameters | Returns |
|--------|------------|---------|
| `cookies.set(name, value, domain, path?)` | `name, value, domain, path?: string` | `Promise<void>` |
| `cookies.get(name)` | `name: string` | `Promise<any>` |
| `cookies.delete(name)` | `name: string` | `Promise<void>` |
| `cookies.list()` | — | `Promise<any[]>` |

#### Interception

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `intercept.block(pattern)` | `pattern: string` | `Promise<void>` | Blocks requests matching pattern. |
| `intercept.redirect(pattern, redirectUrl)` | `pattern: string, redirectUrl: string` | `Promise<void>` | Redirects matching requests. |
| `intercept.headers(pattern, headers)` | `pattern: string, headers: Record<string,string>` | `Promise<void>` | Adds/modifies headers. |
| `intercept.respond(pattern, handlerOrResponse)` | `pattern: string, handlerOrResponse: object \| Function` | `Promise<SiteObject>` | Mocks response (static or dynamic). |
| `intercept.modifyResponse(pattern, handler)` | `pattern: string, handler: Function` | `Promise<SiteObject>` | Modifies real response via exposed function. |
| `intercept.clear()` | — | `Promise<void>` | Clears all intercept rules. |

#### Capture

| Method | Parameters | Returns |
|--------|------------|---------|
| `capture.start()` / `stop()` | — | `Promise<void>` |
| `capture.requests()` | — | `Promise<CapturedRequest[]>` |
| `capture.ws()` | — | `Promise<WebSocketFrame[]>` |
| `capture.cookies()` | — | `Promise<CapturedCookie[]>` |
| `capture.storage()` | — | `Promise<StorageEntry[]>` |
| `capture.clear()` | — | `Promise<void>` |

#### Session

| Method | Parameters | Returns |
|--------|------------|---------|
| `session.export()` | — | `Promise<any>` |
| `session.import(data)` | `data: any` | `Promise<void>` |

#### Expose Functions

| Method | Parameters | Returns |
|--------|------------|---------|
| `exposeFunction(name, handler)` | `name: string, handler: (data: any) => any` | `Promise<SiteObject>` |
| `unexposeFunction(name)` | `name: string` | `Promise<SiteObject>` |
| `clearExposedFunctions()` | — | `Promise<SiteObject>` |
| `exposeAndInject(name, handler, injectionJs)` | `name, handler, injectionJs: string \| ((fnName) => string)` | `Promise<SiteObject>` |

#### Store & API

| Method | Parameters | Returns |
|--------|------------|---------|
| `store(data, schemaName?)` | `data: object \| object[], schemaName?: string` | `Promise<{ stored, skipped }>` |
| `api(path, handler, opts?)` | `path: string, handler: RouteHandler, opts?: { method?, ttl?, before?, detail? }` | `SiteObject` |

#### Lifecycle

| Method | Parameters | Returns |
|--------|------------|---------|
| `noclose()` | — | `SiteObject` | Marks site as keep‑alive (won’t close on `piggy.close()`). |
| `close()` | — | `Promise<void>` | Closes tab / pool. |
| `addInitScript(js)` | `js: string \| (() => void)` | `Promise<SiteObject>` | Injects script into every new page. |
| `on(event, handler)` | `event: "navigate", handler: (url: string) => void` | `() => void` (unsubscribe) | Listens to page navigation events. |
| `poolStats()` | — | `object \| null` | Returns pool statistics if pool was used. |

---

### 3. Sub‑API Clients (detailed)

#### `TabsClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `new()` | — | `Promise<string>` (tabId) |
| `close(tabId)` | `tabId: string` | `Promise<void>` |
| `list()` | — | `Promise<string[]>` |

#### `NavigationClient` (after dedup – no `waitForSelector`)

| Method | Parameters | Returns |
|--------|------------|---------|
| `navigate(url, tabId?)` | `url: string, tabId?: string` | `Promise<void>` |
| `reload(tabId?)` | — | `Promise<void>` |
| `goBack(tabId?)` | — | `Promise<void>` |
| `goForward(tabId?)` | — | `Promise<void>` |
| `url(tabId?)` | — | `Promise<string>` |
| `title(tabId?)` | — | `Promise<string>` |
| `content(tabId?)` | — | `Promise<string>` |
| `waitForNavigation(tabId?)` | — | `Promise<void>` |

#### `InteractionsClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `click(selector, tabId?)` | `selector: string, tabId?: string` | `Promise<boolean>` |
| `dblclick(selector, tabId?)` | same | `Promise<boolean>` |
| `hover(selector, tabId?)` | same | `Promise<boolean>` |
| `type(selector, text, tabId?)` | `selector, text, tabId?` | `Promise<boolean>` |
| `typeClear(selector, text, tabId?)` | same (clears first) | `Promise<boolean>` |
| `select(selector, value, tabId?)` | `selector, value, tabId?` | `Promise<boolean>` |
| `scrollTo(selector, tabId?)` | `selector, tabId?` | `Promise<boolean>` |
| `scrollBy(px, tabId?)` | `px: number, tabId?` | `Promise<boolean>` |
| `keyPress(key, tabId?)` | `key: string, tabId?` | `Promise<boolean>` |
| `keyCombo(combo, tabId?)` | `combo: string, tabId?` | `Promise<boolean>` |
| `mouseMove(x, y, tabId?)` | `x, y, tabId?` | `Promise<boolean>` |
| `mouseDrag(from, to, tabId?)` | `from, to: {x,y}, tabId?` | `Promise<boolean>` |
| `evaluate(js, tabId?)` | `js: string, tabId?` | `Promise<any>` |

#### `FindClient`

All methods return `Promise<ElementDescriptor[]>` unless noted.

| Method | Parameters | Returns |
|--------|------------|---------|
| `css(selector, tabId?)` | `selector: string` | `ElementDescriptor[]` |
| `first(selector, tabId?)` | same | `ElementDescriptor[]` (0 or 1) |
| `all(selector, tabId?)` | same | alias for `css` |
| `byText(opts, tabId?)` | `{ text, selector?, exact? }` | `ElementDescriptor[]` |
| `byAttr(opts, tabId?)` | `{ attr, value?, selector? }` | `ElementDescriptor[]` |
| `byTag(tag, tabId?)` | `tag: string` | `ElementDescriptor[]` |
| `byPlaceholder(text, tabId?)` | `text: string` | `ElementDescriptor[]` |
| `byRole(opts, tabId?)` | `{ role, name? }` | `ElementDescriptor[]` |
| `closest(opts, tabId?)` | `{ selector, ancestor }` | `ElementDescriptor[]` |
| `parent(selector, tabId?)` | `selector: string` | `ElementDescriptor[]` |
| `children(selector, tabId?)` | `selector: string` | `ElementDescriptor[]` |
| `filter(opts, tabId?)` | `{ selector, attr, value }` | `ElementDescriptor[]` |
| `count(selector, tabId?)` | `selector: string` | `Promise<number>` |
| `exists(selector, tabId?)` | `selector: string` | `Promise<boolean>` |
| `visible(selector, tabId?)` | `selector: string` | `Promise<boolean>` |
| `enabled(selector, tabId?)` | `selector: string` | `Promise<boolean>` |
| `checked(selector, tabId?)` | `selector: string` | `Promise<boolean>` |

#### `ProvideClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `text(selector, tabId?)` | `selector: string` | `Promise<string>` |
| `textAll(selector, tabId?)` | `selector: string` | `Promise<string[]>` |
| `attr(selector, attr, tabId?)` | `selector, attr` | `Promise<string>` |
| `attrAll(selector, attr, tabId?)` | `selector, attr` | `Promise<string[]>` |
| `html(selector, tabId?)` | `selector: string` | `Promise<string>` |
| `table(selector, tabId?)` | `selector: string` | `Promise<{ headers: string[], rows: string[][] }>` |
| `list(selector, itemSel?, tabId?)` | `selector, itemSel?: string` | `Promise<string[]>` |
| `links(selector?, tabId?)` | `selector?: string` | `Promise<{ text, href, title }[]>` |
| `images(selector?, tabId?)` | `selector?: string` | `Promise<{ src, alt, width, height }[]>` |
| `form(selector, tabId?)` | `selector: string` | `Promise<Record<string, string>>` |
| `page(tabId?)` | — | `Promise<{ title, url, html, text }>` |
| `div(selector, tabId?)` | `selector: string` | `Promise<{ tag, id, cls, text, html, children[] }>` |
| `meta(tabId?)` | — | `Promise<Record<string, string>>` |
| `select(selector, tabId?)` | `selector: string` | `Promise<{ value, options: { text, value, selected }[] }>` |
| `json(selector?, tabId?)` | `selector?: string` | `Promise<any>` |

#### `WaitClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `function(js, timeout?, tabId?)` | `js: string, timeout?: number, tabId?: string` | `Promise<void>` |
| `selector(selector, state?, timeout?, tabId?)` | `selector: string, state?: "attached"\|"detached"\|"visible"\|"hidden", timeout?: number, tabId?: string` | `Promise<void>` |

#### `EvaluateClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `run(js, timeout?, tabId?)` | `js: string, timeout?: number, tabId?: string` | `Promise<any>` |

#### `FetchClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `text(selector, tabId?)` | `selector: string` | `Promise<string \| null>` |
| `textAll(selector, tabId?)` | `selector: string` | `Promise<string[]>` |
| `attr(selector, attr, tabId?)` | `selector, attr` | `Promise<string \| null>` |
| `attrAll(selector, attr, tabId?)` | `selector, attr` | `Promise<string[]>` |
| `links(selector, tabId?)` | `selector: string` | `Promise<string[]>` |
| `linksAll(tabId?)` | — | `Promise<string[]>` |
| `images(selector, tabId?)` | `selector: string` | `Promise<string[]>` |

#### `CaptchaClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `status(tabId?)` | — | `Promise<{ detected, paused, type }>` |
| `resolve(tabId?)` | — | `Promise<void>` |
| `pause(tabId?)` | — | `Promise<void>` |
| `check(tabId?)` | — | `Promise<void>` |
| `setAutoRetry(enabled)` | `enabled: boolean` | `Promise<void>` |
| `blockStatus(tabId?)` | — | `Promise<{ detected, type }>` |
| `blockRetry(tabId?)` | — | `Promise<void>` |
| `onCaptcha(tabId, handler)` | `tabId: string, handler: (data) => void` | `() => void` (unsubscribe) |
| `onCaptchaResolved(tabId, handler)` | same | `() => void` |
| `onBlocked(tabId, handler)` | same | `() => void` |
| `onBlockRetry(tabId, handler)` | same | `() => void` |
| `waitForResolution(tabId?, timeout?)` | `tabId?: string, timeout?: number` | `Promise<void>` |

#### `DialogClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `accept(tabId?, text?)` | `tabId?: string, text?: string` | `Promise<void>` |
| `dismiss(tabId?)` | `tabId?: string` | `Promise<void>` |
| `status(tabId?)` | — | `Promise<{ pending, type, message, defaultValue }>` |
| `setAutoAction(tabId?, action)` | `tabId?: string, action: "accept" \| "dismiss" \| ""` | `Promise<void>` |
| `upload(selector, filePath, tabId?)` | `selector: string, filePath: string, tabId?: string` | `Promise<void>` |
| `onDialog(tabId, handler)` | `tabId: string, handler: (data) => void` | `() => void` |
| `waitAndAccept(tabId?, text?, timeout?)` | `tabId?: string, text?: string, timeout?: number` | `Promise<DialogState>` |
| `waitAndDismiss(tabId?, timeout?)` | `tabId?: string, timeout?: number` | `Promise<DialogState>` |

#### `HumanClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `set(opts, tabId?)` | `{ typingSpeed?, clickDelay?, scrollSpeed?, mouseWiggle? }` | `Promise<HumanProfile>` |
| `get(tabId?)` | — | `Promise<HumanProfile>` |
| `type(opts, tabId?)` | `{ selector, text, clear?, speed? }` | `Promise<void>` |
| `click(opts, tabId?)` | `{ selector, force?, delay? }` | `Promise<boolean>` |

#### `IframeClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `list(tabId?)` | — | `Promise<{ index, src, id, name, width, height }[]>` |
| `evaluate(opts, tabId?)` | `{ index \| src \| id \| name, js }` | `Promise<any>` |
| `click(opts, tabId?)` | `{ index \| src \| id \| name, sel }` | `Promise<boolean>` |
| `type(opts, tabId?)` | `{ index \| src \| id \| name, sel, text }` | `Promise<boolean>` |
| `text(opts, tabId?)` | `{ index \| src \| id \| name, sel }` | `Promise<string>` |
| `html(opts, tabId?)` | `{ index \| src \| id \| name }` | `Promise<string>` |
| `waitSel(opts, tabId?)` | `{ index \| src \| id \| name, sel, timeout? }` | `Promise<boolean>` |

#### `CaptureClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `start(tabId?)` | — | `Promise<void>` |
| `stop(tabId?)` | — | `Promise<void>` |
| `requests(tabId?)` | — | `Promise<CapturedRequest[]>` |
| `ws(tabId?)` | — | `Promise<WebSocketFrame[]>` |
| `cookies(tabId?)` | — | `Promise<CapturedCookie[]>` |
| `storage(tabId?)` | — | `Promise<StorageEntry[]>` |
| `clear(tabId?)` | — | `Promise<void>` |

#### `ExportClient` (legacy / extra)

| Method | Parameters | Returns |
|--------|------------|---------|
| `searchCss(query, tabId?)` | `query: string` | `Promise<any>` |
| `searchId(query, tabId?)` | `query: string` | `Promise<any>` |
| `setCookie(opts, tabId?)` | `CookieSetOptions` | `Promise<void>` |
| `deleteCookie(opts, tabId?)` | `CookieDeleteOptions` | `Promise<void>` |
| `sessionReload(tabId?)` | — | `Promise<void>` |
| `cookiesPath()` | — | `Promise<string>` |
| `profilePath()` | — | `Promise<string>` |
| `wsPath()` | — | `Promise<string>` |
| `pingsPath()` | — | `Promise<string>` |
| `sessionPaths()` | — | `Promise<SessionPaths>` |
| `setWsSave(enabled)` | `enabled: boolean` | `Promise<void>` |
| `setPingsSave(enabled)` | `enabled: boolean` | `Promise<void>` |
| `addInterceptRule(rule, tabId?)` | `InterceptRule` | `Promise<void>` |
| `clearInterceptRules(tabId?)` | — | `Promise<void>` |
| `exportSession(tabId?)` | — | `Promise<SessionExport>` |
| `importSession(data, tabId?)` | `data: SessionExport` | `Promise<void>` |
| `exposeFunction(name, tabId?)` | `name: string` | `Promise<void>` |
| `resolveExposed(callId, result, isError?, tabId?)` | `callId, result, isError?` | `Promise<void>` |
| `addInitScript(js, tabId?)` | `js: string` | `Promise<void>` |
| `onExposedFunctionCalled(tabId, handler)` | `tabId, handler` | `() => void` |

#### `SessionClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `reload(tabId?)` | — | `Promise<void>` |
| `paths()` | — | `Promise<SessionPaths>` |
| `cookiesPath()` | — | `Promise<string>` |
| `profilePath()` | — | `Promise<string>` |
| `wsPath()` | — | `Promise<string>` |
| `pingsPath()` | — | `Promise<string>` |
| `setWsSave(enabled)` | `enabled: boolean` | `Promise<void>` |
| `setPingsSave(enabled)` | `enabled: boolean` | `Promise<void>` |
| `export(tabId?)` | — | `Promise<any>` |
| `import(data, tabId?)` | `data: any` | `Promise<void>` |
| `setCookie(opts, tabId?)` | `CookieSetOptions` | `Promise<void>` |
| `deleteCookie(opts, tabId?)` | `CookieDeleteOptions` | `Promise<void>` |

#### `ProxyClient` (global, no `tabId`)

| Method | Parameters | Returns |
|--------|------------|---------|
| `load(path)` | `path: string` | `Promise<void>` |
| `fetch(url)` | `url: string` | `Promise<void>` |
| `ovpn(path)` | `path: string` | `Promise<void>` |
| `set(opts)` | `{ proxy: string } \| { host, port, type?, user?, pass? }` | `Promise<void>` |
| `test()` | — | `Promise<void>` |
| `testStop()` | — | `Promise<void>` |
| `next()` | — | `Promise<string>` |
| `rotate()` | — | `Promise<string>` |
| `disable()` | — | `Promise<void>` |
| `enable()` | — | `Promise<void>` |
| `current()` | — | `Promise<ProxyCurrent>` |
| `stats()` | — | `Promise<ProxyStats>` |
| `list(limit?)` | `limit?: number` | `Promise<ProxyListResult>` |
| `rotation(mode, interval?)` | `mode: "none"\|"timed"\|"perrequest", interval?: number` | `Promise<void>` |
| `config(opts)` | `{ skipDead?, autoCheck? }` | `Promise<ProxyConfig>` |
| `save(path, filter?)` | `path: string, filter?: "all"\|"alive"\|"dead"` | `Promise<void>` |

Events on `piggy.proxy` (via `on(event, handler)`):

| Event | Data | Description |
|-------|------|-------------|
| `proxy:changed` | `{ proxy, host, port, latency }` | Proxy rotated. |
| `proxy:loaded` | `{ count }` | Proxies loaded from file/URL. |
| `proxy:fetch:failed` | `{ error }` | Fetch failed. |
| `proxy:check:started` | `{ total }` | Health check started. |
| `proxy:alive` | `{ index, latency }` | Proxy alive. |
| `proxy:dead` | `{ index, latency }` | Proxy dead. |
| `proxy:check:done` | `{ alive, dead }` | Health check finished. |
| `proxy:exhausted` | — | No alive proxies left. |
| `proxy:ovpn:loaded` | `{ remote, port }` | OVPN loaded. |

#### `MediaClient`

| Method | Parameters | Returns |
|--------|------------|---------|
| `screenshot(filePath?, tabId?)` | `filePath?: string, tabId?: string` | `Promise<string>` (base64 or file path) |
| `pdf(filePath?, tabId?)` | same | `Promise<string>` |
| `blockImages(tabId?)` | — | `Promise<void>` |
| `unblockImages(tabId?)` | — | `Promise<void>` |

#### `PiggyHttpClient` (direct HTTP client)

| Method | Parameters | Returns |
|--------|------------|---------|
| `ping()` | — | `Promise<boolean>` |
| `send<T>(cmd, payload?)` | `cmd: string, payload?: object` | `Promise<T>` |

---

### 4. Type Definitions (common)

```ts
interface ElementDescriptor {
  tag: string;
  id: string;
  cls: string;
  text: string;      // first 400 chars
  html: string;      // first 800 chars
  href: string;
  src: string;
  value: string;
  attrs: Record<string, string>;
}

interface CapturedRequest {
  method: string;
  url: string;
  status: string;
  type: string;
  mime: string;
  reqHeaders: string;
  reqBody: string;
  resHeaders: string;
  resBody: string;
  size: number;
  timestamp: string;
}

interface WebSocketFrame {
  connectionId: string;
  url: string;
  direction: string;   // "sent" or "received"
  data: string;
  binary: boolean;
  timestamp: string;
}

interface CapturedCookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  secure: boolean;
  expires: string;
}

interface StorageEntry {
  key: string;
  value: string;
}

interface SessionPaths {
  workDir: string;
  cookies: string;
  profile: string;
  ws: string;
  pings: string;
}

interface CookieSetOptions {
  name: string;
  value: string;
  domain: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
  expiry?: number;
}

interface CookieDeleteOptions {
  name: string;
  domain: string;
}

interface HumanProfile {
  typingSpeed: "slow" | "normal" | "fast";
  clickDelay:  "cautious" | "normal" | "fast";
  scrollSpeed: "slow" | "normal" | "fast";
  mouseWiggle: boolean;
}
```
