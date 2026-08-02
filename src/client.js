'use strict';

const WebSocket = require('ws');
const { EventEmitter } = require('events');
const { randomUUID }   = require('crypto');
const log = require('./logger');

// Fixed. Forever. Every script and every binary instance agrees on this
// without any config file, env var, or flag — that's the whole point.
const PORT = 2005;

class PiggyClient extends EventEmitter {
  constructor(opts = {}) {
    super();
    this._opts    = { host: '127.0.0.1', port: PORT, ...opts };
    this._ws      = null;
    this._pending = new Map();
  }

  // ── Connect ────────────────────────────────────────────────────────────────
  // Always the same transport (WebSocket), whether it's a binary you spawned
  // yourself or a shared instance someone else already has running.

  connect() {
    return this._open({ retries: 20, retryDelayMs: 250 });
  }

  // ── Probe ──────────────────────────────────────────────────────────────────
  // Used by Piggy.launch() to check "is something already listening on
  // 2005?" without throwing or logging noise if not. Resolves true/false,
  // never rejects.

  async probe(timeoutMs = 1500) {
    try {
      await this._open({ retries: 2, retryDelayMs: 150, timeoutMs, silent: true });
      return true;
    } catch (err) {
      // A wrong/missing key means something IS there — don't let the
      // caller mistake this for "nothing running, safe to spawn a new one".
      if (err.authFailure) throw err;
      // Otherwise it's a genuine "nothing answered" — but still worth
      // knowing why, so this doesn't stay a silent mystery next time.
      log.debug(`Probe found nothing on ${this._opts.host}:${this._opts.port} (${err.message})`);
      return false;
    }
  }

  _open({ retries, retryDelayMs, timeoutMs = 3000, silent = false } = {}) {
    const url = `ws://${this._opts.host}:${this._opts.port}`;
    const headers = this._opts.key ? { 'X-Piggy-Key': this._opts.key } : {};

    const attempt = (attemptsLeft) => new Promise((resolve, reject) => {
      if (!silent) log.network(`Connecting to Piggy: ${url}`);
      const ws = new WebSocket(url, { headers, handshakeTimeout: timeoutMs });

      const timer = setTimeout(() => {
        ws.terminate();
        fail(new Error(`Connection to ${url} timed out`));
      }, timeoutMs);

      const fail = (err) => {
        clearTimeout(timer);
        // Don't burn retries on a key that's just wrong — that won't
        // change on attempt #2. Only retry for genuine "nothing there yet"
        // failures (still starting up, not listening, etc).
        if (!err.authFailure && attemptsLeft > 1) {
          setTimeout(() => attempt(attemptsLeft - 1).then(resolve, reject), retryDelayMs);
        } else {
          if (!silent) log.error(`Connection failed: ${err.message}`);
          reject(err);
        }
      };

      ws.once('open', () => {
        // Don't resolve yet — a bad key still lets the WS handshake
        // complete before the server closes us. Wait for the server's
        // explicit {"type":"ready"} ack (or a close, which means auth
        // failed) before treating the connection as usable.
      });

      const onFirstMessage = (raw) => {
        let msg;
        try { msg = JSON.parse(raw.toString()); } catch { return; }
        if (msg.type !== 'ready') return;

        clearTimeout(timer);
        ws.off('message', onFirstMessage);
        this._ws = ws;
        this._wireSocket(ws);
        if (!silent) log.success(`Connected: ${url}`);
        resolve();
      };
      ws.on('message', onFirstMessage);

      ws.once('unexpected-response', (req, res) => {
        clearTimeout(timer);
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => fail(new Error(
          `Piggy rejected connection: ${res.statusCode} ${body.trim()}`
        )));
      });

      ws.once('close', (code, reason) => {
        // Only a failure if we haven't already resolved via the ready ack.
        if (this._ws === ws) return; // already connected fine, this is a later close
        const err = new Error(
          `Piggy closed the connection before it was ready` +
          `${code ? ` (code ${code})` : ''}` +
          `${reason ? `: ${reason}` : ' — check your connection key'}`
        );
        // Policy Violation close code == the server accepted the WS
        // handshake, then rejected us for a bad/missing key. Distinct from
        // "nothing was listening at all" (ECONNREFUSED-style errors).
        if (code === 1008) err.authFailure = true;
        fail(err);
      });

      ws.once('error', (err) => fail(err));
    });

    return attempt(retries);
  }

  _wireSocket(ws) {
    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      this._onMessage(msg);
    });

    ws.on('close', () => {
      log.warn('Piggy connection closed');
      for (const [, p] of this._pending) p.reject(new Error('connection closed'));
      this._pending.clear();
      this.emit('_disconnected');
    });
  }

  // ── Message dispatch ──────────────────────────────────────────────────────

  _onMessage(msg) {
    // C++ error broadcast — always shown to user
    if (msg.type === 'error') {
      log.error(`[C++] ${msg.message ?? JSON.stringify(msg)}`);
      return;
    }
    // Event from C++ (QR, captcha, dialog, proxy, navigate, …)
    if (msg.type === 'event') {
      log.debug(`Event ← ${msg.event}${msg.tabId ? ` (tab: ${msg.tabId})` : ''}`);
      this.emit(msg.event, msg);
      return;
    }
    // Response to a pending command
    const p = this._pending.get(msg.id);
    if (!p) return;
    this._pending.delete(msg.id);
    if (msg.ok) {
      p.resolve(msg.data);
    } else {
      const errMsg = msg.data ?? 'piggy error';
      log.error(`Command failed: ${errMsg}`);
      p.reject(new Error(errMsg));
    }
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  send(cmd, payload = {}) {
    log.network(`→ ${cmd}${payload.tabId ? ` [${payload.tabId}]` : ''}`);
    return new Promise((resolve, reject) => {
      if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
        reject(new Error('Piggy client is not connected'));
        return;
      }
      const id = randomUUID();
      this._pending.set(id, { resolve, reject });
      this._ws.send(JSON.stringify({ id, cmd, payload }));
    });
  }

  close() {
    if (this._ws) { this._ws.close(); this._ws = null; }
    log.debug('Client closed');
  }
}

module.exports = { PiggyClient, PORT };
