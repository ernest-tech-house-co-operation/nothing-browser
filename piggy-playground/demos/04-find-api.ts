/**
 * 04 — Find API
 * APIs: find.css, find.first, find.all, find.byText, find.byAttr, find.byTag,
 *       find.byPlaceholder, find.byRole, find.closest, find.parent, find.children,
 *       find.filter, find.count, find.exists, find.visible, find.enabled, find.checked
 * Target: books.toscrape.com + quotes.toscrape.com
 */

import piggy from "nothing-browser"

await piggy.launch({ mode: "tab" })
await piggy.register("books",  "https://books.toscrape.com")
await piggy.register("quotes", "https://quotes.toscrape.com")

// ── books.toscrape.com ────────────────────────────────────────────────────────
await piggy.books.navigate()
await piggy.books.waitForSelector(".product_pod")

// find.css — all elements matching selector
const cards = await piggy.books.find.css({ selector: ".product_pod" })
console.log(`find.css: ${cards.length} product cards`)

// find.first — first match only
const hero = await piggy.books.find.first({ selector: "h1" })
console.log(`find.first h1: "${hero?.[0]?.text}"`)

// find.all — alias for find.css
const prices = await piggy.books.find.all({ selector: ".price_color" })
console.log(`find.all prices: ${prices.length}`)

// find.byText — find element containing text
const inStock = await piggy.books.find.byText({ text: "In stock" })
console.log(`find.byText "In stock": ${inStock.length} elements`)

// find.byText exact match
const exact = await piggy.books.find.byText({ text: "In stock", exact: true })
console.log(`find.byText exact: ${exact.length} elements`)

// find.byAttr — find by attribute
const thumbs = await piggy.books.find.byAttr({ attr: "class", value: "thumbnail" })
console.log(`find.byAttr thumbnail: ${thumbs.length} images`)

// find.byTag
const articles = await piggy.books.find.byTag({ tag: "article" })
console.log(`find.byTag article: ${articles.length}`)

// find.closest — get the article ancestor of a price element
const ancestor = await piggy.books.find.closest({
  selector: ".price_color",
  ancestor: "article",
})
console.log(`find.closest article: tag=${ancestor?.[0]?.tag}`)

// find.parent
const parent = await piggy.books.find.parent({ selector: ".price_color" })
console.log(`find.parent of .price_color: ${parent?.[0]?.cls}`)

// find.children — children of first product card
const children = await piggy.books.find.children({ selector: ".product_pod" })
console.log(`find.children of .product_pod: ${children.length} children`)

// find.filter — filter .product_pod by data attribute
const filtered = await piggy.books.find.filter({
  selector: "article",
  attr:     "class",
  value:    "product_pod",
})
console.log(`find.filter articles with product_pod: ${filtered.length}`)

// find.count
const n = await piggy.books.find.count({ selector: ".product_pod" })
console.log(`find.count .product_pod: ${n}`)

// find.exists
const exists = await piggy.books.find.exists({ selector: ".product_pod" })
console.log(`find.exists .product_pod: ${exists}`)

const noExist = await piggy.books.find.exists({ selector: "#does-not-exist" })
console.log(`find.exists #does-not-exist: ${noExist}`)

// find.visible
const visible = await piggy.books.find.visible({ selector: "h1" })
console.log(`find.visible h1: ${visible}`)

// ── quotes.toscrape.com (login form for enabled/checked) ─────────────────────
await piggy.quotes.navigate("https://quotes.toscrape.com/login")
await piggy.quotes.waitForSelector("#username")

// find.byPlaceholder
const usernameField = await piggy.quotes.find.byPlaceholder({ text: "Username" })
console.log(`find.byPlaceholder "Username": ${usernameField.length} field(s)`)

// find.byRole
const buttons = await piggy.quotes.find.byRole({ role: "button" })
console.log(`find.byRole button: ${buttons.length}`)

// find.enabled
const enabled = await piggy.quotes.find.enabled({ selector: "#username" })
console.log(`find.enabled #username: ${enabled}`)

// find.checked — checkbox (quotes login has "remember me" on some versions)
const checked = await piggy.quotes.find.checked({ selector: "#username" })
console.log(`find.checked #username (input, not checkbox): ${checked}`)

await piggy.close()
