/**
 * 07 — Human Mode
 * APIs: human.set, human.get, human.type, human.click, actHuman
 * Target: quotes.toscrape.com (login form)
 */

import piggy from "nothing-browser"

await piggy.launch({ mode: "tab" })
await piggy.register("quotes", "https://quotes.toscrape.com")

// ── Global human mode ─────────────────────────────────────────────────────────
piggy.actHuman(true)
console.log("Global human mode: ON")

// ── Set a custom human profile ────────────────────────────────────────────────
await piggy.quotes.human.set({
  typingSpeed: "slow",     // "slow" | "normal" | "fast"
  clickDelay:  "cautious", // "cautious" | "normal" | "fast"
  scrollSpeed: "normal",
  mouseWiggle: true,
})
console.log("Human profile set ✓")

// ── Read it back ──────────────────────────────────────────────────────────────
const profile = await piggy.quotes.human.get()
console.log("Human profile:", profile)

// ── Navigate to login ─────────────────────────────────────────────────────────
await piggy.quotes.navigate("https://quotes.toscrape.com/login")
await piggy.quotes.waitForSelector("#username")

// ── human.type — character by character with realistic delays ─────────────────
console.log("\nTyping username like a human (slow)...")
const t0 = Date.now()
await piggy.quotes.human.type({
  selector: "#username",
  text:     "admin",
})
console.log(`Typed in ${Date.now() - t0}ms`)

// Type password, clear the field first
await piggy.quotes.human.type({
  selector: "#password",
  text:     "wrongpassword",
  clear:    true,
})

// Type again with custom speed (fast this time)
await piggy.quotes.human.type({
  selector: "#password",
  text:     "admin",
  clear:    true,
  speed:    40,  // ms per character
})
console.log("Password typed ✓")

// ── human.click — click with natural mouse event chain ────────────────────────
console.log("\nHuman clicking submit...")
const t1 = Date.now()
await piggy.quotes.human.click({ selector: "input[type='submit']" })
console.log(`Clicked in ${Date.now() - t1}ms (includes cautious delay)`)

await piggy.quotes.wait.navigation()
console.log("Navigated after click ✓")

// ── Switch to fast profile for scraping ───────────────────────────────────────
await piggy.quotes.human.set({
  typingSpeed: "fast",
  clickDelay:  "fast",
  mouseWiggle: false,
})
console.log("\nSwitched to fast profile for scraping")

// Force click — scroll into view + full mouse event chain, even if element is behind something
await piggy.quotes.navigate("https://quotes.toscrape.com")
await piggy.quotes.waitForSelector(".quote")
await piggy.quotes.human.click({ selector: "li.next a", force: true })
await piggy.quotes.wait.navigation()
console.log("Force-clicked next page:", await piggy.quotes.page.url())

await piggy.close()
