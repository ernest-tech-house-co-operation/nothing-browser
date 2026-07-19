# Piggy / Nothing Browser — v0.1.20 Roadmap

> Draft notes for the next release. Scope, naming, and behavior below are
> proposals — subject to change as implementation reveals edge cases.

Related: [blog post — some great news](https://nothing-browser-docs.pages.dev/blog/piggy/somegreatnews)

---

## 🎯 Goals for this release

Close the gap between what `site.js` already exposes on the JS side and
what the current binary actually implements, focused on the families we've
prioritized as high-value. Also introduces a new debugging surface for
inspecting exactly what JS crosses the Node ↔ Qt boundary.

---

## ✅ Command families being implemented

Priority order (smallest/most self-contained first):

### 1. `close` / `noclose`
- Fixes the current `unknown command: close` error on every `piggy.close()` call.
- `noclose()` — mark a tab/session as exempt from auto-close on process exit.
- `close()` — graceful shutdown: flush session state, close sockets, then exit.

### 2. `upload`
- `dialog.upload(selector, filePath)` — attach a file to a file-input element without needing a real OS file picker (headless-safe).

### 3. `dialog.*`
- `dialog.accept(text)`, `dialog.dismiss()`, `dialog.status()`
- `dialog.setAutoAction(action)` — auto-accept/dismiss native alert/confirm/prompt dialogs.
- `dialog.waitAndAccept(timeout)`, `dialog.waitAndDismiss(timeout)`
- Builds on the existing `piggy_dialogHandlerInit` plumbing already present in `PiggyServer` — mostly command wiring, not new infra.

### 4. `find.*`
A full DOM-query layer beyond the current `search.css` / `fetch.*`:
`find.css`, `find.all`, `find.first`, `find.byText`, `find.byAttr`,
`find.byTag`, `find.byPlaceholder`, `find.byRole`, `find.closest`,
`find.parent`, `find.children`, `find.filter`, `find.count`,
`find.exists`, `find.visible`, `find.enabled`, `find.checked`.

### 5. `provide.*`
Structured extraction layer, shares JS helper patterns with `find.*`:
`provide.text`, `provide.textAll`, `provide.attr`, `provide.attrAll`,
`provide.html`, `provide.table`, `provide.list`, `provide.links`,
`provide.images`, `provide.form`, `provide.page`, `provide.div`,
`provide.meta`, `provide.select`, `provide.json`.

### 6. `iframe.*`
Targeting content inside child frames rather than just the main page:
`iframe.list`, `iframe.evaluate`, `iframe.click`, `iframe.type`,
`iframe.text`, `iframe.html`, `iframe.waitSel`.
Hardest of the six — needs real `QWebEngineFrame`/child-frame targeting,
not just a JS wrapper.

---

## 🚫 Explicitly out of scope for v0.1.20

- `captcha.*` / `block.*` — not being pursued right now.
- `session.paths` / `session.cookiesPath` / `session.profilePath` / `session.wsPath` / `session.pingsPath` / `session.ws.save` / `session.pings.save` — export/import/reload already work; the path-introspection helpers are not planned.
- `human.*` — `piggy.actHuman(true)` already covers this well enough as-is.
- `media.*`, `storage.dump` / `storage.clear`, `cookieinject.*`, `tab.poolStats` — no current plans.

---

## 🧪 New: `runjs.indevtools()`

```js
await piggy.itax.runjs.indevtools();
```

Runs the given JS the same way DevTools' console would — i.e. evaluated
directly against the live page context, with full access to whatever the
page's own console/runtime sees (helpful for debugging cases where
`evaluate()`'s sandboxing behaves differently than a real DevTools session
would).

---

## 🔍 New: Qt pipeline debugging APIs

Three-stage visibility into what actually happens to your JS after you
call `evaluate()` (or any command that runs JS under the hood) — useful
for exactly the kind of "why did this silently fail" debugging we've been
doing this week.

| API | Shows |
|---|---|
| `.showQtReceivedCode()` | The raw JS string as received by the C++ side, before any wrapping/escaping |
| `.showQtExecutedCode()` | The final JS actually handed to `runJavaScript()` — post-wrapping (e.g. IIFE wraps, JSON.stringify wrapping, escaping) |
| `.showQtResponse()` | The raw value/error Qt's callback returned, before it gets reshaped by `respond()` |

Together these three make the C++ ↔ JS boundary fully inspectable instead
of a black box — you'll be able to see exactly where a given `evaluate()`
call diverges from what you expected, without needing to add temporary
`qDebug()` calls and rebuild.

Short-named per plan, exact final method names TBD during implementation
(placeholder names above match what's been proposed so far).

---

## 🔭 Further out (not this release)

Ideas captured now so they don't get lost — no committed design yet.

### Direct-to-file downloads
A download path that writes straight to disk instead of round-tripping
through the Node runtime. Goal: avoid buffering large files (video, zips,
datasets) through the socket/JSON pipe just to write them back out —
Qt should stream bytes directly to a target path and just report back
completion/progress/errors.

### `piggy.stream.*` — media stream capture (targeting v0.35 / v0.38)
Rough shape, not finalized:

```js
await piggy.stream.something(selectorForVideoTag);
```

Idea: point it at a `<video>` (or other media) element's source, and have
it stream the underlying media out rather than just reading DOM state.
Open questions to resolve before implementation:
- How the target is specified — CSS selector? element handle? source URL directly?
- Format/container handling — raw passthrough vs re-mux?
- Where the output goes — file, stream back to Node, both?
- Live streams vs finite video — does it need a stop/cancel command?

This is explicitly a later release — flagging it here so the naming
question doesn't get forgotten, not because it's scheduled for v0.1.20.

---

## 📌 Notes

- This binary is currently ~12 versions behind `main` on the C++ side — the fixes above are being applied to the working *old* binary rather than chasing the newer source, which has an unrelated `evaluate` serialization regression (see: `PiggySerializationError`, `deepSerialize` — not wired up anywhere in current source, likely dead code from a prior refactor).
- Once this list stabilizes, worth `git tag`-ging the working binary/commit so future rebuilds don't accidentally reintroduce it.