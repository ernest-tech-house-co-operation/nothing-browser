/**
 * 09 — Network Capture
 * APIs: capture.start, capture.stop, capture.requests, capture.ws,
 *       capture.cookies, capture.storage, capture.clear
 * Target: books.toscrape.com
 */

import piggy from "nothing-browser"

await piggy.launch({ mode: "tab" })
await piggy.register("books", "https://books.toscrape.com")

// ── Start capturing before navigation ────────────────────────────────────────
await piggy.books.capture.start()
console.log("Capture started ✓")

// Navigate — all network traffic is now being captured
await piggy.books.navigate()
await piggy.books.waitForSelector(".product_pod")

// Click through to a book page — more requests captured
await piggy.books.click(".product_pod h3 a")
await piggy.books.wait.navigation()
await piggy.books.waitForSelector(".product_main")

// ── Stop capturing ────────────────────────────────────────────────────────────
await piggy.books.capture.stop()
console.log("Capture stopped ✓")

// ── Inspect captured HTTP requests ────────────────────────────────────────────
const requests = await piggy.books.capture.requests()
console.log(`\nCaptured ${requests.length} HTTP requests`)

// Show unique request types
const types = [...new Set(requests.map(r => r.type))]
console.log("Request types:", types)

// Show all unique domains hit
const domains = [...new Set(requests.map(r => {
  try { return new URL(r.url).hostname } catch { return "unknown" }
}))].filter(Boolean)
console.log("Domains:", domains)

// Find HTML document requests
const htmlReqs = requests.filter(r => r.type === "Document" || r.mime?.includes("html"))
console.log(`\nHTML requests: ${htmlReqs.length}`)
htmlReqs.forEach(r => console.log(`  [${r.status}] ${r.method} ${r.url}`))

// Find image requests
const imageReqs = requests.filter(r => r.type === "Image" || r.mime?.includes("image"))
console.log(`\nImage requests: ${imageReqs.length}`)

// Show request with response body (first CSS/JS)
const cssReq = requests.find(r => r.mime?.includes("css"))
if (cssReq) {
  console.log(`\nCSS file: ${cssReq.url}`)
  console.log(`Response body preview: ${cssReq.resBody?.slice(0, 100)}`)
}

// ── WebSocket frames (books.toscrape.com has none, but showing the API) ───────
const wsFrames = await piggy.books.capture.ws()
console.log(`\nWS frames: ${wsFrames.length}`)
if (wsFrames.length > 0) {
  wsFrames.forEach(f => console.log(`  [${f.direction}] ${f.url}: ${f.data.slice(0, 50)}`))
}

// ── Cookies captured during network activity ──────────────────────────────────
const capturedCookies = await piggy.books.capture.cookies()
console.log(`\nCaptured cookies: ${capturedCookies.length}`)
capturedCookies.forEach(c => console.log(`  ${c.name}=${c.value.slice(0, 20)} @ ${c.domain}`))

// ── Storage entries captured ──────────────────────────────────────────────────
const storage = await piggy.books.capture.storage()
console.log(`\nStorage entries: ${storage.length}`)
storage.forEach(s => console.log(`  ${s.key} = ${String(s.value).slice(0, 50)}`))

// ── Clear all captured data ───────────────────────────────────────────────────
await piggy.books.capture.clear()
const afterClear = await piggy.books.capture.requests()
console.log(`\nAfter clear: ${afterClear.length} requests (should be 0)`)

await piggy.close()
