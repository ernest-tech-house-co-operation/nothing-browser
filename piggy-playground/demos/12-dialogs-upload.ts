/**
 * 12 — Dialogs + File Upload
 * APIs: dialog.accept, dialog.dismiss, dialog.status, dialog.onDialog, upload
 * Target: local-pages/dialog-test.html + local-pages/upload-test.html
 */

import piggy from "nothing-browser"
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

// Create test files if they don't exist
mkdirSync("./local-pages", { recursive: true })

writeFileSync("./local-pages/dialog-test.html", `<!DOCTYPE html>
<html>
<head><title>Dialog Test</title></head>
<body>
  <h1>Dialog Test Page</h1>
  <button id="alert-btn"   onclick="alert('Hello from alert!')">Trigger Alert</button>
  <button id="confirm-btn" onclick="window._confirmed = confirm('Are you sure?')">Trigger Confirm</button>
  <button id="prompt-btn"  onclick="window._prompted = prompt('Enter your name:', 'stranger')">Trigger Prompt</button>
  <p id="result"></p>
</body>
</html>`)

writeFileSync("./local-pages/upload-test.html", `<!DOCTYPE html>
<html>
<head><title>Upload Test</title></head>
<body>
  <h1>File Upload Test</h1>
  <input type="file" id="file-input" />
  <p id="file-name">No file selected</p>
  <script>
    document.getElementById('file-input').addEventListener('change', function() {
      document.getElementById('file-name').textContent = this.files[0]?.name ?? 'none';
    });
  </script>
</body>
</html>`)

// Create a dummy file to upload
writeFileSync("./local-pages/test-upload.txt", "Hello from Piggy upload demo!\nThis file was set programmatically.")

await piggy.launch({ mode: "tab" })
await piggy.register("dialogs", `file://${process.cwd()}/local-pages/dialog-test.html`)
await piggy.register("uploader", `file://${process.cwd()}/local-pages/upload-test.html`)

// ── Navigate to dialog test page ──────────────────────────────────────────────
await piggy.dialogs.navigate()
await piggy.dialogs.waitForSelector("#alert-btn")

// ── Pre-configure dialog auto-accept ─────────────────────────────────────────
await piggy.dialogs.dialog.onDialog({ action: "accept" })
console.log("Dialog auto-action: accept ✓")

// Trigger alert — auto-accepted
await piggy.dialogs.click("#alert-btn")
await new Promise(r => setTimeout(r, 500))
const alertStatus = await piggy.dialogs.dialog.status()
console.log(`Alert status after auto-accept: pending=${alertStatus.pending}`)

// ── Listen for dialog events (manual mode) ────────────────────────────────────
await piggy.dialogs.dialog.onDialog({ action: "" }) // emit event, don't auto-respond

piggy.on("dialog", async (e: any) => {
  console.log(`\n[event] dialog: type=${e.dialogType} message="${e.message}"`)

  if (e.dialogType === "confirm") {
    // Accept confirms
    await piggy.dialogs.dialog.accept()
    console.log("  → accepted confirm")
  } else if (e.dialogType === "prompt") {
    // Accept prompt with a custom value
    await piggy.dialogs.dialog.accept({ text: "Pease Ernest" })
    console.log("  → accepted prompt with 'Pease Ernest'")
  }
})

// Trigger confirm
await piggy.dialogs.click("#confirm-btn")
await new Promise(r => setTimeout(r, 600))

// Check status
const confirmStatus = await piggy.dialogs.dialog.status()
console.log(`Confirm status: pending=${confirmStatus.pending}, type=${confirmStatus.type}`)

// Trigger prompt
await piggy.dialogs.click("#prompt-btn")
await new Promise(r => setTimeout(r, 600))

// Dismiss a dialog
await piggy.dialogs.dialog.onDialog({ action: "" })
await piggy.dialogs.click("#confirm-btn")
await new Promise(r => setTimeout(r, 200))
await piggy.dialogs.dialog.dismiss()
console.log("Dismissed confirm ✓")

// ── File upload ───────────────────────────────────────────────────────────────
await piggy.uploader.navigate()
await piggy.uploader.waitForSelector("#file-input")

await piggy.uploader.upload({
  selector: "#file-input",
  path:     `${process.cwd()}/local-pages/test-upload.txt`,
})
console.log("\nFile uploaded ✓")

// Verify the filename appeared in the page
await new Promise(r => setTimeout(r, 300))
const fileName = await piggy.uploader.provide.text({ selector: "#file-name" })
console.log(`File name shown on page: "${fileName}"`)

// Upload an image (if you have one — gracefully skips)
try {
  await piggy.uploader.upload({
    selector: "#file-input",
    path:     `${process.cwd()}/screenshot-demo.png`, // from demo 11
  })
  const imgName = await piggy.uploader.provide.text({ selector: "#file-name" })
  console.log(`Image uploaded: "${imgName}"`)
} catch {
  console.log("(screenshot-demo.png not found — run demo 11 first)")
}

await piggy.close()
