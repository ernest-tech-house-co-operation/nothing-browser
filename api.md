# Piggy TypeScript Library — Complete API Reference

> **Version:** 0.1.0  
> **Source:** https://github.com/BunElysiaReact/nothing-browser  
> All methods are async (`Promise<T>`) and fully supported.

---

## Table of Contents

1. [Global `piggy` Object](#1-global-piggy-object)
   - [Launch & Connect](#launch--connect)
   - [Site Registration](#site-registration)
   - [Global Controls](#global-controls)
   - [Sub‑API Accessors](#sub-api-accessors)
   - [Server & Utilities](#server--utilities)
2. [Site Object (Returned by `register`)](#2-site-object)
   - [Navigation & Info](#navigation--info)
   - [Waiting](#waiting)
   - [Interactions](#interactions)
   - [Keyboard, Mouse, Scroll](#keyboard-mouse-scroll)
   - [Fetch & Search](#fetch--search)
   - [Screenshot & PDF](#screenshot--pdf)
   - [Cookies](#cookies)
   - [Interception](#interception)
   - [Capture](#capture)
   - [Session](#session)
   - [Expose Functions](#expose-functions)
   - [Store & API Routes](#store--api-routes)
   - [Lifecycle](#lifecycle)
3. [Sub‑API Clients](#3-sub-api-clients)
   - [TabsClient](#tabsclient)
   - [NavigationClient](#navigationclient)
   - [InteractionsClient](#interactionsclient)
   - [MediaClient](#mediaclient)
   - [CaptureClient](#captureclient)
   - [FindClient](#findclient)
   - [ProvideClient](#provideclient)
   - [WaitClient](#waitclient)
   - [EvaluateClient](#evaluateclient)
   - [FetchClient](#fetchclient)
   - [CaptchaClient](#captchaclient)
   - [DialogClient](#dialogclient)
   - [HumanClient](#humanclient)
   - [IframeClient](#iframeclient)
   - [SessionClient](#sessionclient)
   - [ExportClient](#exportclient)
   - [ProxyClient](#proxyclient)
   - [PiggyHttpClient](#piggyhttpclient)
4. [Events](#4-events)
5. [Type Definitions](#5-type-definitions)

---

## 1. Global `piggy` Object

### Launch & Connect

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `launch(opts?)` | `{ mode?: "tab" \| "process", binary?: "headless" \| "headful" \| string }` | `Promise<piggy>` | Spawns the C++ browser binary (nothing‑browser) and connects over a local socket. |
| `connect(opts)` | `{ host: string, key: string }` | `Promise<piggy>` | Connects to a running Piggy server over HTTP (port 2005). |
| `http(opts)` | `{ host?: string, port?: number, key: string }` | `PiggyHttpClient` | Returns a standalone HTTP client for direct command calls. |

### Site Registration

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `register(name, url, opts?)` | `name: string, url: string, opts?: { binary?: BinaryMode, pool?: number }` | `Promise<piggy>` | Registers a site. Creates a tab (or a pool of tabs) and attaches a `SiteObject` as `piggy[name]`. |

### Global Controls

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `actHuman(enable)` | `enable: boolean` | `piggy` | Enables human‑like delays and typing for all interactions. |
| `mode(m)` | `m: "tab" \| "process"` | `piggy` | Sets the default tab mode for subsequent `register` calls. |
| `expose(name, handler, tabId?)` | `name: string, handler: (data: any) => any, tabId?: string` | `Promise<piggy>` | Exposes a global function to all pages of a specific tab. |
| `unexpose(name, tabId?)` | `name: string, tabId?: string` | `Promise<piggy>` | Removes an exposed function. |

### Sub‑API Accessors

These properties are available after `launch()` or `connect()`. Each returns a client instance (see [Section 3](#3-sub-api-clients)).

| Property | Type | Description |
|----------|------|-------------|
| `piggy.tabs` | `TabsClient` | Tab management. |
| `piggy.navigation` | `NavigationClient` | Navigation and page info. |
| `piggy.interactions` | `InteractionsClient` | Click, type, scroll, keyboard, mouse, evaluate. |
| `piggy.media` | `MediaClient` | Screenshot, PDF, image blocking. |
| `piggy.capture` | `CaptureClient` | Network capture (requests, WebSocket, cookies, storage). |
| `piggy.find` | `FindClient` | DOM query with element descriptors. |
| `piggy.provide` | `ProvideClient` | High‑level extraction (text, table, form, JSON, etc.). |
| `piggy.wait` | `WaitClient` | Wait for JS condition or selector state. |
| `piggy.evaluate` | `EvaluateClient` | Run JS with optional timeout. |
| `piggy.fetch` | `FetchClient` | Convenience fetch methods (text, attr, links, images). |
| `piggy.captcha` | `CaptchaClient` | CAPTCHA/block detection and resolution. |
| `piggy.dialog` | `DialogClient` | JavaScript dialogs and file upload. |
| `piggy.human` | `HumanClient` | Human‑like typing and clicking. |
| `piggy.iframe` | `IframeClient` | Operations inside iframes. |
| `piggy.session` | `SessionClient` | Session persistence (paths, export/import, cookies). |
| `piggy.export` | `ExportClient` | Additional session, cookie, intercept, and init script commands. |
| `piggy.proxy` | `object` | Proxy pool management and rotation (wraps `ProxyClient`). |

### Server & Utilities

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `serve(port, opts?)` | `port: number, opts?: { hostname?, title?, version?, description?, path? }` | `Promise<Elysia>` | Starts an Elysia HTTP server with OpenAPI docs for all registered routes. |
| `stopServer()` | — | `void` | Stops the Elysia server. |
| `routes()` | — | `{ site, method, path, ttl, middlewareCount }[]` | Lists all registered API routes. |
| `all(sites)` | `sites: SiteObject[]` | `Proxy` | Returns a proxy that calls the same method on all sites in parallel. |
| `diff(sites)` | `sites: SiteObject[]` | `Proxy` | Returns a proxy that calls the same method and returns an object keyed by site name. |
| `close(opts?)` | `opts?: { force?: boolean }` | `Promise<void>` | Shuts down client and browser (with or without force). |
| `detect(mode)` | `mode?: BinaryMode` | `string \| null` | Checks if the browser binary exists. |

---

## 2. Site Object

When you register a site, `piggy[name]` becomes a `SiteObject` with the following methods.  
All methods automatically use the site’s tab (or pool) and include retries and automatic screenshots on errors.

### Navigation & Info

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `navigate(url?, opts?)` | `url?: string, opts?: { retries?: number }` | `Promise<void>` | Navigates to the registered URL (or a custom one). |
| `reload()` | — | `Promise<void>` | Reloads the current page. |
| `goBack()` | — | `Promise<void>` | Goes back in history. |
| `goForward()` | — | `Promise<void>` | Goes forward. |
| `waitForNavigation()` | — | `Promise<void>` | Waits for a page load. |
| `title()` | — | `Promise<string>` | Returns the page title. |
| `url()` | — | `string` (sync) | Returns the current URL (cached). |
| `content()` | — | `Promise<string>` | Returns the full HTML. |

### Waiting

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `wait(ms)` | `ms: number` | `Promise<void>` | Sleeps (adds random jitter in human mode). |
| `waitForSelector(selector, timeout?)` | `selector: string, timeout?: number` | `Promise<void>` | Waits for an element to exist in the DOM. |
| `waitForVisible(selector, timeout?)` | `selector: string, timeout?: number` | `Promise<void>` | Waits for an element to be visible. |
| `waitForResponse(pattern, timeout?)` | `pattern: string, timeout?: number` | `Promise<void>` | Waits for a network response matching the pattern. |

### Interactions

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `click(selector, opts?)` | `selector: string, opts?: { retries?, timeout? }` | `Promise<boolean>` | Clicks an element. |
| `doubleClick(selector)` | `selector: string` | `Promise<boolean>` | Double‑clicks. |
| `hover(selector)` | `selector: string` | `Promise<boolean>` | Hovers the mouse. |
| `type(selector, text, opts?)` | `selector: string, text: string, opts?: { delay?, retries?, clear?, speed? }` | `Promise<boolean>` | Types text. Uses human‑like delays if `actHuman(true)`. |
| `select(selector, value)` | `selector: string, value: string` | `Promise<boolean>` | Selects an option in a `<select>` element. |
| `evaluate(js, ...args)` | `js: string \| Function, ...args: any[]` | `Promise<any>` | Executes JavaScript in the page. |

### Keyboard, Mouse, Scroll

| Method | Parameters | Returns |
|--------|------------|---------|
| `keyboard.press(key)` | `key: string` | `Promise<boolean>` |
| `keyboard.combo(combo)` | `combo: string` (e.g. `"Control+C"`) | `Promise<boolean>` |
| `mouse.move(x, y)` | `x: number, y: number` | `Promise<boolean>` |
| `mouse.drag(from, to)` | `from: {x,y}, to: {x,y}` | `Promise<boolean>` |
| `scroll.to(selector)` | `selector: string` | `Promise<boolean>` |
| `scroll.by(px)` | `px: number` | `Promise<void>` |

### Fetch & Search

| Method | Parameters | Returns |
|--------|------------|---------|
| `fetchText(selector)` | `selector: string` | `Promise<string \| null>` |
| `fetchLinks(selector)` | `selector: string` | `Promise<string[]>` |
| `fetchImages(selector)` | `selector: string` | `Promise<string[]>` |
| `search.css(query)` | `query: string` | `Promise<any>` |
| `search.id(query)` | `query: string` | `Promise<any>` |

### Screenshot & PDF

| Method | Parameters | Returns |
|--------|------------|---------|
| `screenshot(filePath?)` | `filePath?: string` | `Promise<string>` (base64 or file path) |
| `pdf(filePath?)` | `filePath?: string` | `Promise<string>` |
| `blockImages()` | — | `Promise<void>` |
| `unblockImages()` | — | `Promise<void>` |

### Cookies

| Method | Parameters | Returns |
|--------|------------|---------|
| `cookies.set(name, value, domain, path?)` | `name, value, domain, path?: string` | `Promise<void>` |
| `cookies.get(name)` | `name: string` | `Promise<any>` |
| `cookies.delete(name)` | `name: string` | `Promise<void>` |
| `cookies.list()` | — | `Promise<any[]>` |

### Interception

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `intercept.block(pattern)` | `pattern: string` | `Promise<void>` | Blocks requests matching the pattern. |
| `intercept.redirect(pattern, redirectUrl)` | `pattern: string, redirectUrl: string` | `Promise<void>` | Redirects matching requests. |
| `intercept.headers(pattern, headers)` | `pattern: string, headers: Record<string,string>` | `Promise<void>` | Adds/modifies headers on matching requests. |
| `intercept.respond(pattern, handlerOrResponse)` | `pattern: string, handlerOrResponse: object \| Function` | `Promise<SiteObject>` | Mocks a response (static object or dynamic function). |
| `intercept.modifyResponse(pattern, handler)` | `pattern: string, handler: Function` | `Promise<SiteObject>` | Modifies a real response via an exposed function. |
| `intercept.clear()` | — | `Promise<void>` | Clears all intercept rules. |

### Capture

| Method | Parameters | Returns |
|--------|------------|---------|
| `capture.start()` | — | `Promise<void>` |
| `capture.stop()` | — | `Promise<void>` |
| `capture.requests()` | — | `Promise<CapturedRequest[]>` |
| `capture.ws()` | — | `Promise<WebSocketFrame[]>` |
| `capture.cookies()` | — | `Promise<CapturedCookie[]>` |
| `capture.storage()` | — | `Promise<StorageEntry[]>` |
| `capture.clear()` | — | `Promise<void>` |

### Session

| Method | Parameters | Returns |
|--------|------------|---------|
| `session.export()` | — | `Promise<any>` |
| `session.import(data)` | `data: any` | `Promise<void>` |

### Expose Functions

| Method | Parameters | Returns |
|--------|------------|---------|
| `exposeFunction(name, handler)` | `name: string, handler: (data: any) => any` | `Promise<SiteObject>` |
| `unexposeFunction(name)` | `name: string` | `Promise<SiteObject>` |
| `clearExposedFunctions()` | — | `Promise<SiteObject>` |
| `exposeAndInject(name, handler, injectionJs)` | `name, handler, injectionJs: string \| ((fnName) => string)` | `Promise<SiteObject>` |

### Store & API Routes

| Method | Parameters | Returns |
|--------|------------|---------|
| `store(data, schemaName?)` | `data: object \| object[], schemaName?: string` | `Promise<{ stored, skipped }>` |
| `api(path, handler, opts?)` | `path: string, handler: RouteHandler, opts?: { method?, ttl?, before?, detail? }` | `SiteObject` |

### Lifecycle

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `noclose()` | — | `SiteObject` | Marks site as keep‑alive (won’t close on `piggy.close()`). |
| `close()` | — | `Promise<void>` | Closes the tab or pool. |
| `addInitScript(js)` | `js: string \| (() => void)` | `Promise<SiteObject>` | Injects a script into every new page. |
| `on(event, handler)` | `event: "navigate", handler: (url: string) => void` | `() => void` (unsubscribe) | Listens to page navigation events. |
| `poolStats()` | — | `object \| null` | Returns pool statistics if a pool was used. |

---

## 3. Sub‑API Clients

### TabsClient

| Method | Parameters | Returns |
|--------|------------|---------|
| `new()` | — | `Promise<string>` (tabId) |
| `close(tabId)` | `tabId: string` | `Promise<void>` |
| `list()` | — | `Promise<string[]>` |

### NavigationClient

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

### InteractionsClient

| Method | Parameters | Returns |
|--------|------------|---------|
| `click(selector, tabId?)` | `selector: string, tabId?: string` | `Promise<boolean>` |
| `dblclick(selector, tabId?)` | `selector: string, tabId?: string` | `Promise<boolean>` |
| `hover(selector, tabId?)` | `selector: string, tabId?: string` | `Promise<boolean>` |
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

### MediaClient

| Method | Parameters | Returns |
|--------|------------|---------|
| `screenshot(filePath?, tabId?)` | `filePath?: string, tabId?: string` | `Promise<string>` |
| `pdf(filePath?, tabId?)` | same | `Promise<string>` |
| `blockImages(tabId?)` | — | `Promise<void>` |
| `unblockImages(tabId?)` | — | `Promise<void>` |

### CaptureClient

| Method | Parameters | Returns |
|--------|------------|---------|
| `start(tabId?)` | — | `Promise<void>` |
| `stop(tabId?)` | — | `Promise<void>` |
| `requests(tabId?)` | — | `Promise<CapturedRequest[]>` |
| `ws(tabId?)` | — | `Promise<WebSocketFrame[]>` |
| `cookies(tabId?)` | — | `Promise<CapturedCookie[]>` |
| `storage(tabId?)` | — | `Promise<StorageEntry[]>` |
| `clear(tabId?)` | — | `Promise<void>` |

### FindClient

All methods return `Promise<ElementDescriptor[]>` unless otherwise noted.

| Method | Parameters | Returns |
|--------|------------|---------|
| `css(selector, tabId?)` | `selector: string` | `ElementDescriptor[]` |
| `first(selector, tabId?)` | `selector: string` | `ElementDescriptor[]` (0 or 1 element) |
| `all(selector, tabId?)` | `selector: string` | alias for `css` |
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

### ProvideClient

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
| `div(selector, tabId?)` | `selector: string` | `Promise<DivDescriptor>` |
| `meta(tabId?)` | — | `Promise<Record<string, string>>` |
| `select(selector, tabId?)` | `selector: string` | `Promise<{ value, options: { text, value, selected }[] }>` |
| `json(selector?, tabId?)` | `selector?: string` | `Promise<any>` |

### WaitClient

| Method | Parameters | Returns |
|--------|------------|---------|
| `function(js, timeout?, tabId?)` | `js: string, timeout?: number, tabId?: string` | `Promise<void>` |
| `selector(selector, state?, timeout?, tabId?)` | `selector: string, state?: "attached"\|"detached"\|"visible"\|"hidden", timeout?: number, tabId?: string` | `Promise<void>` |

### EvaluateClient

| Method | Parameters | Returns |
|--------|------------|---------|
| `run(js, timeout?, tabId?)` | `js: string, timeout?: number, tabId?: string` | `Promise<any>` |

### FetchClient

| Method | Parameters | Returns |
|--------|------------|---------|
| `text(selector, tabId?)` | `selector: string` | `Promise<string \| null>` |
| `textAll(selector, tabId?)` | `selector: string` | `Promise<string[]>` |
| `attr(selector, attr, tabId?)` | `selector, attr` | `Promise<string \| null>` |
| `attrAll(selector, attr, tabId?)` | `selector, attr` | `Promise<string[]>` |
| `links(selector, tabId?)` | `selector: string` | `Promise<string[]>` |
| `linksAll(tabId?)` | — | `Promise<string[]>` |
| `images(selector, tabId?)` | `selector: string` | `Promise<string[]>` |

### CaptchaClient

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

### DialogClient

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

### HumanClient

| Method | Parameters | Returns |
|--------|------------|---------|
| `set(opts, tabId?)` | `{ typingSpeed?, clickDelay?, scrollSpeed?, mouseWiggle? }` | `Promise<HumanProfile>` |
| `get(tabId?)` | — | `Promise<HumanProfile>` |
| `type(opts, tabId?)` | `{ selector, text, clear?, speed? }` | `Promise<void>` |
| `click(opts, tabId?)` | `{ selector, force?, delay? }` | `Promise<boolean>` |

### IframeClient

| Method | Parameters | Returns |
|--------|------------|---------|
| `list(tabId?)` | — | `Promise<IframeDescriptor[]>` |
| `evaluate(opts, tabId?)` | `{ index \| src \| id \| name, js }` | `Promise<any>` |
| `click(opts, tabId?)` | `{ index \| src \| id \| name, sel }` | `Promise<boolean>` |
| `type(opts, tabId?)` | `{ index \| src \| id \| name, sel, text }` | `Promise<boolean>` |
| `text(opts, tabId?)` | `{ index \| src \| id \| name, sel }` | `Promise<string>` |
| `html(opts, tabId?)` | `{ index \| src \| id \| name }` | `Promise<string>` |
| `waitSel(opts, tabId?)` | `{ index \| src \| id \| name, sel, timeout? }` | `Promise<boolean>` |

### SessionClient

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

### ExportClient

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

### ProxyClient

All methods are global (no `tabId`). The global `piggy.proxy` object wraps this client.

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

### PiggyHttpClient

Direct HTTP client (no socket). Returned by `piggy.http(opts)`.

| Method | Parameters | Returns |
|--------|------------|---------|
| `ping()` | — | `Promise<boolean>` |
| `send<T>(cmd, payload?)` | `cmd: string, payload?: object` | `Promise<T>` |

---

## 4. Events

Events are emitted by the server and can be subscribed to using `piggy.onEvent(eventName, tabId, handler)` or, for site‑specific navigation, `site.on("navigate", handler)`.

| Event | Data | Source |
|-------|------|--------|
| `captcha` | `{ tabId, captchaType }` | Captcha detection |
| `captcha:resolved` | `{ tabId }` | Captcha resolved |
| `blocked` | `{ tabId, blockType }` | Block detected |
| `block:retry` | `{ tabId, proxy }` | Auto‑retry triggered |
| `dialog` | `{ tabId, dialogType, message, defaultValue }` | JavaScript dialog |
| `navigate` | `{ tabId, url }` | Page navigation |
| `exposed_call` | `{ tabId, name, callId, data }` | Exposed function call from page |
| `proxy:changed` | `{ proxy, host, port, latency }` | Proxy rotated |
| `proxy:loaded` | `{ count }` | Proxies loaded from file/URL |
| `proxy:fetch:failed` | `{ error }` | Fetch failed |
| `proxy:check:started` | `{ total }` | Health check started |
| `proxy:alive` | `{ index, latency }` | Proxy alive |
| `proxy:dead` | `{ index, latency }` | Proxy dead |
| `proxy:check:done` | `{ alive, dead }` | Health check finished |
| `proxy:exhausted` | — | No alive proxies remain |
| `proxy:ovpn:loaded` | `{ remote, port }` | OVPN config loaded |

---

## 5. Type Definitions

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
  workDir: string;     // QDir::currentPath() – where the script runs
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

interface DivDescriptor {
  tag: string;
  id: string;
  cls: string;
  text: string;
  html: string;
  children: DivDescriptor[];   // direct children only, max 20
}

interface ProxyCurrent {
  active: boolean;
  host?: string;
  port?: number;
  type?: "http" | "https" | "socks5";
  user?: string;
  proxy?: string;
  latency?: number;
  health?: "alive" | "dead" | "checking" | "unchecked";
}

interface ProxyStats {
  total: number;
  alive: number;
  dead: number;
  index: number;
  active: boolean;
  checking: boolean;
  skipDead: boolean;
  autoCheck: boolean;
}

interface ProxyEntry {
  index: number;
  host: string;
  port: number;
  type: "http" | "https" | "socks5";
  user: string;
  proxy: string;
  latency: number;
  health: "alive" | "dead" | "checking" | "unchecked";
  current: boolean;
}

interface ProxyListResult {
  proxies: ProxyEntry[];
  total: number;
  shown: number;
}

interface ProxyConfig {
  skipDead: boolean;
  autoCheck: boolean;
}
```

