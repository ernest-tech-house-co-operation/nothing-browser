/**
 * 02 — Navigation
 * APIs: navigate, reload, go.back, go.forward, wait.navigation, wait.selector,
 *       wait.function, wait.response, page.url, page.title, page.content
 * Target: books.toscrape.com
 */

import piggy from "nothing-browser"

await piggy.launch({ mode: "tab" })
await piggy.register("books", "https://books.toscrape.com")

// Basic navigate
await piggy.books.navigate()
console.log("Page 1:", await piggy.books.page.url())

// Navigate to a different URL
await piggy.books.navigate("https://books.toscrape.com/catalogue/page-2.html")
await piggy.books.waitForSelector(".product_pod")
console.log("Page 2:", await piggy.books.page.url())

// Go back
await piggy.books.go.back()
await piggy.books.wait.navigation()
console.log("Back to:", await piggy.books.page.url())

// Go forward
await piggy.books.go.forward()
await piggy.books.wait.navigation()
console.log("Forward to:", await piggy.books.page.url())

// Reload
await piggy.books.reload()
console.log("Reloaded:", await piggy.books.page.title())

// wait.selector with state — wait for element to become visible
await piggy.books.wait.selector({
  selector: ".product_pod",
  state:    "visible",
  timeout:  8000,
})
console.log("Products visible ✓")

// wait.function — custom JS condition
await piggy.books.wait.function({
  js:      "document.querySelectorAll('.product_pod').length >= 20",
  timeout: 5000,
})
console.log("All 20 products loaded ✓")

// wait.response — resolves after current response cycle
await piggy.books.wait.response()
console.log("Response cycle done ✓")

// Get full page HTML (first 200 chars)
const html = await piggy.books.page.content()
console.log("\nHTML preview:", html.slice(0, 200))

await piggy.close()
