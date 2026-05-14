
# Piggy Commands — Response Samples (Fully Corrected)

> See exactly what every command returns when pointed at the same page.
> All examples are based on the sample HTML below. ✅ *All known issues fixed.*

---

## The Sample Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>Product Page</title>
  <meta name="description" content="Best wireless mice">
  <script type="application/ld+json">
    { "@type": "Product", "name": "Wireless Mouse", "price": "29.99" }
  </script>
</head>
<body>
  <div id="product-list">
    <div class="product-card" data-id="42">
      <img src="/img/mouse.jpg" alt="Wireless Mouse" width="200" height="200">
      <div class="info">
        <h3 class="title">Wireless Mouse</h3>
        <span class="price">$29.99</span>
        <a href="/buy/42" class="buy-link">Buy Now</a>
      </div>
      <ul class="features">
        <li>Ergonomic</li>
        <li>Rechargeable</li>
        <li>Silent clicks</li>
      </ul>
      <form class="add-to-cart">
        <input type="hidden" name="product_id" value="42">
        <select name="color">
          <option value="black" selected>Black</option>
          <option value="white">White</option>
        </select>
        <button type="submit">Add to Cart</button>
      </form>
    </div>
    <div class="product-card" data-id="99">
      <img src="/img/keyboard.jpg" alt="Mechanical Keyboard" width="300" height="150">
      <div class="info">
        <h3 class="title">Mechanical Keyboard</h3>
        <span class="price">$89.99</span>
        <a href="/buy/99" class="buy-link">Buy Now</a>
      </div>
      <ul class="features">
        <li>RGB backlit</li>
        <li>Cherry MX switches</li>
      </ul>
      <form class="add-to-cart">
        <input type="hidden" name="product_id" value="99">
        <select name="layout">
          <option value="us">US</option>
          <option value="uk">UK</option>
        </select>
        <button type="submit">Add to Cart</button>
      </form>
    </div>
  </div>
  <table id="comparison">
    <tr><th>Feature</th><th>Mouse</th><th>Keyboard</th></tr>
    <tr><td>Wireless</td><td>Yes</td><td>No</td></tr>
    <tr><td>Backlit</td><td>No</td><td>Yes</td></tr>
  </table>
</body>
</html>
```

---

## 1. Provide API — Structured Extraction

### `provide.text`
**Returns:** `Promise<string>` — visible text of first matching element, trimmed.

```ts
await piggy.site.provide.text({ selector: ".price" })
// → "$29.99"

await piggy.site.provide.text({ selector: ".product-card" })
// → "Wireless Mouse $29.99 Buy Now Ergonomic Rechargeable Silent clicks Black Add to Cart"
```

### `provide.textAll`
**Returns:** `Promise<string[]>` — visible text of **all** matching elements.

```ts
await piggy.site.provide.textAll({ selector: ".price" })
// → ["$29.99", "$89.99"]

await piggy.site.provide.textAll({ selector: ".title" })
// → ["Wireless Mouse", "Mechanical Keyboard"]
```

### `provide.html`
**Returns:** `Promise<string>` — raw inner HTML of first matching element.

```ts
await piggy.site.provide.html({ selector: ".info" })
// → `<h3 class="title">Wireless Mouse</h3>
//    <span class="price">$29.99</span>
//    <a href="/buy/42" class="buy-link">Buy Now</a>`
```

### `provide.attr`
**Returns:** `Promise<string>` — single attribute value from first matching element.

```ts
await piggy.site.provide.attr({ selector: ".product-card", attr: "data-id" })
// → "42"

await piggy.site.provide.attr({ selector: "img", attr: "src" })
// → "/img/mouse.jpg"
```

### `provide.attrAll`
**Returns:** `Promise<string[]>` — attribute values from all matching elements.

```ts
await piggy.site.provide.attrAll({ selector: ".product-card", attr: "data-id" })
// → ["42", "99"]

await piggy.site.provide.attrAll({ selector: "img", attr: "alt" })
// → ["Wireless Mouse", "Mechanical Keyboard"]
```

### `provide.div`
**Returns:** `Promise<DivDescriptor>` — element structure with **direct children** (max 20). Not fully recursive.

```ts
await piggy.site.provide.div({ selector: ".product-card" })
// → {
//   tag: "div",
//   id: "",
//   cls: "product-card",
//   text: "Wireless Mouse $29.99 Buy Now ...",
//   html: "<img...><div class=\"info\">...",
//   children: [
//     { tag: "img", id: "", cls: "", text: "", html: "", src: "/img/mouse.jpg", alt: "Wireless Mouse" },
//     { tag: "div", id: "", cls: "info", text: "Wireless Mouse $29.99 Buy Now", html: "...", children: [...] },
//     { tag: "ul", children: [...] },
//     { tag: "form", children: [...] }
//   ]
// }
```

### `provide.links`
**Returns:** `Promise<LinkDescriptor[]>` — all links (text, href, title) in scope.

```ts
await piggy.site.provide.links({ selector: ".product-card:first-child" })
// → [
//   { text: "Buy Now", href: "/buy/42", title: "" }
// ]

await piggy.site.provide.links() // entire page
// → [
//   { text: "Buy Now", href: "/buy/42", title: "" },
//   { text: "Buy Now", href: "/buy/99", title: "" }
// ]
```

### `provide.images`
**Returns:** `Promise<ImageDescriptor[]>` — all images (src, alt, width, height).

```ts
await piggy.site.provide.images()
// → [
//   { src: "/img/mouse.jpg", alt: "Wireless Mouse", width: 200, height: 200 },
//   { src: "/img/keyboard.jpg", alt: "Mechanical Keyboard", width: 300, height: 150 }
// ]
```

### `provide.table`
**Returns:** `Promise<TableData>` — converts HTML table to headers + rows.

```ts
await piggy.site.provide.table({ selector: "#comparison" })
// → {
//   headers: ["Feature", "Mouse", "Keyboard"],
//   rows: [
//     ["Wireless", "Yes", "No"],
//     ["Backlit", "No", "Yes"]
//   ]
// }
```

### `provide.list`
**Returns:** `Promise<string[]>` — extracts text from list items.

```ts
await piggy.site.provide.list({ selector: ".features" })
// → ["Ergonomic", "Rechargeable", "Silent clicks"]

await piggy.site.provide.list({ selector: "#product-list", itemSel: ".product-card" })
// → ["Wireless Mouse $29.99 Buy Now Ergonomic...", "Mechanical Keyboard $89.99 Buy Now RGB..."]
```

### `provide.form`
**Returns:** `Promise<Record<string, string>>` — form field name-value pairs.

```ts
await piggy.site.provide.form({ selector: ".add-to-cart" })
// → { product_id: "42", color: "black" }
```

### `provide.page`
**Returns:** `Promise<PageData>` — full page metadata and content.

```ts
await piggy.site.provide.page()
// → {
//   title: "Product Page",
//   url: "https://example.com/products",
//   html: "<!DOCTYPE html>...",
//   text: "Product Page Wireless Mouse $29.99 Buy Now ..."
// }
```

### `provide.meta`
**Returns:** `Promise<Record<string, string>>` — all `<meta>` tags.

```ts
await piggy.site.provide.meta()
// → { "description": "Best wireless mice" }
```

### `provide.select`
**Returns:** `Promise<SelectData>` — selected value and all options.

```ts
await piggy.site.provide.select({ selector: "select[name='color']" })
// → {
//   value: "black",
//   options: [
//     { text: "Black", value: "black", selected: true },
//     { text: "White", value: "white", selected: false }
//   ]
// }
```

### `provide.json`
**Returns:** `Promise<any>` — extracts embedded JSON (LD+JSON, Next.js, Nuxt).

```ts
await piggy.site.provide.json()
// → { "@type": "Product", "name": "Wireless Mouse", "price": "29.99" }
```

---

## 2. Find API — Element Descriptors

All `find.*` commands return an **ElementDescriptor**:

```ts
interface ElementDescriptor {
  tag: string;      // element tag name
  id: string;       // element id attribute
  cls: string;      // element class attribute
  text: string;     // first 400 chars of innerText
  html: string;     // first 800 chars of innerHTML
  href: string;     // href attribute (if any)
  src: string;      // src attribute (if any)
  value: string;    // value attribute (if any)
  attrs: Record<string, string>;  // all attributes
}
```

### `find.css` / `find.all`
```ts
await piggy.site.find.css({ selector: ".price" })
// → [
//   { tag: "span", id: "", cls: "price", text: "$29.99", html: "$29.99", href: "", src: "", value: "", attrs: { class: "price" } },
//   { tag: "span", id: "", cls: "price", text: "$89.99", html: "$89.99", href: "", src: "", value: "", attrs: { class: "price" } }
// ]
```

### `find.first`
```ts
await piggy.site.find.first({ selector: ".title" })
// → [ { tag: "h3", id: "", cls: "title", text: "Wireless Mouse", html: "Wireless Mouse", ... } ]
```

### `find.byText`
```ts
await piggy.site.find.byText({ text: "Silent clicks" })
// → [ { tag: "li", text: "Silent clicks", ... } ]

await piggy.site.find.byText({ text: "Add to Cart", exact: true })
// → [ { tag: "button", text: "Add to Cart", ... } ]
```

### `find.byAttr`
```ts
await piggy.site.find.byAttr({ attr: "data-id", value: "99" })
// → [ { tag: "div", cls: "product-card", attrs: { "data-id": "99", class: "product-card" }, ... } ]
```

### `find.byTag`
```ts
await piggy.site.find.byTag({ tag: "img" })
// → [
//   { tag: "img", src: "/img/mouse.jpg", alt: "Wireless Mouse", ... },
//   { tag: "img", src: "/img/keyboard.jpg", alt: "Mechanical Keyboard", ... }
// ]
```

### `find.closest`
```ts
await piggy.site.find.closest({ selector: ".price", ancestor: ".product-card" })
// → [ { tag: "div", cls: "product-card", attrs: { "data-id": "42", class: "product-card" }, ... } ]
```

### `find.parent`
```ts
await piggy.site.find.parent({ selector: ".price" })
// → [ { tag: "div", cls: "info", ... } ]
```

### `find.children`
```ts
await piggy.site.find.children({ selector: ".features" })
// → [
//   { tag: "li", text: "Ergonomic", ... },
//   { tag: "li", text: "Rechargeable", ... },
//   { tag: "li", text: "Silent clicks", ... }
// ]
```

### `find.filter`
```ts
await piggy.site.find.filter({ selector: ".product-card", attr: "data-id", value: "42" })
// → [ { tag: "div", cls: "product-card", attrs: { "data-id": "42", class: "product-card" }, ... } ]
```

### `find.count`
```ts
await piggy.site.find.count({ selector: ".product-card" })
// → 2
```

### `find.exists`
```ts
await piggy.site.find.exists({ selector: "#comparison" })
// → true
```

### `find.visible`
```ts
await piggy.site.find.visible({ selector: ".buy-link" })
// → true
```

### `find.enabled`
```ts
await piggy.site.find.enabled({ selector: "button" })
// → true
```

### `find.checked`
```ts
await piggy.site.find.checked({ selector: "input[type='checkbox']" })
// → false
```

---

## 3. Fetch & Search (Legacy but Valid)

### `fetch.text`
```ts
await piggy.site.fetch.text({ query: ".price" })
// → "$29.99"
```

### `fetch.textAll`
```ts
await piggy.site.fetch.textAll({ selector: ".price" })
// → ["$29.99", "$89.99"]
```

### `fetch.links`
```ts
await piggy.site.fetch.links({ query: ".product-card:first-child" })
// → ["/buy/42"]
```

### `fetch.links.all`
```ts
await piggy.site.fetch.links.all()
// → ["/buy/42", "/buy/99"]
```

### `fetch.image`
```ts
await piggy.site.fetch.image({ query: ".product-card" })
// → ["/img/mouse.jpg", "/img/keyboard.jpg"]
```

### `search.css`
```ts
await piggy.site.search.css()
// → (large JSON snapshot of entire DOM)
```

### `search.id`
```ts
await piggy.site.search.id({ query: "product-list" })
// → { tag: "div", id: "product-list", cls: "", text: "...", html: "...", ... }
```

---

## 4. Wait API

### `wait.selector`
**Returns:** `Promise<void>` — resolves when condition is met.

```ts
await piggy.site.wait.selector({ selector: ".product-card", state: "attached" })
// resolves

await piggy.site.wait.selector({ selector: ".product-card", state: "visible", timeout: 5000 })
// resolves or throws timeout error
```

### `wait.function`
```ts
await piggy.site.wait.function({ js: "document.querySelectorAll('.product-card').length >= 2" })
// resolves
```

---

## 5. Cookie Management

### `cookie.set`
```ts
await piggy.site.cookies.set("cart", "42", "example.com")
// resolves (no return value)
```

### `cookie.get`
```ts
await piggy.site.cookies.get("cart")
// → { name: "cart", value: "42", domain: "example.com", path: "/", httpOnly: false, secure: false, expires: null }
```

### `cookie.list`
```ts
await piggy.site.cookies.list()
// → [
//   { name: "cart", value: "42", domain: "example.com", path: "/", httpOnly: false, secure: false },
//   { name: "session", value: "xyz123", domain: "example.com", path: "/", httpOnly: true, secure: true }
// ]
```

### `cookie.delete`
```ts
await piggy.site.cookies.delete("cart")
// resolves
```

---

## 6. Capture API

After calling `capture.start()`:

### `capture.requests`
**Returns:** `Promise<CapturedRequest[]>`

```ts
await piggy.site.capture.requests()
// → [
//   {
//     method: "GET",
//     url: "https://example.com/products",
//     status: "200",
//     type: "document",
//     mime: "text/html",
//     reqHeaders: "accept: */*",
//     reqBody: "",
//     resHeaders: "content-type: text/html",
//     resBody: "<!DOCTYPE html>...",
//     size: 12345,
//     timestamp: "2025-01-15T10:30:00Z"
//   }
// ]
```

### `capture.ws`
**Returns:** `Promise<WebSocketFrame[]>`

```ts
await piggy.site.capture.ws()
// → [
//   {
//     connectionId: "ws-1",
//     url: "wss://example.com/socket",
//     direction: "sent",
//     data: "{\"action\":\"subscribe\"}",
//     binary: false,
//     timestamp: "2025-01-15T10:30:01Z"
//   }
// ]
```

### `capture.cookies`
**Returns:** `Promise<CapturedCookie[]>` — **full cookie objects**

```ts
await piggy.site.capture.cookies()
// → [
//   {
//     name: "cart",
//     value: "42",
//     domain: "example.com",
//     path: "/",
//     httpOnly: false,
//     secure: false,
//     expires: "2025-02-15T10:30:00Z"
//   }
// ]
```

### `capture.storage`
**Returns:** `Promise<StorageEntry[]>` — **flat array, not nested object**

```ts
await piggy.site.capture.storage()
// → [
//   { key: "localStorage:https://example.com:theme", value: "dark" },
//   { key: "sessionStorage:https://example.com:scrollPos", value: "120" }
// ]
```

### `capture.clear`
```ts
await piggy.site.capture.clear()
// resolves
```

---

## 7. Screenshot & PDF

### `screenshot`
**Returns:** `Promise<string>` — base64 PNG (or file path if provided)

```ts
const b64 = await piggy.site.screenshot()
// → "iVBORw0KGgoAAAANSUhEUgAA..."

const filePath = await piggy.site.screenshot("./error.png")
// → "./error.png"
```

### `pdf`
**Returns:** `Promise<string>` — base64 PDF (or file path)

```ts
const pdf = await piggy.site.pdf()
// → "JVBERi0xLjQKJcOkw7..."
```

---

## 8. Intercept Rules

### `intercept.rule.add` — Block
```ts
await piggy.site.intercept.block("*/ads/*")
// resolves
```

### `intercept.rule.add` — Redirect
```ts
await piggy.site.intercept.redirect("*/old-api/*", "https://new-api.example.com")
// resolves
```

### `intercept.rule.add` — Modify Headers
```ts
await piggy.site.intercept.headers("*/api/*", { "X-Custom": "my-value" })
// resolves
```

### `intercept.respond` — Static Response
```ts
await piggy.site.intercept.respond("/api/products", {
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ mock: true })
})
// resolves
```

### `intercept.respond` — Dynamic Response
```ts
await piggy.site.intercept.respond("/api/products", async (req) => {
  return {
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ url: req.url, method: req.method })
  }
})
// resolves
```

### `intercept.modifyResponse`
```ts
await piggy.site.intercept.modifyResponse("/api/*", async (response) => {
  const data = JSON.parse(response.body);
  data.injected = true;
  return { body: JSON.stringify(data) };
})
// resolves
```

### `intercept.clear`
```ts
await piggy.site.intercept.clear()
// resolves
```

---

## 9. Human Mode

### `human.get`
```ts
await piggy.site.human.get()
// → { typingSpeed: "normal", clickDelay: "normal", scrollSpeed: "normal", mouseWiggle: false }
```

### `human.set`
```ts
await piggy.site.human.set({ typingSpeed: "slow", mouseWiggle: true })
// → { typingSpeed: "slow", clickDelay: "normal", scrollSpeed: "normal", mouseWiggle: true }
```

### `human.type`
```ts
await piggy.site.human.type({ selector: "input", text: "Hello", clear: true, speed: 120 })
// resolves
```

### `human.click`
```ts
await piggy.site.human.click({ selector: ".buy-link", force: true, delay: 600 })
// → true
```

---

## 10. Iframe API

### `iframe.list`
```ts
await piggy.site.iframe.list()
// → [
//   { index: 0, src: "https://payment.example.com", id: "pay-frame", name: "pay", width: 400, height: 300 }
// ]
```

### `iframe.evaluate`
```ts
await piggy.site.iframe.evaluate({ frameIndex: 0, js: "document.title" })
// → "Payment Page"
```

### `iframe.click`
```ts
await piggy.site.iframe.click({ frameIndex: 0, sel: "#submit" })
// → true
```

### `iframe.text`
```ts
await piggy.site.iframe.text({ frameIndex: 0, sel: ".total" })
// → "$29.99"
```

### `iframe.html`
```ts
await piggy.site.iframe.html({ frameIndex: 0 })
// → "<!DOCTYPE html>..."
```

### `iframe.waitSel`
```ts
await piggy.site.iframe.waitSel({ frameIndex: 0, sel: "#payment-form", timeout: 5000 })
// resolves
```

---

## 11. Expose Function

### `expose.function` + `exposed.result`
```ts
// Node.js side
await piggy.site.exposeFunction("multiply", async (data) => {
  return data.a * data.b;
});

// Browser side (after navigation)
const result = await window.multiply({ a: 6, b: 7 });
// → 42
```

### `exposeAndInject`
```ts
await piggy.site.exposeAndInject("greet", async (name) => {
  return `Hello, ${name}!`;
}, (fnName) => `
  window.${fnName} = async (name) => {
    const result = await window.__piggy_exposed__('${fnName}', { name });
    return result;
  };
`);
// resolves
```

---

## 12. Init Script

### `addInitScript`
```ts
await piggy.site.addInitScript(() => {
  console.log("This runs on every page before DOMContentLoaded");
  window.myGlobal = true;
});
// resolves
```

---

## 13. Proxy API

### `proxy.current`
```ts
await piggy.proxy.current()
// → {
//   active: true,
//   host: "1.2.3.4",
//   port: 8080,
//   type: "http",
//   user: "",
//   proxy: "http://1.2.3.4:8080",
//   latency: 120,
//   health: "alive"
// }
```

### `proxy.stats`
```ts
await piggy.proxy.stats()
// → {
//   total: 10,
//   alive: 8,
//   dead: 2,
//   index: 3,
//   active: true,
//   checking: false,
//   skipDead: true,
//   autoCheck: true
// }
```

### `proxy.list`
```ts
await piggy.proxy.list(5)
// → {
//   proxies: [
//     { index: 0, host: "1.2.3.4", port: 8080, type: "http", user: "", proxy: "http://1.2.3.4:8080", latency: 0, health: "unchecked", current: false },
//     // ... up to 5 entries
//   ],
//   total: 10,
//   shown: 5
// }
```

### `proxy.rotation`
```ts
await piggy.proxy.rotation("timed", 30)
// resolves
```

### `proxy.save`
```ts
await piggy.proxy.save("./alive-proxies.txt", "alive")
// resolves
```

---

## 14. Captcha & Block

### `captcha.status`
```ts
await piggy.site.captcha.status()
// → { detected: true, paused: true, type: "cloudflare" }
// type: "cloudflare" | "recaptcha" | "hcaptcha" | "generic"
```

### `captcha.resolve`
```ts
await piggy.site.captcha.resolve()
// resolves
```

### `block.status`
```ts
await piggy.site.captcha.blockStatus()
// → { detected: false, type: null }
// type: "403" | "access-denied" | "firewall" | "rate-limit"
```

### `block.retry`
```ts
await piggy.site.captcha.blockRetry()
// resolves (rotates proxy and reloads)
```

---

## 15. Dialog API

### `dialog.status`
```ts
await piggy.site.dialog.status()
// → { pending: true, type: "confirm", message: "Are you sure?", defaultValue: "" }
```

### `dialog.accept`
```ts
await piggy.site.dialog.accept()
// resolves

await piggy.site.dialog.accept("Custom input text")  // for prompt dialogs
// resolves
```

### `dialog.dismiss`
```ts
await piggy.site.dialog.dismiss()
// resolves
```

### `upload`
```ts
await piggy.site.dialog.upload("#file-input", "/absolute/path/to/file.pdf")
// resolves
```

---

## 16. Session API

### `session.paths`
```ts
await piggy.site.session.paths()
// → {
//   workDir: "/home/user/my-scraper",  // NOT a temp folder — actual cwd!
//   cookies: "/home/user/my-scraper/cookies.json",
//   profile: "/home/user/my-scraper/profile.json",
//   ws: "/home/user/my-scraper/ws.json",
//   pings: "/home/user/my-scraper/pings.json"
// }
```

### `session.reload`
```ts
await piggy.site.session.reload()
// resolves — reloads cookies.json and profile.json from disk
```

### `session.ws.save`
```ts
await piggy.site.session.setWsSave(true)
// resolves — enables WebSocket frame persistence to ws.json
```

### `session.export`
```ts
await piggy.site.session.export()
// → { url: "https://example.com/products", requests: [...], ws: [...], cookies: [...] }
```

### `session.import`
```ts
await piggy.site.session.import(exportedData)
// resolves
```

---

## 17. Tab Management

### `tabs.new`
```ts
const newTabId = await piggy.tabs.new()
// → "550e8400-e29b-41d4-a716-446655440000"
```

### `tabs.list`
```ts
await piggy.tabs.list()
// → ["default", "550e8400-e29b-41d4-a716-446655440000"]
```

### `tabs.close`
```ts
await piggy.tabs.close(newTabId)
// resolves
```

---

## Events (Server → Client)

All events are received via `piggy.onEvent()` or `site.on()`.

### `captcha` event
```ts
piggy.onEvent("captcha", "tabId", (data) => {
  console.log(data.captchaType)  // "cloudflare"
  console.log(data.tabId)
})
```

### `dialog` event
```ts
piggy.onEvent("dialog", "tabId", (data) => {
  console.log(data.dialogType)   // "alert" | "confirm" | "prompt"
  console.log(data.message)
  console.log(data.defaultValue)
})
```

### `navigate` event
```ts
site.on("navigate", (url) => {
  console.log(`Navigated to: ${url}`)
})
```

### `exposed_call` event
```ts
piggy.onEvent("exposed_call", "tabId", (data) => {
  console.log(data.name)    // function name
  console.log(data.callId)  // unique ID
  console.log(data.data)    // JSON string of arguments
})
```

### Proxy events
```ts
piggy.proxy.on("proxy:changed", (data) => {
  console.log(`Now using: ${data.proxy}`)
})

piggy.proxy.on("proxy:exhausted", () => {
  console.log("No alive proxies remaining!")
})
```

---

## Type Definitions Reference

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
  workDir: string;     // QDir::currentPath() — where script runs
  cookies: string;
  profile: string;
  ws: string;
  pings: string;
}
```

