/**
 * 16 — Multi-Tab Parallel Scraping
 * APIs: tab.new, tab.close, tab.list, register with multiple sites,
 *       parallel evaluate across tabs
 * Target: books.toscrape.com pages 1-4 simultaneously
 */

import piggy from "nothing-browser"

await piggy.launch({ mode: "tab" })

// ── Register multiple sites simultaneously ────────────────────────────────────
const pages = [1, 2, 3, 4]
for (const p of pages) {
  await piggy.register(
    `page${p}`,
    `https://books.toscrape.com/catalogue/page-${p}.html`
  )
}
console.log(`Registered ${pages.length} site slots ✓`)

// ── tab.list — see all tabs ───────────────────────────────────────────────────
const tabs = await piggy.tab.list()
console.log(`Open tabs: ${tabs.length}`)

// ── Parallel navigation — all 4 pages at once ────────────────────────────────
console.log("\nNavigating all pages in parallel...")
const t0 = Date.now()

await Promise.all(pages.map(p =>
  piggy[`page${p}`].navigate()
    .then(() => piggy[`page${p}`].waitForSelector(".product_pod"))
))

console.log(`All 4 pages loaded in ${Date.now() - t0}ms`)

// ── Parallel data extraction ──────────────────────────────────────────────────
const results = await Promise.all(pages.map(async p => {
  const books = await piggy[`page${p}`].evaluate(() =>
    Array.from(document.querySelectorAll(".product_pod")).map(el => ({
      title: el.querySelector("h3 a")?.getAttribute("title") ?? "",
      price: el.querySelector(".price_color")?.textContent?.trim() ?? "",
    }))
  )
  return { page: p, count: books.length, books }
}))

let total = 0
for (const { page, count, books } of results) {
  console.log(`Page ${page}: ${count} books`)
  console.log(`  First: "${books[0]?.title}" at ${books[0]?.price}`)
  total += count
}
console.log(`\nTotal books extracted: ${total}`)

// ── Deduplicate across pages ──────────────────────────────────────────────────
const allBooks = results.flatMap(r => r.books)
const unique   = [...new Map(allBooks.map(b => [b.title, b])).values()]
console.log(`Unique titles: ${unique.length}`)

// ── tab.new — create a raw tab ────────────────────────────────────────────────
const tabId = await piggy.tab.new()
console.log(`\ntab.new: created tab ${tabId}`)

// ── tab.list after new tab ────────────────────────────────────────────────────
const tabsAfter = await piggy.tab.list()
console.log(`Tabs after tab.new: ${tabsAfter.length}`)

// ── tab.close ─────────────────────────────────────────────────────────────────
await piggy.tab.close({ tabId })
console.log(`tab.close: closed ${tabId}`)

const tabsFinal = await piggy.tab.list()
console.log(`Tabs after close: ${tabsFinal.length}`)

// ── Sequential vs parallel comparison ────────────────────────────────────────
console.log("\n--- Sequential comparison ---")
await piggy.register("seq", "https://books.toscrape.com")

const tSeq = Date.now()
for (const p of pages) {
  await piggy.seq.navigate(`https://books.toscrape.com/catalogue/page-${p}.html`)
  await piggy.seq.waitForSelector(".product_pod")
}
const seqMs = Date.now() - tSeq
console.log(`Sequential (4 pages): ${seqMs}ms`)
console.log(`Parallel   (4 pages): ${Date.now() - t0 - seqMs}ms faster`)

await piggy.close()
