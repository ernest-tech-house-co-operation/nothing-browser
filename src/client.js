'use strict';

const net = require('net');
const { EventEmitter } = require('events');
const { randomUUID } = require('crypto');

const SOCKET_NAME = process.platform === 'win32'
  ? '\\\\.\\pipe\\piggy'
  : '/tmp/piggy.sock';

class PiggyClient extends EventEmitter {
  constructor() {
    super();
    this._sock = null;
    this._pending = new Map(); // id -> { resolve, reject }
    this._buf = '';
  }

  connect() {
    return new Promise((resolve, reject) => {
      const sock = net.createConnection(SOCKET_NAME);
      sock.setEncoding('utf8');

      sock.once('connect', () => {
        this._sock = sock;
        resolve();
      });

      sock.once('error', reject);

      sock.on('data', (chunk) => {
        this._buf += chunk;
        let nl;
        while ((nl = this._buf.indexOf('\n')) !== -1) {
          const line = this._buf.slice(0, nl);
          this._buf = this._buf.slice(nl + 1);
          if (!line.trim()) continue;
          let msg;
          try { msg = JSON.parse(line); } catch { continue; }
          this._onMessage(msg);
        }
      });

      sock.on('close', () => {
        for (const [, p] of this._pending) p.reject(new Error('socket closed'));
        this._pending.clear();
      });
    });
  }

  _onMessage(msg) {
    // Event broadcast from C++
    if (msg.type === 'event') {
      this.emit(msg.event, msg);
      return;
    }
    // Response to a command
    const p = this._pending.get(msg.id);
    if (!p) return;
    this._pending.delete(msg.id);
    if (msg.ok) p.resolve(msg.data);
    else p.reject(new Error(msg.data ?? 'piggy error'));
  }

  send(cmd, payload = {}) {
    return new Promise((resolve, reject) => {
      const id = randomUUID();
      this._pending.set(id, { resolve, reject });
      const msg = JSON.stringify({ id, cmd, payload }) + '\n';
      this._sock.write(msg);
    });
  }

  close() {
    if (this._sock) { this._sock.destroy(); this._sock = null; }
  }
}

module.exports = { PiggyClient };
