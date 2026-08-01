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

  async probe(timeoutMs = 400) {
    try {
      await this._open({ retries: 1, retryDelayMs: 0, timeoutMs, silent: true });
      return true;
    } catch {
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
        if (attemptsLeft > 1) {
          setTimeout(() => attempt(attemptsLeft - 1).then(resolve, reject), retryDelayMs);
        } else {
          if (!silent) log.error(`Connection failed: ${err.message}`);
          reject(err);
        }
      };

      ws.once('open', () => {
        clearTimeout(timer);
        this._ws = ws;
        this._wireSocket(ws);
        if (!silent) log.success(`Connected: ${url}`);
        resolve();
      });

      ws.once('unexpected-response', (req, res) => {
        clearTimeout(timer);
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => fail(new Error(
          `Piggy rejected connection: ${res.statusCode} ${body.trim()}`
        )));
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
