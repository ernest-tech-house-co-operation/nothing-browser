/**
 * 14 — exposeFunction + addInitScript
 * APIs: exposeFunction, exposed.result, addInitScript
 * Target: local-pages/rpc-test.html
 */

import piggy from "nothing-browser"
import { writeFileSync, mkdirSync } from "fs"

mkdirSync("./local-pages", { recursive: true })

writeFileSync("./local-pages/rpc-test.html", `<!DOCTYPE html>
<html>
<head><title>RPC Test</title></head>
<body>
  <h1>exposeFunction Test</h1>
  <button id="save-btn">Save Data</button>
  <button id="compute-btn">Compute</button>
  <p id="result">Waiting...</p>
  <script>
    document.getElementById('save-btn').addEventListener('click', async () => {
      const result = await window.saveProduct({
        title: 'Piggy Demo Book',
        price: '$9.99',
        timestamp: Date.now()
      });
      document.getElementById('result').textContent = 'Saved: ' + JSON.stringify(result);
    });

    document.getElementById('compute-btn').addEventListener('click', async () => {
      const result = await window.computeHash('hello piggy');
      document.getElementById('result').textContent = 'Hash: ' + result;
    });
  </script>
</body>
</html>`)

await piggy.launch({ mode: "tab" })
await piggy.register("app", `file://${process.cwd()}/local-pages/rpc-test.html`)

// ── addInitScript — inject JS that runs before any page script ────────────────
await piggy.app.addInitScript({
  js: `
    window.__PIGGY_DEMO__ = true;
    window.__INJECTED_AT__ = Date.now();
    console.log('[initScript] Piggy init script ran before page scripts');
  `
})
console.log("Init script registered ✓")

// Another init script — mock a global before the page uses it
await piggy.app.addInitScript({
  js: `
    // Override Date.now to always return a fixed timestamp for reproducible tests
    const _origNow = Date.now;
    window.__realNow = _origNow;
    // Don't actually override in demo — just show we can
  `
})
console.log("Second init script registered ✓")

// ── exposeFunction — Node.js function callable from browser ───────────────────
const savedItems: any[] = []

await piggy.app.exposeFunction("saveProduct", async (data: any) => {
  console.log("\n[Node] saveProduct called with:", data)
  savedItems.push({ ...data, id: crypto.randomUUID() })
  return { success: true, id: savedItems[savedItems.length - 1].id, total: savedItems.length }
})
console.log("\nExposed: saveProduct ✓")

await piggy.app.exposeFunction("computeHash", async (input: string) => {
  console.log(`[Node] computeHash called with: "${input}"`)
  // Simple demo hash (not crypto)
  let hash = 0
  for (const ch of input) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  return `hash-${Math.abs(hash).toString(16)}`
})
console.log("Exposed: computeHash ✓")

// ── Navigate + trigger the exposed functions ──────────────────────────────────
await piggy.app.navigate()
await piggy.app.waitForSelector("#save-btn")

// Verify init script ran
const flag = await piggy.app.evaluate(() => window.__PIGGY_DEMO__)
console.log(`\n__PIGGY_DEMO__ flag from initScript: ${flag}`)

// Click save — triggers saveProduct RPC call
await piggy.app.click("#save-btn")
await new Promise(r => setTimeout(r, 500))

const result = await piggy.app.provide.text({ selector: "#result" })
console.log(`Page result text: "${result}"`)
console.log(`Saved items in Node: ${savedItems.length}`)

// Click compute — triggers computeHash RPC call
await piggy.app.click("#compute-btn")
await new Promise(r => setTimeout(r, 500))

const hashResult = await piggy.app.provide.text({ selector: "#result" })
console.log(`Hash result on page: "${hashResult}"`)

// ── Call exposeFunction from evaluate directly ────────────────────────────────
const directResult = await piggy.app.evaluate(async () => {
  const r = await window.saveProduct({ title: "Direct call", price: "$0" })
  return r
})
console.log(`\nDirect evaluate → saveProduct result:`, directResult)
console.log(`Total saved items: ${savedItems.length}`)
console.log("All saved:", savedItems)

// ── exposeFunction event (low-level access) ───────────────────────────────────
piggy.on("exposed_call", (e: any) => {
  console.log(`\n[event] exposed_call: name=${e.name} callId=${e.callId}`)
  // Could manually respond with: piggy.app.exposed.result({ callId: e.callId, result: "..." })
})

await piggy.close()
