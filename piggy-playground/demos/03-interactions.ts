/**
 * 03 — Interactions
 * APIs: click, dblclick, hover, type, select, scroll.to, scroll.by,
 *       keyboard.press, keyboard.combo, mouse.move, mouse.drag, evaluate
 * Target: quotes.toscrape.com (has search + login form)
 */

import piggy from "nothing-browser"

await piggy.launch({ mode: "tab" })
await piggy.register("quotes", "https://quotes.toscrape.com")

await piggy.quotes.navigate()
await piggy.quotes.waitForSelector(".quote")

// scroll.by — scroll down the page
await piggy.quotes.scroll.by({ px: 400 })
console.log("Scrolled down 400px ✓")

// scroll.to — scroll a specific element into view
await piggy.quotes.scroll.to("footer")
console.log("Scrolled to footer ✓")

// scroll back up
await piggy.quotes.scroll.by({ px: -9999 })

// hover — hover over the first quote author
await piggy.quotes.hover(".author")
console.log("Hovered author ✓")

// click — click the login link
await piggy.quotes.click("a[href='/login']")
await piggy.quotes.waitForSelector("#username")
console.log("Navigated to login ✓")

// type — fill in the username field
await piggy.quotes.type({ selector: "#username", text: "testuser" })
await piggy.quotes.type({ selector: "#password", text: "testpass" })
console.log("Typed credentials ✓")

// keyboard.press — press Tab to move focus
await piggy.quotes.keyboard.press({ key: "Tab" })
console.log("Pressed Tab ✓")

// keyboard.combo — select all text in username field
await piggy.quotes.click("#username")
await piggy.quotes.keyboard.combo({ combo: "Control+A" })
console.log("Ctrl+A combo ✓")

// type with clear — overwrite the field
await piggy.quotes.type({ selector: "#username", text: "admin", clear: true })
const val = await piggy.quotes.evaluate(() =>
  (document.querySelector("#username") as HTMLInputElement).value
)
console.log("Field value after clear+type:", val)

// mouse.move — move to coordinates
await piggy.quotes.mouse.move({ x: 300, y: 300 })
console.log("Mouse moved ✓")

// Go back and test dblclick on a quote
await piggy.quotes.go.back()
await piggy.quotes.waitForSelector(".quote")
await piggy.quotes.dblclick(".quote")
console.log("Double-clicked quote ✓")

await piggy.close()
