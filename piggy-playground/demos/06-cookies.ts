/**
 * 06 — Cookie Management
 * APIs: cookie.set, cookie.get, cookie.list, cookie.delete
 * Target: quotes.toscrape.com (login sets real cookies)
 */

import piggy from "nothing-browser"

await piggy.launch({ mode: "tab" })
await piggy.register("quotes", "https://quotes.toscrape.com")

await piggy.quotes.navigate()
await piggy.quotes.waitForSelector(".quote")

// ── Manually set a cookie ─────────────────────────────────────────────────────
await piggy.quotes.cookie.set({
  name:     "demo_token",
  value:    "piggy-test-abc123",
  domain:   "quotes.toscrape.com",
  path:     "/",
  httpOnly: false,
  secure:   false,
})
console.log("cookie.set ✓")

// Set a second cookie
await piggy.quotes.cookie.set({
  name:   "user_pref",
  value:  "dark_mode",
  domain: "quotes.toscrape.com",
})
console.log("cookie.set (pref) ✓")

// ── Get a specific cookie ─────────────────────────────────────────────────────
const token = await piggy.quotes.cookie.get({ name: "demo_token" })
console.log("\ncookie.get demo_token:")
console.log(`  name:  ${token.name}`)
console.log(`  value: ${token.value}`)

// Get with domain filter
const pref = await piggy.quotes.cookie.get({
  name:   "user_pref",
  domain: "quotes.toscrape.com",
})
console.log(`\ncookie.get user_pref: ${pref.value}`)

// ── List all cookies ──────────────────────────────────────────────────────────
const all = await piggy.quotes.cookie.list()
console.log(`\ncookie.list: ${all.length} cookies total`)
all.forEach(c => console.log(`  ${c.name} = ${c.value} (${c.domain})`))

// List filtered by domain
const siteCookies = await piggy.quotes.cookie.list({ domain: "quotes.toscrape.com" })
console.log(`\ncookie.list (domain filter): ${siteCookies.length} cookies`)

// ── Login to get real session cookies ─────────────────────────────────────────
await piggy.quotes.navigate("https://quotes.toscrape.com/login")
await piggy.quotes.waitForSelector("#username")
await piggy.quotes.type({ selector: "#username", text: "admin" })
await piggy.quotes.type({ selector: "#password", text: "admin" })
await piggy.quotes.click("input[type='submit']")
await piggy.quotes.wait.navigation()
console.log("\nLogged in (attempted), checking cookies...")

const afterLogin = await piggy.quotes.cookie.list()
console.log(`Cookies after login attempt: ${afterLogin.length}`)
afterLogin.forEach(c => console.log(`  ${c.name} = ${c.value.slice(0, 30)}...`))

// ── Delete a cookie ───────────────────────────────────────────────────────────
await piggy.quotes.cookie.delete({ name: "demo_token", domain: "quotes.toscrape.com" })
console.log("\ncookie.delete demo_token ✓")

const afterDelete = await piggy.quotes.cookie.list({ domain: "quotes.toscrape.com" })
const stillThere = afterDelete.find(c => c.name === "demo_token")
console.log(`demo_token still exists: ${!!stillThere}`)

await piggy.close()
