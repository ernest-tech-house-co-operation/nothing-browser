/**
 * 13 — Iframes
 * APIs: iframe.list, iframe.evaluate, iframe.click, iframe.type,
 *       iframe.text, iframe.html, iframe.waitSel
 * Target: local iframe test page (we build it) + w3schools iframe example
 */

import piggy from "nothing-browser"
import { writeFileSync, mkdirSync } from "fs"

mkdirSync("./local-pages", { recursive: true })

// Build a local page with iframes we control
writeFileSync("./local-pages/iframe-test.html", `<!DOCTYPE html>
<html>
<head><title>Iframe Test</title></head>
<body>
  <h1>Iframe Test Page</h1>

  <iframe
    id="frame-a"
    name="frameA"
    src="iframe-content-a.html"
    width="400" height="200">
  </iframe>

  <iframe
    id="frame-b"
    name="frameB"
    src="iframe-content-b.html"
    width="400" height="200">
  </iframe>
</body>
</html>`)

writeFileSync("./local-pages/iframe-content-a.html", `<!DOCTYPE html>
<html>
<body>
  <h2 id="title">Frame A Content</h2>
  <input id="frame-input" placeholder="Type here" />
  <button id="frame-btn" onclick="document.getElementById('title').textContent='Clicked!'">Click me</button>
  <p class="data">Secret data from frame A</p>
</body>
</html>`)

writeFileSync("./local-pages/iframe-content-b.html", `<!DOCTYPE html>
<html>
<body>
  <h2>Frame B Content</h2>
  <ul id="list">
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
  <p class="status">Ready</p>
</body>
</html>`)

await piggy.launch({ mode: "tab" })
await piggy.register("page", `file://${process.cwd()}/local-pages/iframe-test.html`)

await piggy.page.navigate()
await piggy.page.waitForSelector("iframe")
await new Promise(r => setTimeout(r, 500)) // let iframes load

// ── iframe.list — see all iframes ────────────────────────────────────────────
const iframes = await piggy.page.iframe.list()
console.log(`Found ${iframes.length} iframes:`)
iframes.forEach((f: any) => console.log(`  [${f.index}] id="${f.id}" name="${f.name}" src="${f.src}"`))

// ── iframe.evaluate — run JS inside frame A ───────────────────────────────────
const titleText = await piggy.page.iframe.evaluate({
  frameIndex: 0,
  js: "document.getElementById('title').textContent",
})
console.log(`\niframe.evaluate frame[0] title: "${titleText}"`)

// By frame name
const bodyHtml = await piggy.page.iframe.evaluate({
  frameName: "frameB",
  js: "document.body.innerHTML.slice(0, 100)",
})
console.log(`iframe.evaluate frameB body: ${bodyHtml}`)

// ── iframe.text — get text from inside a frame ────────────────────────────────
const dataText = await piggy.page.iframe.text({
  frameIndex: 0,
  selector:   ".data",
})
console.log(`\niframe.text .data: "${dataText}"`)

// ── iframe.html — get full iframe HTML ───────────────────────────────────────
const frameHtml = await piggy.page.iframe.html({ frameIndex: 1 })
console.log(`iframe.html frame[1] (first 150 chars): ${frameHtml?.slice(0, 150)}`)

// ── iframe.click — click inside a frame ──────────────────────────────────────
await piggy.page.iframe.click({
  frameIndex: 0,
  selector:   "#frame-btn",
})
await new Promise(r => setTimeout(r, 200))

// Verify click worked — title should have changed
const afterClick = await piggy.page.iframe.text({
  frameIndex: 0,
  selector:   "#title",
})
console.log(`\nAfter iframe.click, title is: "${afterClick}"`)

// ── iframe.type — type inside an iframe input ─────────────────────────────────
await piggy.page.iframe.type({
  frameIndex: 0,
  selector:   "#frame-input",
  text:       "Hello from Piggy!",
})
await new Promise(r => setTimeout(r, 200))

const inputVal = await piggy.page.iframe.evaluate({
  frameIndex: 0,
  js: "document.getElementById('frame-input').value",
})
console.log(`\niframe.type result: "${inputVal}"`)

// ── iframe.waitSel — wait for selector inside iframe ─────────────────────────
const found = await piggy.page.iframe.waitSel({
  frameIndex: 1,
  selector:   "#list li",
  timeout:    3000,
})
console.log(`\niframe.waitSel #list li: ${found}`)

// ── By src match ──────────────────────────────────────────────────────────────
const statusText = await piggy.page.iframe.text({
  frameSrc: "iframe-content-b.html",
  selector: ".status",
})
console.log(`iframe.text by src match: "${statusText}"`)

await piggy.close()
