'use strict';

const { spawn } = require('child_process');
const path  = require('path');
const fs    = require('fs');
const log   = require('./logger');

function resolveBinary(binary, mode) {
  if (binary && binary !== 'headless' && binary !== 'headful') {
    const resolved = path.resolve(binary);
    log.debug(`Binary path resolved: ${resolved}`);
    return resolved;
  }

  const isHeadless = !binary || binary === 'headless' || mode === 'headless';
  const suffix     = isHeadless ? 'headless' : 'headful';
  const ext        = process.platform === 'win32' ? '.exe' : '';

  const candidates = [
    path.join(process.cwd(), `nothing-browser-${suffix}${ext}`),
    path.join(process.cwd(), 'bin', `nothing-browser-${suffix}${ext}`),
    path.join(__dirname, '..', `nothing-browser-${suffix}${ext}`),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      log.debug(`Binary found: ${c}`);
      return c;
    }
  }

  const msg =
    `Nothing Browser binary not found. Tried:\n${candidates.join('\n')}\n` +
    `Pass an explicit path: piggy.launch({ binary: 'C:/path/to/nothing-browser-headless.exe' })`;
  log.error(msg);
  throw new Error(msg);
}

// ── stderr severity classification ─────────────────────────────────────────
// Qt writes normal debug/info/warning logging to stderr by convention on
// Linux — that's not the same thing as "this is an error". We only want to
// escalate lines that actually look like failures, and keep the rest quiet.

// Known-noisy-but-harmless patterns: always treated as non-error regardless
// of keyword matching below.
const BENIGN_PATTERNS = [
  /^qt\.webenginecontext/i,          // Qt WebEngine init banner
  /^\s*\*\s/,                        // Init Parameters bullet lines ("*  disable-gpu")
  /^GL Type:/i,
  /^Surface (Type|Profile|Version):/i,
  /^QSG RHI Backend:/i,
  /^Using (Supported|Software|Multithreaded)/i,
  /^Init Parameters:/i,
  /No .*\.json found/i,              // SessionManager "no file yet" notices on first run
  /^\[SessionManager\]/i,
  /^\[PiggyServer\] Listening/i,
  /^\[PiggyServer\] Socket client connected/i,
  /^\[PiggyServer\] Tab created/i,
  /^\[Piggy\] Socket ready/i,
  /^\[Piggy\] (UA|GPU)\s*:/i,
];

const ERROR_KEYWORDS = /error|fatal|exception|crash|failed/i;

function classifyStderrLine(text) {
  if (BENIGN_PATTERNS.some((re) => re.test(text))) return 'debug';
  if (ERROR_KEYWORDS.test(text)) return 'error';
  return 'debug';
}

function logStderrLine(text) {
  if (!text) return;
  const level = classifyStderrLine(text);
  if (level === 'error') {
    log.error(`[binary stderr] ${text}`);
  } else {
    log.debug(`[binary stderr] ${text}`);
  }
}

function spawnBinary(binaryPath, { args = [], readyTimeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    log.info(`Spawning binary: ${binaryPath}`);

    const child = spawn(binaryPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    let ready = false;
    const timer = setTimeout(() => {
      if (!ready) {
        const msg = 'Nothing Browser binary startup timed out';
        log.error(msg);
        reject(new Error(msg));
      }
    }, readyTimeout);

    function onData(chunk) {
      const text = chunk.toString();
      // Print raw binary stdout at debug level
      if (text.trim()) log.debug(`[binary] ${text.trim()}`);
      if (!ready && text.includes('[Piggy]')) {
        ready = true;
        clearTimeout(timer);
        log.success('Nothing Browser binary ready');
        resolve(child);
      }
    }

    child.stdout.on('data', onData);

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString().trim();
      if (!text) return;
      // Multi-line stderr chunks (e.g. Qt's init banner) get classified
      // as a whole block; classify+log per logical line for clarity.
      text.split('\n').forEach((line) => logStderrLine(line));
    });

    child.once('error', (err) => {
      clearTimeout(timer);
      log.error(`Binary spawn error: ${err.message}`);
      reject(err);
    });

    child.once('exit', (code) => {
      if (!ready) {
        clearTimeout(timer);
        const msg = `Nothing Browser binary exited with code ${code} before becoming ready`;
        log.error(msg);
        reject(new Error(msg));
      } else {
        log.warn(`Binary exited with code ${code}`);
      }
    });
  });
}

module.exports = { resolveBinary, spawnBinary };