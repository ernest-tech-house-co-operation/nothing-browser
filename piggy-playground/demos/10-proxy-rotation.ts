/**
 * 10 — Proxy Rotation
 * APIs: proxy.fetch, proxy.load, proxy.set, proxy.test, proxy.test.stop,
 *       proxy.next, proxy.rotate, proxy.disable, proxy.enable, proxy.current,
 *       proxy.stats, proxy.list, proxy.rotation, proxy.config, proxy.save
 * Proxy source: github.com/TheSpeedX/PROXY-List (free, updated daily)
 */

import piggy from "nothing-browser"
import { writeFileSync } from "fs"

await piggy.launch({ mode: "tab" })
await piggy.register("check", "https://httpbin.org/ip")

// ── proxy.fetch — pull free SOCKS5 list from TheSpeedX ───────────────────────
console.log("Fetching free SOCKS5 proxies from TheSpeedX/PROXY-List...")
await piggy.proxy.fetch({
  url: "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt"
})

// proxy.fetch is async — wait for proxy:loaded event then continue
// For the demo we just wait a moment
await new Promise(r => setTimeout(r, 2000))

// ── proxy.stats — see what we loaded ─────────────────────────────────────────
const stats = await piggy.proxy.stats()
console.log(`\nProxy pool stats:`)
console.log(`  Total:    ${stats.total}`)
console.log(`  Alive:    ${stats.alive}`)
console.log(`  Dead:     ${stats.dead}`)
console.log(`  Active:   ${stats.active}`)
console.log(`  Checking: ${stats.checking}`)

// ── proxy.list — inspect first 5 ─────────────────────────────────────────────
const list = await piggy.proxy.list({ limit: 5 })
console.log(`\nFirst 5 proxies (of ${list.total}):`)
list.proxies.forEach((p: any) =>
  console.log(`  [${p.index}] ${p.proxy} health=${p.health}`)
)

// ── proxy.config — skip dead proxies, auto-check on rotation ─────────────────
await piggy.proxy.config({ skipDead: true, autoCheck: false })
console.log("\nConfig: skipDead=true ✓")

// ── proxy.test — health check all (this takes a while with big lists) ─────────
// For the demo we test just a moment then stop
console.log("\nStarting health check (stopping after 5s for demo)...")
await piggy.proxy.test()
await new Promise(r => setTimeout(r, 5000))
await piggy.proxy.test.stop()
console.log("Health check stopped")

const statsAfter = await piggy.proxy.stats()
console.log(`After partial check: ${statsAfter.alive} alive, ${statsAfter.dead} dead`)

// ── proxy.next — rotate to next proxy ────────────────────────────────────────
const next = await piggy.proxy.next()
console.log(`\nRotated to: ${next}`)

const current = await piggy.proxy.current()
console.log(`Current proxy: ${current.proxy} (${current.health})`)

// ── proxy.rotation — auto rotate every 30 seconds ────────────────────────────
await piggy.proxy.rotation({ mode: "timed", interval: 30 })
console.log("Rotation mode: timed every 30s ✓")

// Per-request rotation
await piggy.proxy.rotation({ mode: "perrequest" })
console.log("Rotation mode: per-request ✓")

// Disable rotation
await piggy.proxy.rotation({ mode: "none" })

// ── proxy.set — set a specific proxy inline ───────────────────────────────────
await piggy.proxy.set({ proxy: "socks5://1.2.3.4:1080" })
console.log("\nSet manual proxy ✓")

// ── proxy.disable — go back to real IP ───────────────────────────────────────
await piggy.proxy.disable()
console.log("Proxy disabled — using real IP ✓")

// Check our real IP
await piggy.check.navigate()
await piggy.check.waitForSelector("pre")
const realIp = await piggy.check.provide.text({ selector: "pre" })
console.log(`Real IP response: ${realIp}`)

// ── proxy.enable — re-enable the last proxy ───────────────────────────────────
await piggy.proxy.enable()
console.log("Proxy re-enabled ✓")

// ── proxy.save — save alive proxies to disk ───────────────────────────────────
await piggy.proxy.save({ path: "./proxies-alive.txt", filter: "alive" })
console.log("Alive proxies saved to proxies-alive.txt")

// ── proxy.load — load from file ───────────────────────────────────────────────
await piggy.proxy.load({ path: "./proxies-alive.txt" })
console.log("Proxies loaded from file ✓")

// ── Listen for proxy events ───────────────────────────────────────────────────
piggy.on("proxy:changed",      (e: any) => console.log("[event] proxy:changed →", e.proxy))
piggy.on("proxy:exhausted",    ()       => console.warn("[event] proxy:exhausted — all proxies dead!"))
piggy.on("proxy:check:done",   (e: any) => console.log(`[event] check done: ${e.alive} alive`))

await piggy.close()
