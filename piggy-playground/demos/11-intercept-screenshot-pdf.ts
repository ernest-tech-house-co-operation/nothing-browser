/**
 * 11 — Intercept Rules + Screenshot + PDF
 * APIs: intercept.rule.add, intercept.rule.clear, intercept.block.images,
 *       intercept.unblock.images, intercept.respond, intercept.modifyResponse,
 *       screenshot, pdf
 * Target: books.toscrape.com
 */

import piggy from "nothing-browser"
import { writeFileSync } from "fs"

await piggy.launch({ mode: "tab" })
await piggy.register("books", "https://books.toscrape.com")

// ── Block images — faster page loads ─────────────────────────────────────────
await piggy.books.intercept.block.images()
console.log("Images blocked ✓")

const t0 = Date.now()
await piggy.books.navigate()
await piggy.books.waitForSelector(".product_pod")
console.log(`Loaded without images in ${Date.now() - t0}ms`)

// Unblock for next test
await piggy.books.intercept.unblock.images()
console.log("Images unblocked ✓")

// ── intercept.rule.add — block a URL pattern ──────────────────────────────────
await piggy.books.intercept.rule.add({
  pattern: "*://books.toscrape.com/static/oscar/css/*",
  block:   true,
})
console.log("\nBlocking CSS files ✓")

await piggy.books.navigate()
await piggy.books.waitForSelector("h1")
console.log("Page loaded without CSS (looks broken, expected)")

// ── Clear rules ───────────────────────────────────────────────────────────────
await piggy.books.intercept.rule.clear()
console.log("Rules cleared ✓")

// ── intercept.rule.add — inject custom headers ────────────────────────────────
await piggy.books.intercept.rule.add({
  pattern:    "*://books.toscrape.com/*",
  setHeaders: {
    "X-Piggy-Demo": "hello-from-piggy",
    "Accept-Language": "en-US,en;q=0.9",
  },
})
console.log("\nHeader injection rule added ✓")

// ── intercept.respond — mock an API endpoint (TS layer) ───────────────────────
piggy.books.intercept.respond("*://books.toscrape.com/api/products*", {
  status:  200,
  headers: { "Content-Type": "application/json" },
  body:    JSON.stringify([
    { id: 1, title: "Mocked Book", price: "$9.99" },
    { id: 2, title: "Another Mock", price: "$14.99" },
  ]),
})
console.log("Mock API response registered ✓")

// ── intercept.modifyResponse — transform a response before the page sees it ───
piggy.books.intercept.modifyResponse("*://books.toscrape.com/catalogue/*.html", (body: string) => {
  // Inject a banner into every product page
  return body.replace("<body>", '<body><div style="background:lime;padding:10px">🐷 Piggy was here</div>')
})
console.log("Response modifier registered ✓")

// Navigate again with rules active
await piggy.books.intercept.rule.clear()
await piggy.books.navigate()
await piggy.books.waitForSelector(".product_pod")

// ── screenshot — capture current page ────────────────────────────────────────
const b64 = await piggy.books.screenshot()
const buf = Buffer.from(b64, "base64")
writeFileSync("./screenshot-demo.png", buf)
console.log(`\nScreenshot saved: screenshot-demo.png (${buf.length} bytes)`)

// ── pdf — export current page as PDF ─────────────────────────────────────────
const pdfB64 = await piggy.books.pdf()
const pdfBuf = Buffer.from(pdfB64, "base64")
writeFileSync("./page-demo.pdf", pdfBuf)
console.log(`PDF saved: page-demo.pdf (${pdfBuf.length} bytes)`)

// Screenshot a specific product page
await piggy.books.navigate("https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html")
await piggy.books.waitForSelector(".product_main")
const productShot = await piggy.books.screenshot()
writeFileSync("./product-screenshot.png", Buffer.from(productShot, "base64"))
console.log("Product screenshot saved ✓")

await piggy.close()
