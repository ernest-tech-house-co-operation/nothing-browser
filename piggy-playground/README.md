# piggy-playground

> A hands-on demo repo for every Piggy API. Clone it, run any demo, see it work.

Built by [Ernest Tech House](https://github.com/BunElysiaReact) · Kenya · 2026

---

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.0 (or Node.js ≥ 18)
- Nothing Browser headless binary in the project root

```bash
# Install the library
bun add nothing-browser

# Make the binary executable (Linux/macOS)
chmod +x nothing-browser-headless
```

Download the binary from [GitHub Releases](https://github.com/BunElysiaReact/nothing-browser/releases).

---

## Run Any Demo

```bash
bun run demos/01-basic-scrape.ts
```

Each demo is self-contained. They run independently — no shared state.

---

## Demo Index

| # | File | APIs Covered | Target |
|---|------|-------------|--------|
| 01 | `01-basic-scrape.ts` | launch, register, navigate, waitForSelector, evaluate, page.title, page.url | books.toscrape.com |
| 02 | `02-navigation.ts` | navigate, reload, go.back, go.forward, wait.navigation, wait.selector, wait.function, wait.response, page.content | books.toscrape.com |
| 03 | `03-interactions.ts` | click, dblclick, hover, type, select, scroll.to, scroll.by, keyboard.press, keyboard.combo, mouse.move | quotes.toscrape.com |
| 04 | `04-find-api.ts` | find.css, find.first, find.all, find.byText, find.byAttr, find.byTag, find.byPlaceholder, find.byRole, find.closest, find.parent, find.children, find.filter, find.count, find.exists, find.visible, find.enabled, find.checked | books + quotes |
| 05 | `05-provide-api.ts` | provide.text, provide.textAll, provide.attr, provide.attrAll, provide.html, provide.table, provide.list, provide.links, provide.images, provide.form, provide.page, provide.div, provide.meta, provide.select, provide.json | books + quotes |
| 06 | `06-cookies.ts` | cookie.set, cookie.get, cookie.list, cookie.delete | quotes.toscrape.com |
| 07 | `07-human-mode.ts` | human.set, human.get, human.type, human.click, actHuman | quotes.toscrape.com |
| 08 | `08-session.ts` | session.export, session.import, session.reload, session.paths, session.ws.save, session.pings.save | quotes.toscrape.com |
| 09 | `09-capture.ts` | capture.start, capture.stop, capture.requests, capture.ws, capture.cookies, capture.storage, capture.clear | books.toscrape.com |
| 10 | `10-proxy-rotation.ts` | proxy.fetch, proxy.load, proxy.set, proxy.test, proxy.test.stop, proxy.next, proxy.rotate, proxy.disable, proxy.enable, proxy.current, proxy.stats, proxy.list, proxy.rotation, proxy.config, proxy.save | httpbin.org/ip + TheSpeedX free proxies |
| 11 | `11-intercept-screenshot-pdf.ts` | intercept.rule.add, intercept.rule.clear, intercept.block.images, intercept.unblock.images, intercept.respond, intercept.modifyResponse, screenshot, pdf | books.toscrape.com |
| 12 | `12-dialogs-upload.ts` | dialog.accept, dialog.dismiss, dialog.status, dialog.onDialog, upload | local HTML pages |
| 13 | `13-iframes.ts` | iframe.list, iframe.evaluate, iframe.click, iframe.type, iframe.text, iframe.html, iframe.waitSel | local HTML pages |
| 14 | `14-expose-function.ts` | exposeFunction, exposed.result, addInitScript | local HTML page |
| 15 | `15-captcha-detection.ts` | captcha.status, captcha.resolve, captcha.pause, captcha.check, captcha.autoRetry, block.status, block.retry | local mock pages |
| 16 | `16-multi-tab.ts` | tab.new, tab.close, tab.list, parallel navigation | books.toscrape.com |

---

## Free Proxy Source

Demo 10 uses the [TheSpeedX/PROXY-List](https://github.com/TheSpeedX/PROXY-List) repo — updated daily, completely free.

```ts
await piggy.proxy.fetch({
  url: "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt"
})
```

Other available lists from the same repo:
- `socks5.txt` — SOCKS5 proxies
- `socks4.txt` — SOCKS4 proxies
- `http.txt`   — HTTP proxies

---

## Local Pages

Some demos (12, 13, 14, 15) generate their own `local-pages/` HTML files on first run.
No server needed — they load via `file://` protocol.

---

## Outputs

Some demos write files to the current directory:

| File | Created by |
|------|-----------|
| `screenshot-demo.png` | Demo 11 |
| `product-screenshot.png` | Demo 11 |
| `page-demo.pdf` | Demo 11 |
| `session-demo.json` | Demo 08 |
| `proxies-alive.txt` | Demo 10 |
| `cookies.json` | Auto-created by Piggy on first run |
| `profile.json` | Auto-created by Piggy on first run |

---

## Run All Demos

```bash
for i in demos/*.ts; do
  echo "Running $i..."
  bun run "$i"
  echo "---"
done
```

---

*Nothing Ecosystem · Ernest Tech House · Kenya · 2026*
