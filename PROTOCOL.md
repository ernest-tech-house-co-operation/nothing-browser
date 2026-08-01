# The Piggy Protocol — talking to the binary without the JS lib

The `nothing-browser` JS library (`piggy.js`) is **just a wrapper**. All it
does is open a WebSocket to the binary and send small JSON messages. There
is nothing JS-specific about the binary side at all — if your language can
open a WebSocket and send/receive text frames, it can drive the browser.
This document is the whole protocol: transport, message shapes, every
command, every payload field, and working example clients in Python and
C++ so you never have to touch the JS lib.

---

## 1. Transport

- **Protocol:** WebSocket (`ws://`, or `wss://` if you put TLS in front of
  it yourself — the binary itself only speaks plain `ws://`).
- **Port:** `2005`. Always. This is compiled into the binary as a constant,
  not a config option — every binary instance and every client agree on it
  without any setup step.
- **URL:** `ws://127.0.0.1:2005` for a locally spawned instance, or
  `ws://<host>:2005` for a remote one.
- **Auth (optional):** if the instance was started with a key (the
  headless daemon asks "require a connection key?" on first run), every
  connection must send an `X-Piggy-Key` header during the WebSocket
  handshake with the matching key, or the server closes the connection
  with close code `1008` (Policy Violation) before it ever exchanges a
  command. If no key was configured, any client can connect — no header
  needed.
- **Framing:** one JSON object per WebSocket **text frame**. Not
  newline-delimited, not length-prefixed — the WebSocket frame boundary
  *is* the message boundary. Don't buffer/split by `\n`; just parse
  whatever your WS library hands you per `message` event.

### Shared instance, many clients

The binary is a daemon, not a 1:1 pipe. Any number of clients — different
languages, different scripts, different processes — can be connected at
once, all talking to the same running browser instance. A client can:

1. **Launch it:** spawn the binary yourself, then connect once it's
   listening.
2. **Join it:** just connect to `ws://127.0.0.1:2005` — if a binary is
   already running, you're now sharing it with whoever else is connected.

Tabs are owned by whichever client created them (via `tab.new`).
Tab-scoped events (`navigate`, `dialog`, `exposed_call`) are delivered only
to the owning client, not to every connected client. Global events
(`proxy:*`) go to everyone, since proxy state is process-wide, not
per-tab.

---

## 2. Message shapes

There are exactly four kinds of message you'll ever see or send.

### 2.1 Request (client → server)

```json
{ "id": "any-string-you-pick", "cmd": "navigate", "payload": { "tabId": "…", "url": "https://example.com" } }
```

- `id` — you generate this (a UUID is fine, but any unique string works).
  The response to this request will carry the same `id` back, so you can
  match responses to requests when you have several in flight at once.
- `cmd` — the command name (full list in section 3).
- `payload` — an object of command-specific arguments. Almost every
  command that operates on a specific browser tab expects a `tabId` field
  inside `payload`. Commands that don't need a specific tab (like
  `tab.new`, `proxy.*`) ignore it.

### 2.2 Response (server → client, one per request)

```json
{ "id": "any-string-you-pick", "ok": true, "data": "loaded" }
```

- `id` — echoes the request's `id`.
- `ok` — `true`/`false`.
- `data` — result payload on success, or an error string/description on
  failure. Shape of `data` varies per command — see section 3.

### 2.3 Event (server → client, unprompted)

```json
{ "type": "event", "event": "navigate", "tabId": "…", "url": "https://example.com/page" }
```

- Always has `"type": "event"`.
- `event` — the event name.
- Remaining fields vary per event type (see section 4).
- Events have **no `id`** — they're not a response to anything you sent,
  don't try to match them against your pending-request map.

### 2.4 Error broadcast (server → client, rare)

```json
{ "type": "error", "message": "…" }
```

A low-level C++-side error not tied to any specific command. Rare; mostly
you'll just get `ok: false` responses instead.

---

## 3. Full command reference

Every command below is sent as `{"id": "...", "cmd": "<name>", "payload": {...}}`.
`tabId` is required in `payload` for every command that says "tab-scoped"
unless noted otherwise — get one from `tab.new` first.

### 3.1 Session & tabs

| cmd | payload | response `data` on success |
|---|---|---|
| `tab.new` | `{}` | new `tabId` (string) |
| `tab.close` | `{ "tabId" }` | `"closed"` |
| `tab.list` | `{}` | array of tab IDs (includes `"default"`) |
| `noclose` | `{ "tabId" }` | flags a tab so it's never auto-closed when its owning client disconnects |
| `close` | `{}` | closes **only your own** tabs and drops your connection. The shared binary keeps running for everyone else still connected. |
| `shutdown` | `{}` | the real kill switch — terminates the whole binary, every tab, every client. Use deliberately. |

### 3.2 Navigation (tab-scoped)

| cmd | payload | response `data` |
|---|---|---|
| `navigate` | `{ tabId, url }` | `"loaded"` (resolves once the page finishes loading) |
| `reload` | `{ tabId }` | `"reloaded"` |
| `refresh` | `{ tabId }` | hard reload bypassing cache — `"refreshed"` |
| `go.back` | `{ tabId }` | `"back"`, or `ok:false` if there's no history |
| `go.forward` | `{ tabId }` | `"forward"`, or `ok:false` if there's no history |
| `page.url` | `{ tabId }` | current URL string |
| `page.title` | `{ tabId }` | current title string |
| `page.content` | `{ tabId }` | full page HTML string |
| `wait.navigation` | `{ tabId }` | resolves on the next `loadFinished` |
| `wait.selector` | `{ tabId, selector, timeout? }` (ms, default 10000) | `"found"` or timeout error |
| `wait.response` | `{ tabId }` | currently a stub — resolves immediately |

### 3.3 DOM interaction (tab-scoped)

All of these run a small JS snippet against the page and return whatever
that snippet returns (usually `true`/`false`, or the JS result directly —
not wrapped/parsed like `provide.*` is).

| cmd | payload |
|---|---|
| `click` | `{ tabId, selector }` |
| `dblclick` | `{ tabId, selector }` |
| `hover` | `{ tabId, selector }` |
| `type` | `{ tabId, selector, text }` |
| `select` | `{ tabId, selector, value }` |
| `scroll.to` | `{ tabId, selector }` |
| `scroll.by` | `{ tabId, px? }` (default 300) |
| `keyboard.press` | `{ tabId, key }` (single key, e.g. `"Enter"`) |
| `keyboard.combo` | `{ tabId, combo }` (e.g. `"Control+A"`, `"Shift+Alt+X"`) |
| `mouse.move` | `{ tabId, x, y }` |
| `mouse.drag` | `{ tabId, from: {x,y}, to: {x,y} }` |
| `evaluate` | `{ tabId, js }` — runs arbitrary JS, returns raw result |

### 3.4 `find.*` — boolean checks only (tab-scoped)

Every `find.*` command returns a plain boolean in `data`. If you need
actual data back, use `provide.*` instead (section 3.5).

| cmd | payload |
|---|---|
| `find.exists` | `{ tabId, selector }` |
| `find.matches` | `{ tabId, selector }` (same as exists, alias) |
| `find.visible` | `{ tabId, selector }` |
| `find.enabled` | `{ tabId, selector }` |
| `find.checked` | `{ tabId, selector }` |
| `find.hasClass` | `{ tabId, selector, className }` |
| `find.hasAttr` | `{ tabId, selector, attr }` |
| `find.hasText` | `{ tabId, selector?, text }` (omit `selector` to search the whole `<body>`) |

### 3.5 `provide.*` — actual data extraction (tab-scoped)

Every `provide.*` command returns real content: strings, arrays, or
objects — never just a boolean. Most element-returning commands give back
an object shaped like:

```json
{ "tag": "a", "id": "…", "cls": "…", "text": "…", "html": "…", "attrs": { "href": "…" } }
```

(`text`/`html` are truncated to 1000/2000 chars respectively.)

| cmd | payload | returns |
|---|---|---|
| `provide.text` | `{ tabId, selector }` | trimmed innerText of first match, or `null` |
| `provide.textAll` | `{ tabId, selector }` | array of trimmed innerText for every match |
| `provide.attr` | `{ tabId, selector, attr }` | attribute value of first match, or `null` |
| `provide.attrAll` | `{ tabId, selector, attr }` | array of attribute values |
| `provide.html` | `{ tabId, selector, inner? }` | outerHTML (or innerHTML if `inner:true`) |
| `provide.table` | `{ tabId, selector }` | array of rows, each an array of cell text |
| `provide.list` | `{ tabId, selector }` | array of `<li>` text under the container |
| `provide.links` | `{ tabId, selector? }` | array of `href`s (whole doc if no selector) |
| `provide.images` | `{ tabId, selector? }` | array of `src`s (whole doc if no selector) |
| `provide.form` | `{ tabId, selector }` | `{ fieldName: value }` map (checkboxes → bool) |
| `provide.page` | `{ tabId }` | full `document.documentElement.outerHTML` |
| `provide.div` | `{ tabId, selector }` | element-data object of first match |
| `provide.meta` | `{ tabId }` | `{ metaName: content }` map of all `<meta>` tags |
| `provide.select` | `{ tabId, selector }` | `{ value, options: [{value,text,selected}] }` |
| `provide.json` | `{ tabId, selector }` | `JSON.parse()` of the element's textContent |
| `provide.count` | `{ tabId, selector }` | number of matches (not boolean!) |
| `provide.first` | `{ tabId, selector }` | element-data object of first match |
| `provide.all` | `{ tabId, selector }` | array of element-data objects, all matches |
| `provide.closest` | `{ tabId, selector, ancestorSelector }` | element-data of nearest matching ancestor |
| `provide.parent` | `{ tabId, selector }` | element-data of the parent |
| `provide.children` | `{ tabId, selector }` | array of element-data, direct children only |
| `provide.filter` | `{ tabId, selector, filter }` | matches of `selector` that also match CSS `filter` |
| `provide.byRole` | `{ tabId, role }` | array of element-data, `[role="…"]` |
| `provide.byTag` | `{ tabId, tag }` | array of element-data by tag name |
| `provide.byPlaceholder` | `{ tabId, text }` | array of element-data by placeholder |
| `provide.byAttr` | `{ tabId, attr, value }` | array of element-data by `[attr="value"]` |

### 3.6 Dialogs & uploads (tab-scoped)

| cmd | payload | notes |
|---|---|---|
| `dialog.accept` | `{ tabId, text? }` | accepts a pending JS `alert`/`confirm`/`prompt`; `text` is the prompt answer |
| `dialog.dismiss` | `{ tabId }` | dismisses the pending dialog |
| `dialog.status` | `{ tabId }` | `{ pending, type, message, autoAction }` |
| `dialog.setAutoAction` | `{ tabId, action }` | `action` ∈ `accept`/`dismiss`/`manual` — auto-resolve future dialogs |
| `dialog.waitAndAccept` | `{ tabId, text?, timeout? }` (ms, default 30000) | blocks until a dialog appears, then accepts it |
| `dialog.waitAndDismiss` | `{ tabId, timeout? }` | blocks until a dialog appears, then dismisses it |
| `upload` | `{ tabId, selector, path }` | clicks a file input and stages `path` for the native picker |

### 3.7 Network capture (tab-scoped)

| cmd | payload | returns |
|---|---|---|
| `capture.start` | `{ tabId }` | begins recording requests/WS frames for this tab |
| `capture.stop` | `{ tabId }` | stops recording (captured data stays until cleared) |
| `capture.requests` | `{ tabId }` | array of `{method,url,status,type,mime,reqHeaders,reqBody,resHeaders,resBody,size,timestamp}` |
| `capture.ws` | `{ tabId }` | array of `{connectionId,url,direction,data,binary,timestamp}` |
| `capture.clear` | `{ tabId }` | wipes captured requests + WS frames for this tab |
| `export.json` | `{ tabId, path? }` | same shape as `{requests: […], websocket: […]}` — returned inline, or written to `path` if given |

### 3.8 Media

| cmd | payload | returns |
|---|---|---|
| `screenshot` | `{ tabId }` | base64 PNG string |
| `pdf` | `{ tabId }` | base64 PDF string (A4, 15mm margins) |
| `intercept.block.images` | `{ tabId }` | disables image loading for this tab |
| `intercept.unblock.images` | `{ tabId }` | re-enables image loading |

### 3.9 Proxy (NOT tab-scoped — process-wide)

| cmd | payload | notes |
|---|---|---|
| `proxy.load` | `{ path }` | load a proxy list from a file |
| `proxy.fetch` | `{ url }` | fetch a proxy list from a URL (async — results via `proxy:loaded`/`proxy:fetch:failed` events) |
| `proxy.ovpn` | `{ path }` | load an `.ovpn` config |
| `proxy.set` | `{ proxy: "socks5://user:pass@host:port" }` **or** `{ host, port, type?, user?, pass? }` (`type` ∈ `http`/`https`/`socks5`, default `socks5`) | applies immediately as the process's active proxy |
| `proxy.test` | `{}` | health-checks all loaded proxies (async — results via `proxy:alive`/`proxy:dead`/`proxy:check:done` events) |
| `proxy.test.stop` | `{}` | aborts an in-progress health check |
| `proxy.next` / `proxy.rotate` | `{}` | advances to the next proxy in the list |
| `proxy.disable` | `{}` | switch to real IP |
| `proxy.enable` | `{}` | re-activate the current proxy |
| `proxy.current` | `{}` | `{ active, host, port, type, proxy, latency, health, … }` |
| `proxy.stats` | `{}` | `{ total, alive, dead, index, active, checking, skipDead, autoCheck }` |
| `proxy.list` | `{ limit? }` (default 500) | `{ proxies: […], total, shown }` |
| `proxy.rotation` | `{ mode, interval? }` (`mode` ∈ `none`/`timed`/`perRequest`, `interval` in seconds, default 60) | sets rotation behavior |
| `proxy.config` | `{ skipDead?, autoCheck? }` | toggles flags, returns current values |
| `proxy.save` | `{ path, filter? }` (`filter` ∈ `all`/`alive`/`dead`) | writes proxy list to a file |

---

## 4. Events you can receive

Sent unprompted, any time, no `id`. Listen for these on your WS connection
independently of whatever request/response pairs you're tracking.

| event | fields | scope |
|---|---|---|
| `navigate` | `tabId, url` | tab-scoped (owner only) |
| `dialog` | `tabId, dialogType, message` | tab-scoped (owner only) |
| `exposed_call` | `tabId, name, callId, data` | tab-scoped (owner only) |
| `proxy:changed` | `proxy, latency` | global |
| `proxy:loaded` | (fetch success) | global |
| `proxy:fetch:failed` | `error` | global |
| `proxy:check:started` | — | global |
| `proxy:check:done` | `alive, dead` | global |
| `proxy:alive` | `index, latency` | global |
| `proxy:dead` | `index, latency` | global |
| `proxy:exhausted` | — | global |
| `proxy:ovpn:loaded` | `remote, port` | global |

---

## 5. Writing your own client — the algorithm

Regardless of language:

1. Open a WebSocket to `ws://<host>:2005`. If the target instance needs a
   key, set the `X-Piggy-Key` header on the handshake before connecting.
2. Keep a map of `request-id → callback/future`.
3. To send a command: generate an id, store the callback, send
   `{"id","cmd","payload"}` as one text frame.
4. On every incoming text frame, parse it as JSON and branch:
   - `type == "event"` → dispatch to your event handlers, don't touch the
     pending-request map.
   - `type == "error"` → log it, not tied to a specific request.
   - otherwise (has `id`) → look up the pending request by `id`, resolve
     or reject it based on `ok`, remove it from the map.
5. Almost every real command needs a `tabId` — call `tab.new` first and
   hang onto the id it returns.

That's the entire client-side contract. No handshake beyond the WS
upgrade, no session negotiation, no keep-alive pings required (though
your WS library's default ping/pong is fine to leave on).

---

## 6. Example client — Python

Uses the `websockets` library (`pip install websockets`).

```python
import asyncio
import json
import uuid
import websockets

class Piggy:
    def __init__(self, host="127.0.0.1", port=2005, key=None):
        self._url = f"ws://{host}:{port}"
        self._headers = {"X-Piggy-Key": key} if key else {}
        self._ws = None
        self._pending = {}
        self._events = {}

    async def connect(self):
        self._ws = await websockets.connect(self._url, extra_headers=self._headers)
        asyncio.create_task(self._listen())

    async def _listen(self):
        async for raw in self._ws:
            msg = json.loads(raw)

            if msg.get("type") == "event":
                handler = self._events.get(msg["event"])
                if handler:
                    handler(msg)
                continue

            if msg.get("type") == "error":
                print("[C++ error]", msg.get("message"))
                continue

            fut = self._pending.pop(msg.get("id"), None)
            if fut is None:
                continue
            if msg.get("ok"):
                fut.set_result(msg.get("data"))
            else:
                fut.set_exception(RuntimeError(msg.get("data")))

    async def send(self, cmd, **payload):
        req_id = str(uuid.uuid4())
        fut = asyncio.get_event_loop().create_future()
        self._pending[req_id] = fut
        await self._ws.send(json.dumps({"id": req_id, "cmd": cmd, "payload": payload}))
        return await fut

    def on(self, event_name, handler):
        self._events[event_name] = handler

    async def close(self):
        await self._ws.close()


async def main():
    piggy = Piggy()          # local, no key
    await piggy.connect()

    tab_id = await piggy.send("tab.new")
    await piggy.send("navigate", tabId=tab_id, url="https://example.com")

    title = await piggy.send("page.title", tabId=tab_id)
    print("Title:", title)

    links = await piggy.send("provide.links", tabId=tab_id)
    print("Links found:", len(links))

    await piggy.send("close")   # closes just this script's tabs, not the whole daemon
    await piggy.close()

asyncio.run(main())
```

To **join an already-running instance instead of caring whether you
launched it**, there's nothing special to do — just connect. If nothing's
listening on 2005, `websockets.connect()` will raise a connection-refused
error, which is your signal to go spawn the binary yourself (via
`subprocess.Popen`) and retry the connection a few times with a short
delay while it starts up.

---

## 7. Example client — C++ (Qt)

Since the binary itself is built on Qt6, `QWebSocket` is the natural fit
if your C++ scraper is also a Qt application (`QT += websockets network`
in your project file).

```cpp
#include <QCoreApplication>
#include <QWebSocket>
#include <QJsonDocument>
#include <QJsonObject>
#include <QUuid>
#include <QMap>
#include <functional>

class PiggyClient : public QObject {
    Q_OBJECT
public:
    explicit PiggyClient(QObject *parent = nullptr) : QObject(parent) {
        connect(&m_ws, &QWebSocket::connected, this, [](){
            qDebug() << "[Piggy] connected";
        });
        connect(&m_ws, &QWebSocket::textMessageReceived,
                this, &PiggyClient::onMessage);
    }

    void connectTo(const QString &host = "127.0.0.1", quint16 port = 2005,
                    const QString &key = QString()) {
        QUrl url(QString("ws://%1:%2").arg(host).arg(port));
        QNetworkRequest req(url);
        if (!key.isEmpty())
            req.setRawHeader("X-Piggy-Key", key.toUtf8());
        m_ws.open(req);
    }

    // fires callback(ok, data) when the response for this command arrives
    void send(const QString &cmd, const QJsonObject &payload,
               std::function<void(bool, const QJsonValue&)> callback) {
        QString id = QUuid::createUuid().toString(QUuid::WithoutBraces);
        m_pending[id] = callback;
        QJsonObject req{ {"id", id}, {"cmd", cmd}, {"payload", payload} };
        m_ws.sendTextMessage(QJsonDocument(req).toJson(QJsonDocument::Compact));
    }

private slots:
    void onMessage(const QString &raw) {
        QJsonObject msg = QJsonDocument::fromJson(raw.toUtf8()).object();

        if (msg["type"].toString() == "event") {
            qDebug() << "[event]" << msg["event"].toString() << msg;
            return; // dispatch to your own event handlers here
        }
        if (msg["type"].toString() == "error") {
            qWarning() << "[C++ error]" << msg["message"].toString();
            return;
        }

        QString id = msg["id"].toString();
        if (!m_pending.contains(id)) return;
        auto cb = m_pending.take(id);
        cb(msg["ok"].toBool(), msg["data"]);
    }

private:
    QWebSocket m_ws;
    QMap<QString, std::function<void(bool, const QJsonValue&)>> m_pending;
};
```

Usage:

```cpp
auto *piggy = new PiggyClient;
piggy->connectTo(); // 127.0.0.1:2005, no key

piggy->send("tab.new", {}, [piggy](bool ok, const QJsonValue &tabIdVal){
    QString tabId = tabIdVal.toString();
    piggy->send("navigate", {{"tabId", tabId}, {"url", "https://example.com"}},
        [piggy, tabId](bool ok, const QJsonValue&){
            piggy->send("page.title", {{"tabId", tabId}}, [](bool ok, const QJsonValue &title){
                qDebug() << "Title:" << title.toString();
            });
        });
});
```

If your C++ tool isn't a Qt application, any WebSocket client library
works the same way — `IXWebSocket`, `websocketpp`, `libwebsockets`,
whatever. The wire format doesn't care what sent it.

---

## 8. Gotchas worth knowing up front

- **`tabId` is almost always required.** The one big source of `ok:false`
  errors from a fresh client is forgetting to call `tab.new` first.
- **`close` vs `shutdown`** — `close` only tears down your own tabs and
  connection. If you actually want to kill the shared binary for
  everyone, you want `shutdown`, not `close`.
- **Async commands fire events, not just responses.** `proxy.fetch` and
  `proxy.test` respond immediately with "started", but the real result
  comes later as a `proxy:loaded`/`proxy:fetch:failed` or
  `proxy:alive`/`proxy:dead`/`proxy:check:done` event. Don't block waiting
  on the response alone for those.
- **`find.*` always returns boolean; `provide.*` always returns data.**
  If you want to know *whether* something is there, use `find.*`. If you
  want the actual text/html/attributes, use `provide.*`.
