/**
 * 05 — Provide API
 * APIs: provide.text, provide.textAll, provide.attr, provide.attrAll, provide.html,
 *       provide.table, provide.list, provide.links, provide.images, provide.form,
 *       provide.page, provide.div, provide.meta, provide.select, provide.json
 * Target: books.toscrape.com + quotes.toscrape.com
 */

import piggy from "nothing-browser"

await piggy.launch({ mode: "tab" })
await piggy.register("books",  "https://books.toscrape.com")
await piggy.register("quotes", "https://quotes.toscrape.com")

// ── books.toscrape.com ────────────────────────────────────────────────────────
await piggy.books.navigate()
await piggy.books.waitForSelector(".product_pod")

// provide.text — single element text
const heading = await piggy.books.provide.text({ selector: "h1" })
console.log(`provide.text h1: "${heading}"`)

// provide.textAll — all matching elements text
const prices = await piggy.books.provide.textAll({ selector: ".price_color" })
console.log(`provide.textAll prices: ${prices.slice(0, 3).join(", ")} ...`)

// provide.attr — one attribute from one element
const firstImg = await piggy.books.provide.attr({ selector: "img.thumbnail", attr: "src" })
console.log(`provide.attr img src: ${firstImg}`)

// provide.attrAll — one attribute from all matching elements
const allImgs = await piggy.books.provide.attrAll({ selector: "img.thumbnail", attr: "src" })
console.log(`provide.attrAll: ${allImgs.length} image srcs`)

// provide.html — innerHTML of an element
const cardHtml = await piggy.books.provide.html({ selector: ".product_pod" })
console.log(`provide.html (first 100): ${cardHtml?.slice(0, 100)}`)

// provide.links — all links, optionally scoped
const navLinks = await piggy.books.provide.links({ selector: ".nav-list" })
console.log(`provide.links in nav: ${navLinks.length} links`)
console.log("  First:", navLinks[0])

// provide.images — all images
const images = await piggy.books.provide.images()
console.log(`provide.images: ${images.length} total images`)
console.log("  First:", images[0])

// provide.page — full page snapshot
const page = await piggy.books.provide.page()
console.log(`provide.page: title="${page.title}", url=${page.url}`)
console.log(`  text length: ${page.text.length}, html length: ${page.html.length}`)

// provide.div — structured div with children
const grid = await piggy.books.provide.div({ selector: ".row" })
console.log(`provide.div .row: ${grid?.children?.length} children`)

// provide.meta — all meta tags
const meta = await piggy.books.provide.meta()
console.log(`provide.meta keys: ${Object.keys(meta).join(", ")}`)

// ── quotes.toscrape.com (has a table, select, form) ──────────────────────────
await piggy.quotes.navigate()
await piggy.quotes.waitForSelector(".quote")

// provide.list — list items
const tags = await piggy.quotes.provide.list({
  selector: ".tags",
  itemSel:  "a.tag",
})
console.log(`provide.list tags: ${tags.slice(0, 5).join(", ")}`)

// navigate to login for form demo
await piggy.quotes.navigate("https://quotes.toscrape.com/login")
await piggy.quotes.waitForSelector("#username")

// provide.form — extract all form field values
const formData = await piggy.quotes.provide.form({ selector: "form" })
console.log("provide.form:", formData)

// navigate to a page with a table (books detail page has one)
await piggy.books.navigate("https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html")
await piggy.books.waitForSelector("table")

// provide.table — structured table extraction
const table = await piggy.books.provide.table({ selector: "table" })
console.log("provide.table headers:", table?.headers)
console.log("provide.table rows:",    table?.rows)

// provide.select — get select element options
// (books has a "per page" select if you look hard enough — use quotes tag filter)
await piggy.quotes.navigate("https://quotes.toscrape.com")
await piggy.quotes.waitForSelector(".quote")

// provide.json — extract Next.js / embedded JSON (books is static so returns null)
const json = await piggy.books.provide.json()
console.log("provide.json (static site):", json)

await piggy.close()
