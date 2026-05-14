/**
 * 15 — Captcha + Block Detection
 * APIs: captcha.status, captcha.resolve, captcha.pause, captcha.check,
 *       captcha.autoRetry, block.status, block.retry
 * Target: local mock captcha pages + real rate-limit scenario
 */

import piggy from "nothing-browser"
import { writeFileSync, mkdirSync } from "fs"

mkdirSync("./local-pages", { recursive: true })

// Mock Cloudflare challenge page
writeFileSync("./local-pages/captcha-mock.html", `<!DOCTYPE html>
<html>
<head><title>Just a moment...</title></head>
<body>
  <div id="challenge-form">
    <h1>Checking if the site connection is secure</h1>
    <p>Cloudflare is checking your connection...</p>
    <p>just a moment while we verify you are human</p>
    <p class="cloudflare">Powered by Cloudflare</p>
  </div>
</body>
</html>`)

// Mock reCAPTCHA page
writeFileSync("./local-pages/recaptcha-mock.html", `<!DOCTYPE html>
<html>
<head><title>Verify you are human</title></head>
<body>
  <h1>Security Check</h1>
  <div class="g-recaptcha" data-sitekey="demo-key"></div>
  <p>Please complete the captcha to continue</p>
</body>
</html>`)

// Mock 403 blocked page
writeFileSync("./local-pages/blocked-mock.html", `<!DOCTYPE html>
<html>
<head><title>Access Denied</title></head>
<body>
  <h1>403 Forbidden</h1>
  <p>Access denied. You have been blocked.</p>
  <p>Your IP has been banned from this service.</p>
</body>
</html>`)

// Mock rate limit page
writeFileSync("./local-pages/ratelimit-mock.html", `<!DOCTYPE html>
<html>
<head><title>Rate Limited</title></head>
<body>
  <h1>Too Many Requests</h1>
  <p>You have sent too many requests. Rate limit exceeded.</p>
</body>
</html>`)

await piggy.launch({ mode: "tab" })
await piggy.register("test", `file://${process.cwd()}/local-pages/captcha-mock.html`)

// ── Listen for captcha events ─────────────────────────────────────────────────
piggy.on("captcha", (e: any) => {
  console.log(`\n[event] 🤖 CAPTCHA DETECTED on tab ${e.tabId}`)
  console.log(`  Type: ${e.captchaType}`)
})

piggy.on("captcha:resolved", (e: any) => {
  console.log(`[event] ✅ Captcha resolved on tab ${e.tabId}`)
})

piggy.on("blocked", (e: any) => {
  console.log(`\n[event] 🚫 BLOCKED on tab ${e.tabId}`)
  console.log(`  Type: ${e.blockType}`)
})

piggy.on("block:retry", (e: any) => {
  console.log(`[event] 🔄 Block retry, proxy: ${e.proxy}`)
})

// ── Test Cloudflare detection ─────────────────────────────────────────────────
await piggy.test.navigate()
await new Promise(r => setTimeout(r, 500))

// captcha.check — force an immediate detection scan
await piggy.test.captcha.check()
await new Promise(r => setTimeout(r, 300))

// captcha.status — check what was detected
const captchaStatus = await piggy.test.captcha.status()
console.log(`\ncaptcha.status:`)
console.log(`  detected: ${captchaStatus.detected}`)
console.log(`  paused:   ${captchaStatus.paused}`)
console.log(`  type:     ${captchaStatus.type}`)

// captcha.pause — manually pause the tab
await piggy.test.captcha.pause()
console.log("\ncaptcha.pause ✓ (tab paused)")

// Simulate user solving captcha then call resolve
console.log("Simulating user solving captcha...")
await new Promise(r => setTimeout(r, 1000))

await piggy.test.captcha.resolve()
console.log("captcha.resolve ✓ (tab unpaused)")

const afterResolve = await piggy.test.captcha.status()
console.log(`After resolve — detected: ${afterResolve.detected}`)

// ── Test reCAPTCHA detection ──────────────────────────────────────────────────
await piggy.register("recaptcha", `file://${process.cwd()}/local-pages/recaptcha-mock.html`)
await piggy.recaptcha.navigate()
await new Promise(r => setTimeout(r, 400))
await piggy.recaptcha.captcha.check()
await new Promise(r => setTimeout(r, 300))

const rcStatus = await piggy.recaptcha.captcha.status()
console.log(`\nreCAPTCHA detected: ${rcStatus.detected}, type: ${rcStatus.type}`)

// ── Test block detection ──────────────────────────────────────────────────────
await piggy.register("blocked", `file://${process.cwd()}/local-pages/blocked-mock.html`)
await piggy.blocked.navigate()
await new Promise(r => setTimeout(r, 400))

const blockStatus = await piggy.blocked.block.status()
console.log(`\nblock.status:`)
console.log(`  detected: ${blockStatus.detected}`)
console.log(`  type:     ${blockStatus.type}`)

// ── autoRetry — auto rotate proxy + reload when blocked ──────────────────────
await piggy.test.captcha.autoRetry({ enabled: true })
console.log("\ncaptcha.autoRetry enabled ✓")

await piggy.test.captcha.autoRetry({ enabled: false })
console.log("captcha.autoRetry disabled ✓")

// ── block.retry — manually rotate proxy + reload ─────────────────────────────
// (requires proxies to be loaded — shows the command even if no proxies)
try {
  await piggy.blocked.block.retry()
  console.log("\nblock.retry ✓")
} catch (e: any) {
  console.log(`\nblock.retry (no proxies loaded): ${e.message}`)
}

await piggy.close()
