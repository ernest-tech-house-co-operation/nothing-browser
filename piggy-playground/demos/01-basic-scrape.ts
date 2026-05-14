/**
 * 01 — Basic Scrape
 * APIs: launch, register, navigate, waitForSelector, evaluate, page.title, page.url, close
 * Target: books.toscrape.com
 */

import piggy from "nothing-browser"

await piggy.launch({ mode: "tab" })
await piggy.register("books", "https://books.toscrape.com")

// Navigate to the registered URL
await piggy.books.navigate()

// Wait for products to load
await piggy.books.waitForSelector(".product_pod")

// Current page info
const url   = await piggy.books.page.url()
const title = await piggy.books.page.title()
console.log(`URL:   ${url}`)
console.log(`Title: ${title}`)

// Extract all books on the page
const books = await piggy.books.evaluate(() =>
  Array.from(document.querySelectorAll(".product_pod")).map(el => ({
    title: el.querySelector("h3 a")?.getAttribute("title") ?? "",
    price: el.querySelector(".price_color")?.textContent?.trim() ?? "",
    rating: el.querySelector(".star-rating")?.className.replace("star-rating ", "") ?? "",
    inStock: el.querySelector(".availability")?.textContent?.trim() === "In stock",
  }))
)

console.log(`\nFound ${books.length} books`)
console.table(books.slice(0, 5))

await piggy.close()
