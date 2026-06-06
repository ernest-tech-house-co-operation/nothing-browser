'use strict';

const { spawn } = require('child_process');
const path = require('path');

/**
 * Resolve the binary path.
 * - If binary is 'headless' or 'headful', look next to this file or in cwd.
 * - Otherwise treat it as an absolute/relative path (Windows or Linux).
 */
function resolveBinary(binary, mode) {
  if (binary && binary !== 'headless' && binary !== 'headful') {
    // User supplied explicit path — use as-is
    return path.resolve(binary);
  }

  const isHeadless = (binary === 'headless') || (mode === 'headless');
  const suffix = isHeadless ? 'headless' : 'headful';

  const candidates = [];

  if (process.platform === 'win32') {
    candidates.push(
      path.join(process.cwd(), `nothing-browser-${suffix}.exe`),
      path.join(__dirname, '..', `nothing-browser-${suffix}.exe`),
    );
  } else {
    candidates.push(
      path.join(process.cwd(), `nothing-browser-${suffix}`),
      path.join(__dirname, '..', `nothing-browser-${suffix}`),
    );
  }

  const fs = require('fs');
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  throw new Error(
    `Nothing Browser binary not found. Tried:\n${candidates.join('\n')}\n` +
    `Pass an explicit path: piggy.launch({ binary: 'C:/path/to/nothing-browser-headless.exe' })`
  );
}

/**
 * Spawn the binary and wait until it's ready (listens on the pipe/socket).
 * Resolves with the child process.
 */
function spawnBinary(binaryPath, { args = [], readyTimeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    let ready = false;
    const timer = setTimeout(() => {
      if (!ready) reject(new Error('Nothing Browser binary startup timed out'));
    }, readyTimeout);

    function onData(chunk) {
      const text = chunk.toString();
      if (!ready && text.includes('[Piggy]')) {
        ready = true;
        clearTimeout(timer);
        resolve(child);
      }
    }

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    child.once('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.once('exit', (code) => {
      if (!ready) {
        clearTimeout(timer);
        reject(new Error(`Nothing Browser binary exited with code ${code} before becoming ready`));
      }
    });
  });
}

module.exports = { resolveBinary, spawnBinary };
