/**
 * 08 — Session Persistence
 * APIs: session.export, session.import, session.reload, session.paths,
 *       session.cookies.path, session.profile.path, session.ws.save, session.pings.save
 * Target: quotes.toscrape.com (login + stay logged in)
 */

import piggy from "nothing-browser"
import { writeFileSync, readFileSync, existsSync } from "fs"

const SESSION_FILE = "./session-demo.json"

await piggy.launch({ mode: "tab" })
await piggy.register("quotes", "https://quotes.toscrape.com")

// ── Show where all session files live ─────────────────────────────────────────
const paths = await piggy.quotes.session.paths()
console.log("Session file paths:")
console.log(`  workDir:  ${paths.workDir}`)
console.log(`  cookies:  ${paths.cookies}`)
console.log(`  profile:  ${paths.profile}`)
console.log(`  ws:       ${paths.ws}`)
console.log(`  pings:    ${paths.pings}`)

// Individual path helpers
const cookiePath  = await piggy.quotes.session.cookies.path()
const profilePath = await piggy.quotes.session.profile.path()
console.log(`\ncookie.path  = ${cookiePath}`)
console.log(`profile.path = ${profilePath}`)

// ── Enable optional capture logs ──────────────────────────────────────────────
await piggy.quotes.session.ws.save({ enabled: true })
await piggy.quotes.session.pings.save({ enabled: true })
console.log("\nWS + pings logging enabled ✓")

// ── Login to get a real session ───────────────────────────────────────────────
if (existsSync(SESSION_FILE)) {
  // Restore saved session from previous run
  const saved = JSON.parse(readFileSync(SESSION_FILE, "utf8"))
  await piggy.quotes.session.import({ data: JSON.stringify(saved) })
  console.log("\nSession restored from file ✓")
} else {
  console.log("\nNo saved session, logging in fresh...")
  await piggy.quotes.navigate("https://quotes.toscrape.com/login")
  await piggy.quotes.waitForSelector("#username")
  await piggy.quotes.type({ selector: "#username", text: "admin" })
  await piggy.quotes.type({ selector: "#password", text: "admin" })
  await piggy.quotes.click("input[type='submit']")
  await piggy.quotes.wait.navigation()
}

// ── Navigate and verify state ─────────────────────────────────────────────────
await piggy.quotes.navigate()
await piggy.quotes.waitForSelector(".quote")
const isLoggedIn = await piggy.quotes.find.exists({ selector: "a[href='/logout']" })
console.log(`Logged in: ${isLoggedIn}`)

// ── Export session to disk ────────────────────────────────────────────────────
const snapshot = await piggy.quotes.session.export()
writeFileSync(SESSION_FILE, snapshot)
console.log(`\nSession exported to ${SESSION_FILE}`)
console.log(`File size: ${Buffer.from(snapshot).length} bytes`)

// ── Hot reload (re-reads cookies.json from disk) ──────────────────────────────
await piggy.quotes.session.reload()
console.log("Session reloaded from disk ✓")

// ── Import in a fresh tab ─────────────────────────────────────────────────────
await piggy.register("quotes2", "https://quotes.toscrape.com")
await piggy.quotes2.session.import({ data: snapshot })
await piggy.quotes2.navigate()
await piggy.quotes2.waitForSelector(".quote")
const isLoggedIn2 = await piggy.quotes2.find.exists({ selector: "a[href='/logout']" })
console.log(`quotes2 logged in after import: ${isLoggedIn2}`)

console.log("\nTip: Run this script twice to see session restore working")

await piggy.close()
