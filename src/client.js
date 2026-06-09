'use strict';

const net  = require('net');
const http = require('http');
const { EventEmitter } = require('events');
const { randomUUID }   = require('crypto');
const log = require('./logger');

const SOCKET_NAME = process.platform === 'win32'
  ? '\\\\.\\pipe\\piggy'
  : '/tmp/piggy.sock';

class PiggyClient extends EventEmitter {
  constructor(opts = {}) {
    super();
    this._opts    = opts;
    this._sock    = null;
    this._pending = new Map();
    this._buf     = '';
  }

  connect() {
    if (this._opts.host) return this._connectHttp();
    return this._connectSocket();
  }

  // ── Named pipe / Unix socket ───────────────────────────────────────────────

  _connectSocket() {
    return new Promise((resolve, reject) => {
      log.network(`Connecting to socket: ${SOCKET_NAME}`);
      const sock = net.createConnection(SOCKET_NAME);
      sock.setEncoding('utf8');

      sock.once('connect', () => {
        this._sock = sock;
        log.success('Socket connected');
        resolve();
      });

      sock.once('error', (err) => {
        log.error(`Socket connection error: ${err.message}`);
        reject(err);
      });

      sock.on('data', (chunk) => {
        this._buf += chunk;
        let nl;
        while ((nl = this._buf.indexOf('\n')) !== -1) {
          const line = this._buf.slice(0, nl);
          this._buf  = this._buf.slice(nl + 1);
          if (!line.trim()) continue;
          let msg;
          try { msg = JSON.parse(line); } catch { continue; }
          this._onMessage(msg);
        }
      });

      sock.on('close', () => {
        log.warn('Socket closed');
        for (const [, p] of this._pending) p.reject(new Error('socket closed'));
        this._pending.clear();
      });
    });
  }

  // ── HTTP mode (remote VPS, port 2005) ─────────────────────────────────────

  _connectHttp() {
    return new Promise((resolve, reject) => {
      log.network(`Connecting to remote Piggy: ${this._opts.host}`);
      const url  = new URL(this._opts.host);
      const body = 'hello';
      const req  = http.request({
        hostname: url.hostname,
        port:     url.port || 2005,
        path:     '/',
        method:   'POST',
        headers:  {
          'Content-Type':   'text/plain',
          'Content-Length': Buffer.byteLength(body),
          'X-Piggy-Key':    this._opts.key,
        },
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          if (res.statusCode === 200) {
            log.success(`Remote Piggy connected (${this._opts.host})`);
            resolve();
          } else {
            const msg = `Piggy HTTP connect failed: ${res.statusCode} — ${data.trim()}`;
            log.error(msg);
            reject(new Error(msg));
          }
        });
      });
      req.on('error', (err) => {
        log.error(`HTTP connect error: ${err.message}`);
        reject(err);
      });
      req.end(body);
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
    if (this._opts.host) return this._sendHttp(cmd, payload);
    return this._sendSocket(cmd, payload);
  }

  _sendSocket(cmd, payload) {
    return new Promise((resolve, reject) => {
      const id  = randomUUID();
      this._pending.set(id, { resolve, reject });
      const msg = JSON.stringify({ id, cmd, payload }) + '\n';
      this._sock.write(msg);
    });
  }

  _sendHttp(cmd, payload) {
    return new Promise((resolve, reject) => {
      const url  = new URL(this._opts.host);
      const body = JSON.stringify({ cmd, payload });
      const req  = http.request({
        hostname: url.hostname,
        port:     url.port || 2005,
        path:     '/',
        method:   'POST',
        headers:  {
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
          'X-Piggy-Key':    this._opts.key,
        },
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) resolve(parsed.data);
            else {
              const errMsg = parsed.data ?? 'piggy http error';
              log.error(`HTTP command failed [${cmd}]: ${errMsg}`);
              reject(new Error(errMsg));
            }
          } catch {
            const errMsg = `Invalid response for [${cmd}]: ${data}`;
            log.error(errMsg);
            reject(new Error(errMsg));
          }
        });
      });
      req.on('error', (err) => {
        log.error(`HTTP request error [${cmd}]: ${err.message}`);
        reject(err);
      });
      req.end(body);
    });
  }

  close() {
    if (this._sock) { this._sock.destroy(); this._sock = null; }
    log.debug('Client closed');
  }
}

module.exports = { PiggyClient };
