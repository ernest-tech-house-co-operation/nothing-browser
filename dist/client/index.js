import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: __accessProp.bind(mod, key),
        enumerable: true
      });
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/ernest-logger/colors/colors.js
var require_colors = __commonJS((exports, module) => {
  var colors = {
    black: "\x1B[30m",
    red: "\x1B[31m",
    green: "\x1B[32m",
    yellow: "\x1B[33m",
    blue: "\x1B[34m",
    magenta: "\x1B[35m",
    cyan: "\x1B[36m",
    white: "\x1B[37m",
    brightBlack: "\x1B[90m",
    brightRed: "\x1B[91m",
    brightGreen: "\x1B[92m",
    brightYellow: "\x1B[93m",
    brightBlue: "\x1B[94m",
    brightMagenta: "\x1B[95m",
    brightCyan: "\x1B[96m",
    brightWhite: "\x1B[97m",
    bgBlack: "\x1B[40m",
    bgRed: "\x1B[41m",
    bgGreen: "\x1B[42m",
    bgYellow: "\x1B[43m",
    bgBlue: "\x1B[44m",
    bgMagenta: "\x1B[45m",
    bgCyan: "\x1B[46m",
    bgWhite: "\x1B[47m",
    bgBrightBlack: "\x1B[100m",
    bgBrightRed: "\x1B[101m",
    bgBrightGreen: "\x1B[102m",
    bgBrightYellow: "\x1B[103m",
    bgBrightBlue: "\x1B[104m",
    bgBrightMagenta: "\x1B[105m",
    bgBrightCyan: "\x1B[106m",
    bgBrightWhite: "\x1B[107m",
    reset: "\x1B[0m",
    bold: "\x1B[1m",
    dim: "\x1B[2m",
    italic: "\x1B[3m",
    underline: "\x1B[4m",
    blink: "\x1B[5m",
    reverse: "\x1B[7m",
    hidden: "\x1B[8m",
    strikethrough: "\x1B[9m",
    success: "\x1B[32m",
    error: "\x1B[31m",
    warning: "\x1B[33m",
    info: "\x1B[34m",
    debug: "\x1B[36m",
    primary: "\x1B[94m",
    secondary: "\x1B[90m",
    danger: "\x1B[91m",
    muted: "\x1B[2m"
  };
  colors.combine = (...codes) => {
    return codes.map((code) => colors[code] || "").join("");
  };
  colors.wrap = (text, color) => {
    return (colors[color] || "") + text + colors.reset;
  };
  colors.gradient = (text, colorSequence = ["cyan", "blue", "magenta"]) => {
    const chars = text.split("");
    const colorCount = colorSequence.length;
    return chars.map((char, i) => {
      const colorName = colorSequence[i % colorCount];
      return colors[colorName] + char;
    }).join("") + colors.reset;
  };
  colors.rainbow = (text) => {
    const rainbowColors = ["red", "yellow", "green", "cyan", "blue", "magenta"];
    return colors.gradient(text, rainbowColors);
  };
  module.exports = colors;
});

// node_modules/ernest-logger/emojis/emojis.js
var require_emojis = __commonJS((exports, module) => {
  var emojis = {
    trace: "\uD83D\uDD0D",
    debug: "\uD83D\uDC1E",
    info: "ℹ️",
    success: "✅",
    warn: "⚠️",
    error: "❌",
    fatal: "\uD83D\uDC80",
    start: "▶️",
    stop: "⏹️",
    pause: "⏸️",
    resume: "⏯️",
    restart: "\uD83D\uDD04",
    shutdown: "\uD83D\uDED1",
    boot: "\uD83D\uDE80",
    network: "\uD83C\uDF10",
    api: "\uD83D\uDD0C",
    request: "\uD83D\uDCE4",
    response: "\uD83D\uDCE5",
    webhook: "\uD83E\uDE9D",
    socket: "\uD83D\uDD17",
    upload: "⬆️",
    download: "⬇️",
    sync: "\uD83D\uDD04",
    db: "\uD83D\uDCBE",
    database: "\uD83D\uDDC4️",
    cache: "\uD83D\uDCA8",
    storage: "\uD83D\uDCE6",
    backup: "\uD83D\uDCBF",
    restore: "♻️",
    query: "\uD83D\uDD0E",
    migration: "\uD83D\uDD00",
    security: "\uD83D\uDD12",
    unlock: "\uD83D\uDD13",
    auth: "\uD83D\uDD10",
    key: "\uD83D\uDD11",
    token: "\uD83C\uDFAB",
    encrypt: "\uD83D\uDEE1️",
    decrypt: "\uD83D\uDD13",
    firewall: "\uD83E\uDDF1",
    scan: "\uD83D\uDD2C",
    file: "\uD83D\uDCC4",
    folder: "\uD83D\uDCC1",
    document: "\uD83D\uDCC3",
    archive: "\uD83D\uDDDC️",
    zip: "\uD83E\uDD10",
    pdf: "\uD83D\uDCD5",
    csv: "\uD83D\uDCCA",
    json: "\uD83D\uDCCB",
    xml: "\uD83D\uDCF0",
    config: "⚙️",
    cloud: "☁️",
    server: "\uD83D\uDDA5️",
    deploy: "\uD83D\uDE80",
    build: "\uD83D\uDD28",
    compile: "⚒️",
    package: "\uD83D\uDCE6",
    publish: "\uD83D\uDCE2",
    release: "\uD83C\uDF89",
    rollback: "⏮️",
    test: "\uD83E\uDDEA",
    unittest: "\uD83D\uDD2C",
    integration: "\uD83D\uDD17",
    coverage: "\uD83D\uDCCA",
    benchmark: "⏱️",
    performance: "⚡",
    profiling: "\uD83D\uDCC8",
    bugFix: "\uD83D\uDC1B",
    feature: "✨",
    refactor: "♻️",
    cleanup: "\uD83E\uDDF9",
    user: "\uD83D\uDC64",
    users: "\uD83D\uDC65",
    admin: "\uD83D\uDC51",
    robot: "\uD83E\uDD16",
    human: "\uD83D\uDC68‍\uD83D\uDC69‍\uD83D\uDC67‍\uD83D\uDC66",
    team: "\uD83D\uDC68‍\uD83D\uDC69‍\uD83D\uDC67‍\uD83D\uDC66",
    chat: "\uD83D\uDCAC",
    message: "✉️",
    notification: "\uD83D\uDD14",
    alert: "\uD83D\uDEA8",
    money: "\uD83D\uDCB0",
    payment: "\uD83D\uDCB3",
    invoice: "\uD83E\uDDFE",
    chart: "\uD83D\uDCCA",
    analytics: "\uD83D\uDCC8",
    metrics: "\uD83D\uDCC9",
    dashboard: "\uD83C\uDF9B️",
    report: "\uD83D\uDCC4",
    online: "\uD83D\uDFE2",
    offline: "\uD83D\uDD34",
    pending: "\uD83D\uDFE1",
    processing: "⏳",
    loading: "⌛",
    complete: "✔️",
    incomplete: "❌",
    progress: "\uD83D\uDCCA",
    idea: "\uD83D\uDCA1",
    lightning: "⚡",
    fire: "\uD83D\uDD25",
    star: "⭐",
    trophy: "\uD83C\uDFC6",
    medal: "\uD83C\uDFC5",
    gift: "\uD83C\uDF81",
    celebrate: "\uD83C\uDF89",
    party: "\uD83C\uDF8A",
    rocket: "\uD83D\uDE80",
    ship: "\uD83D\uDEA2",
    airplane: "✈️",
    train: "\uD83D\uDE86",
    calendar: "\uD83D\uDCC5",
    clock: "\uD83D\uDD50",
    timer: "⏲️",
    bell: "\uD83D\uDD14",
    flag: "\uD83D\uDEA9",
    bookmark: "\uD83D\uDD16",
    tag: "\uD83C\uDFF7️",
    pin: "\uD83D\uDCCC",
    magnet: "\uD83E\uDDF2",
    crystal: "\uD83D\uDD2E",
    gem: "\uD83D\uDC8E",
    target: "\uD83C\uDFAF",
    dart: "\uD83C\uDFAF",
    compass: "\uD83E\uDDED",
    map: "\uD83D\uDDFA️",
    globe: "\uD83C\uDF0D",
    satellite: "\uD83D\uDEF0️",
    telescope: "\uD83D\uDD2D",
    microscope: "\uD83D\uDD2C",
    magGlass: "\uD83D\uDD0D",
    wrench: "\uD83D\uDD27",
    hammer: "\uD83D\uDD28",
    screwdriver: "\uD83E\uDE9B",
    gear: "⚙️",
    nut: "\uD83D\uDD29",
    link: "\uD83D\uDD17",
    chain: "⛓️",
    bridge: "\uD83C\uDF09",
    door: "\uD83D\uDEAA",
    window: "\uD83E\uDE9F",
    shield: "\uD83D\uDEE1️",
    sword: "⚔️",
    bomb: "\uD83D\uDCA3",
    explosion: "\uD83D\uDCA5",
    spark: "✨",
    dizzy: "\uD83D\uDCAB",
    wave: "\uD83C\uDF0A",
    droplet: "\uD83D\uDCA7",
    snowflake: "❄️",
    sun: "☀️",
    moon: "\uD83C\uDF19",
    rainbow: "\uD83C\uDF08",
    seedling: "\uD83C\uDF31",
    tree: "\uD83C\uDF32",
    leaf: "\uD83C\uDF43",
    recycle: "♻️"
  };
  emojis.get = (name, fallback = "") => {
    return emojis[name] || fallback;
  };
  emojis.has = (name) => {
    return emojis.hasOwnProperty(name);
  };
  emojis.list = () => {
    return Object.keys(emojis).filter((key) => typeof emojis[key] === "string" && !["get", "has", "list"].includes(key));
  };
  module.exports = emojis;
});

// node_modules/ernest-logger/utils/timestamp.js
var require_timestamp = __commonJS((exports, module) => {
  var getTimestamp = () => {
    const date = new Date;
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };
  var getTimestampWithMs = () => {
    const date = new Date;
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ms = String(date.getMilliseconds()).padStart(3, "0");
    return `${hours}:${minutes}:${seconds}.${ms}`;
  };
  var getFullTimestamp = () => {
    const date = new Date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  var getISOTimestamp = () => {
    return new Date().toISOString();
  };
  var getUnixTimestamp = () => {
    return Math.floor(Date.now() / 1000);
  };
  var getRelativeTime = (date) => {
    const now = Date.now();
    const timestamp = date instanceof Date ? date.getTime() : date;
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (seconds < 60)
      return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
    if (minutes < 60)
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    if (hours < 24)
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };
  var formatCustom = (format, date = new Date) => {
    const tokens = {
      YYYY: date.getFullYear(),
      MM: String(date.getMonth() + 1).padStart(2, "0"),
      DD: String(date.getDate()).padStart(2, "0"),
      HH: String(date.getHours()).padStart(2, "0"),
      mm: String(date.getMinutes()).padStart(2, "0"),
      ss: String(date.getSeconds()).padStart(2, "0"),
      SSS: String(date.getMilliseconds()).padStart(3, "0")
    };
    let result = format;
    Object.entries(tokens).forEach(([token, value]) => {
      result = result.replace(token, value);
    });
    return result;
  };
  module.exports = getTimestamp;
  module.exports.getTimestamp = getTimestamp;
  module.exports.getTimestampWithMs = getTimestampWithMs;
  module.exports.getFullTimestamp = getFullTimestamp;
  module.exports.getISOTimestamp = getISOTimestamp;
  module.exports.getUnixTimestamp = getUnixTimestamp;
  module.exports.getRelativeTime = getRelativeTime;
  module.exports.formatCustom = formatCustom;
});

// node_modules/ernest-logger/utils/formatter.js
var require_formatter = __commonJS((exports, module) => {
  var colors = require_colors();
  var createBadge = (text, color) => {
    const bg = "bg" + color.charAt(0).toUpperCase() + color.slice(1);
    const bgColor = colors[bg] || colors.bgBlue;
    const textColor = colors.white + colors.bold;
    return bgColor + textColor + ` ${text} ` + colors.reset;
  };
  var createBox = (message, color, emoji = "") => {
    const lines = message.split(`
`);
    const maxLength = Math.max(...lines.map((line) => stripAnsi(line).length));
    const topLeft = "╔";
    const topRight = "╗";
    const bottomLeft = "╚";
    const bottomRight = "╝";
    const horizontal = "═";
    const vertical = "║";
    const colorCode = colors[color] || colors.blue;
    const horizontalLine = horizontal.repeat(maxLength + 4);
    let box = colorCode + topLeft + horizontalLine + topRight + colors.reset + `
`;
    if (emoji) {
      const emojiPadding = " ".repeat(maxLength + 2 - emoji.length);
      box += colorCode + vertical + colors.reset + ` ${emoji}${emojiPadding} ` + colorCode + vertical + colors.reset + `
`;
      box += colorCode + vertical + horizontal.repeat(maxLength + 4) + vertical + colors.reset + `
`;
    }
    lines.forEach((line) => {
      const stripped = stripAnsi(line);
      const padding = " ".repeat(maxLength - stripped.length);
      box += colorCode + vertical + colors.reset + `  ${line}${padding}  ` + colorCode + vertical + colors.reset + `
`;
    });
    box += colorCode + bottomLeft + horizontalLine + bottomRight + colors.reset;
    return box;
  };
  var createBanner = (text, char = "=") => {
    const length = stripAnsi(text).length;
    const line = char.repeat(length + 4);
    return `${line}
  ${text}  
${line}`;
  };
  var stripAnsi = (text) => {
    return text.replace(/\x1b\[[0-9;]*m/g, "");
  };
  var truncate = (text, maxLength) => {
    if (text.length <= maxLength)
      return text;
    return text.substring(0, maxLength - 3) + "...";
  };
  var center = (text, width) => {
    const stripped = stripAnsi(text);
    const padding = Math.max(0, width - stripped.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return " ".repeat(leftPad) + text + " ".repeat(rightPad);
  };
  var padRight = (text, width) => {
    const stripped = stripAnsi(text);
    const padding = Math.max(0, width - stripped.length);
    return text + " ".repeat(padding);
  };
  var padLeft = (text, width) => {
    const stripped = stripAnsi(text);
    const padding = Math.max(0, width - stripped.length);
    return " ".repeat(padding) + text;
  };
  var createProgressBar = (current, total, width = 20) => {
    const percentage = Math.min(100, Math.max(0, current / total * 100));
    const filled = Math.round(percentage / 100 * width);
    const empty = width - filled;
    const bar = colors.green + "█".repeat(filled) + colors.dim + "░".repeat(empty) + colors.reset;
    const percent = `${percentage.toFixed(1)}%`;
    return `${bar} ${percent}`;
  };
  var createSeparator = (length = 50, char = "-", color = "dim") => {
    const colorCode = colors[color] || colors.dim;
    return colorCode + char.repeat(length) + colors.reset;
  };
  var formatKeyValue = (key, value, keyWidth = 20) => {
    const paddedKey = padRight(colors.cyan + key + colors.reset, keyWidth + 9);
    return `${paddedKey}: ${colors.white}${value}${colors.reset}`;
  };
  var createList = (items, bullet = "•") => {
    return items.map((item) => `  ${colors.dim}${bullet}${colors.reset} ${item}`).join(`
`);
  };
  var highlight = (text, bgColor = "bgYellow") => {
    const bg = colors[bgColor] || colors.bgYellow;
    return bg + colors.black + text + colors.reset;
  };
  module.exports = {
    createBadge,
    createBox,
    createBanner,
    stripAnsi,
    truncate,
    center,
    padRight,
    padLeft,
    createProgressBar,
    createSeparator,
    formatKeyValue,
    createList,
    highlight
  };
});

// node_modules/ernest-logger/index.js
var require_ernest_logger = __commonJS((exports, module) => {
  var fs = __require("fs");
  var path = __require("path");
  var colors = require_colors();
  var emojis = require_emojis();
  var getTimestamp = require_timestamp();
  var formatter = require_formatter();
  var levelPriority = {
    trace: 0,
    debug: 1,
    info: 2,
    success: 3,
    warn: 4,
    error: 5,
    fatal: 6
  };
  var globalConfig = {
    time: true,
    emoji: true,
    level: "debug",
    file: false,
    filePath: path.join(process.cwd(), "ernest.log"),
    colorize: true,
    prefix: "",
    maxFileSize: 5 * 1024 * 1024,
    customLevels: {}
  };
  var rotateLogFile = (filePath, maxSize) => {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const rotatedPath = filePath.replace(".log", `-${timestamp}.log`);
        fs.renameSync(filePath, rotatedPath);
      }
    } catch (err) {}
  };
  var createLogger = (options = {}) => {
    const config = { ...globalConfig, ...options };
    const formatMessage = (level, message, color) => {
      if (levelPriority[level] < levelPriority[config.level])
        return null;
      let output = "";
      if (config.time) {
        const timestamp = getTimestamp();
        output += config.colorize ? colors.dim + `[${timestamp}]` + colors.reset + " " : `[${timestamp}] `;
      }
      if (config.prefix) {
        output += config.colorize ? colors.dim + config.prefix + colors.reset + " " : config.prefix + " ";
      }
      if (config.emoji && emojis[level]) {
        output += `${emojis[level]} `;
      }
      const levelBadge = formatter.createBadge(level.toUpperCase(), color);
      output += config.colorize ? levelBadge + " " : `[${level.toUpperCase()}] `;
      output += config.colorize ? colors[color] + message + colors.reset : message;
      return output;
    };
    const writeToFile = (message) => {
      if (!config.file)
        return;
      try {
        rotateLogFile(config.filePath, config.maxFileSize);
        const plainMessage = message.replace(/\x1b\[[0-9;]*m/g, "");
        fs.appendFileSync(config.filePath, plainMessage + `
`);
      } catch (err) {
        console.error("Failed to write to log file:", err.message);
      }
    };
    const logMessage = (level, color, message) => {
      const formatted = formatMessage(level, message, color);
      if (!formatted)
        return;
      console.log(formatted);
      writeToFile(formatted);
    };
    const logger = {
      trace: (msg) => logMessage("trace", "dim", msg),
      debug: (msg) => logMessage("debug", "cyan", msg),
      info: (msg) => logMessage("info", "blue", msg),
      success: (msg) => logMessage("success", "green", msg),
      warn: (msg) => logMessage("warn", "yellow", msg),
      error: (msg) => logMessage("error", "red", msg),
      fatal: (msg) => logMessage("fatal", "brightRed", msg),
      start: (msg) => logMessage("info", "brightGreen", `▶️  ${msg}`),
      stop: (msg) => logMessage("info", "brightRed", `⏹️  ${msg}`),
      network: (msg) => logMessage("info", "brightCyan", `\uD83C\uDF10 ${msg}`),
      db: (msg) => logMessage("info", "brightMagenta", `\uD83D\uDCBE ${msg}`),
      api: (msg) => logMessage("info", "brightBlue", `\uD83D\uDD0C ${msg}`),
      security: (msg) => logMessage("warn", "brightYellow", `\uD83D\uDD12 ${msg}`),
      bigLog: (message, options2 = {}) => {
        const color = options2.color || "blue";
        const emoji = options2.emoji || "\uD83D\uDCE3";
        const boxed = formatter.createBox(message, color, emoji);
        console.log(boxed);
        if (config.file)
          writeToFile(boxed);
      },
      table: (data) => {
        console.table(data);
        if (config.file) {
          writeToFile(`
[TABLE DATA]
` + JSON.stringify(data, null, 2));
        }
      },
      group: (label) => console.group(label),
      groupEnd: () => console.groupEnd(),
      time: (label) => console.time(label),
      timeEnd: (label) => console.timeEnd(label),
      json: (obj, label = "") => {
        const output = label ? `${label}:
` : "";
        const formatted = output + JSON.stringify(obj, null, 2);
        console.log(config.colorize ? colors.cyan + formatted + colors.reset : formatted);
        if (config.file)
          writeToFile(formatted);
      },
      log: {
        trace: {
          dim: (msg) => logMessage("trace", "dim", msg),
          white: (msg) => logMessage("trace", "white", msg)
        },
        debug: {
          cyan: (msg) => logMessage("debug", "cyan", msg),
          blue: (msg) => logMessage("debug", "blue", msg),
          magenta: (msg) => logMessage("debug", "magenta", msg)
        },
        info: {
          blue: (msg) => logMessage("info", "blue", msg),
          cyan: (msg) => logMessage("info", "cyan", msg),
          white: (msg) => logMessage("info", "white", msg)
        },
        success: {
          green: (msg) => logMessage("success", "green", msg),
          brightGreen: (msg) => logMessage("success", "brightGreen", msg)
        },
        warn: {
          yellow: (msg) => logMessage("warn", "yellow", msg),
          brightYellow: (msg) => logMessage("warn", "brightYellow", msg)
        },
        error: {
          red: (msg) => logMessage("error", "red", msg),
          brightRed: (msg) => logMessage("error", "brightRed", msg),
          magenta: (msg) => logMessage("error", "magenta", msg)
        },
        fatal: {
          brightRed: (msg) => logMessage("fatal", "brightRed", msg),
          bgRed: (msg) => logMessage("fatal", "bgRed", msg)
        }
      },
      configure: (newConfig) => {
        Object.assign(config, newConfig);
        return logger;
      },
      getConfig: () => ({ ...config }),
      enableTime: () => {
        config.time = true;
        return logger;
      },
      disableTime: () => {
        config.time = false;
        return logger;
      },
      enableEmoji: () => {
        config.emoji = true;
        return logger;
      },
      disableEmoji: () => {
        config.emoji = false;
        return logger;
      },
      enableFile: () => {
        config.file = true;
        return logger;
      },
      disableFile: () => {
        config.file = false;
        return logger;
      },
      setLevel: (level) => {
        config.level = level;
        return logger;
      }
    };
    if (config.customLevels && Object.keys(config.customLevels).length > 0) {
      Object.entries(config.customLevels).forEach(([level, { color, emoji, priority }]) => {
        if (emoji)
          emojis[level] = emoji;
        if (priority !== undefined)
          levelPriority[level] = priority;
        logger[level] = (msg) => logMessage(level, color, msg);
        logger.log[level] = {
          [color]: (msg) => logMessage(level, color, msg)
        };
      });
    }
    return logger;
  };
  var defaultLogger = createLogger();
  module.exports = defaultLogger;
  module.exports.createLogger = createLogger;
  module.exports.setGlobalConfig = (config) => {
    Object.assign(globalConfig, config);
  };
});

// piggy/client/index.ts
import { connect } from "net";
import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { platform } from "os";

// piggy/logger/index.ts
var import_ernest_logger = __toESM(require_ernest_logger(), 1);
var logger = import_ernest_logger.createLogger({
  time: true,
  file: true,
  filePath: "./piggy.log",
  prefix: "[PIGGY]",
  emoji: true,
  level: "trace",
  customLevels: {
    info: {
      color: "blue",
      emoji: "ℹ️",
      priority: 2
    },
    success: {
      color: "green",
      emoji: "✅",
      priority: 2
    },
    error: {
      color: "red",
      emoji: "❌",
      priority: 5
    },
    warn: {
      color: "yellow",
      emoji: "⚠️",
      priority: 4
    },
    debug: {
      color: "magenta",
      emoji: "\uD83D\uDC1E",
      priority: 1
    },
    network: {
      color: "brightCyan",
      emoji: "\uD83C\uDF10",
      priority: 2
    },
    db: {
      color: "brightMagenta",
      emoji: "\uD83D\uDDC4️",
      priority: 2
    },
    security: {
      color: "brightRed",
      emoji: "\uD83D\uDD12",
      priority: 3
    }
  }
});
logger.info("logger initialized");
var logger_default = logger;

// piggy/client/index.ts
var SOCKET_PATH = platform() === "win32" ? "\\\\.\\pipe\\piggy" : "/tmp/piggy";

class PiggyClient {
  socketPath;
  socket = null;
  reqId = 0;
  pending = new Map;
  buf = "";
  eventBuffer = "";
  eventHandlers = new Map;
  globalEventHandlers = new Map;
  constructor(socketPath = SOCKET_PATH) {
    this.socketPath = socketPath;
    this.eventHandlers.set("default", new Map);
  }
  connect() {
    return new Promise((resolve, reject) => {
      logger_default.info(`Connecting to socket: ${this.socketPath}`);
      const sock = connect(this.socketPath);
      sock.setEncoding("utf8");
      sock.on("connect", () => {
        this.socket = sock;
        logger_default.success("Connected to Piggy server");
        resolve();
      });
      sock.on("data", (chunk) => {
        this.eventBuffer += chunk;
        const lines = this.eventBuffer.split(`
`);
        this.eventBuffer = lines.pop();
        for (const line of lines) {
          if (!line.trim())
            continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "event") {
              this.handleEvent(msg);
              continue;
            }
            const p = this.pending.get(msg.id);
            if (p) {
              this.pending.delete(msg.id);
              msg.ok ? p.resolve(msg.data) : p.reject(new Error(msg.data ?? "command failed"));
            }
          } catch {
            logger_default.error(`Bad JSON from server: ${line}`);
          }
        }
      });
      sock.on("error", (e) => {
        for (const p of this.pending.values())
          p.reject(e);
        this.pending.clear();
        reject(e);
      });
      sock.on("close", () => {
        for (const p of this.pending.values())
          p.reject(new Error("Socket closed"));
        this.pending.clear();
      });
    });
  }
  handleEvent(event) {
    if (event.event === "exposed_call") {
      const { tabId, name, callId, data } = event;
      const effectiveTabId = tabId || "default";
      const handlers = this.eventHandlers.get(effectiveTabId);
      const handler = handlers?.get(name);
      if (handler) {
        let parsedData;
        try {
          parsedData = JSON.parse(data || "null");
        } catch {
          parsedData = data;
        }
        Promise.resolve(handler(parsedData)).then((response) => {
          if (response && typeof response === "object" && "success" in response) {
            this.send("exposed.result", {
              tabId: effectiveTabId,
              callId,
              result: response.success ? JSON.stringify(response.result) : response.error || "Unknown error",
              isError: !response.success
            }).catch((e) => logger_default.error(`Failed to send exposed result: ${e}`));
          } else {
            this.send("exposed.result", {
              tabId: effectiveTabId,
              callId,
              result: JSON.stringify(response),
              isError: false
            }).catch((e) => logger_default.error(`Failed to send exposed result: ${e}`));
          }
        }).catch((err) => {
          this.send("exposed.result", {
            tabId: effectiveTabId,
            callId,
            result: err.message || "Handler error",
            isError: true
          }).catch((e) => logger_default.error(`Failed to send exposed error: ${e}`));
        });
      } else {
        logger_default.warn(`No handler for exposed function: ${name} in tab ${effectiveTabId}`);
      }
      return;
    }
    if (event.event === "navigate") {
      const handlers = this.globalEventHandlers.get(`navigate:${event.tabId}`);
      if (handlers) {
        for (const h of handlers) {
          try {
            h(event.url);
          } catch (e) {
            logger_default.error(`navigate handler error: ${e}`);
          }
        }
      }
      const wildcard = this.globalEventHandlers.get("navigate:*");
      if (wildcard) {
        for (const h of wildcard) {
          try {
            h({ url: event.url, tabId: event.tabId });
          } catch {}
        }
      }
      return;
    }
  }
  onEvent(eventName, tabId, handler) {
    const key = `${eventName}:${tabId}`;
    if (!this.globalEventHandlers.has(key)) {
      this.globalEventHandlers.set(key, new Set);
    }
    this.globalEventHandlers.get(key).add(handler);
    return () => this.globalEventHandlers.get(key)?.delete(handler);
  }
  disconnect() {
    this.socket?.destroy();
    this.socket = null;
  }
  send(cmd, payload = {}) {
    return new Promise((resolve, reject) => {
      if (!this.socket)
        return reject(new Error("Not connected"));
      const id = String(++this.reqId);
      this.pending.set(id, { resolve, reject });
      this.socket.write(JSON.stringify({ id, cmd, payload }) + `
`);
    });
  }
  async newTab() {
    return this.send("tab.new", {});
  }
  async closeTab(tabId) {
    await this.send("tab.close", { tabId });
  }
  async listTabs() {
    return this.send("tab.list", {});
  }
  async navigate(url, tabId = "default") {
    await this.send("navigate", { url, tabId });
  }
  async reload(tabId = "default") {
    await this.send("reload", { tabId });
  }
  async goBack(tabId = "default") {
    await this.send("go.back", { tabId });
  }
  async goForward(tabId = "default") {
    await this.send("go.forward", { tabId });
  }
  async getTitle(tabId = "default") {
    return this.send("page.title", { tabId });
  }
  async getUrl(tabId = "default") {
    return this.send("page.url", { tabId });
  }
  async content(tabId = "default") {
    return this.send("page.content", { tabId });
  }
  async evaluate(js, tabId = "default") {
    return this.send("evaluate", { js, tabId });
  }
  async addInitScript(js, tabId = "default") {
    await this.send("addInitScript", { js, tabId });
  }
  async click(selector, tabId = "default") {
    return this.send("click", { selector, tabId });
  }
  async doubleClick(selector, tabId = "default") {
    return this.send("dblclick", { selector, tabId });
  }
  async hover(selector, tabId = "default") {
    return this.send("hover", { selector, tabId });
  }
  async type(selector, text, tabId = "default") {
    return this.send("type", { selector, text, tabId });
  }
  async select(selector, value, tabId = "default") {
    return this.send("select", { selector, value, tabId });
  }
  async keyPress(key, tabId = "default") {
    return this.send("keyboard.press", { key, tabId });
  }
  async keyCombo(combo, tabId = "default") {
    return this.send("keyboard.combo", { combo, tabId });
  }
  async mouseMove(x, y, tabId = "default") {
    return this.send("mouse.move", { x, y, tabId });
  }
  async mouseDrag(from, to, tabId = "default") {
    return this.send("mouse.drag", { from, to, tabId });
  }
  async scrollTo(selector, tabId = "default") {
    return this.send("scroll.to", { selector, tabId });
  }
  async scrollBy(px, tabId = "default") {
    return this.send("scroll.by", { px, tabId });
  }
  async fetchText(query, tabId = "default") {
    return this.send("fetch.text", { query, tabId });
  }
  async fetchLinks(query, tabId = "default") {
    if (query === "a" || query === "body") {
      const result2 = await this.send("fetch.links.all", { tabId });
      return Array.isArray(result2) ? result2 : [];
    }
    const result = await this.send("fetch.links", { query, tabId });
    return Array.isArray(result) ? result : [];
  }
  async fetchImages(query, tabId = "default") {
    const result = await this.send("fetch.image", { query, tabId });
    return Array.isArray(result) ? result : [];
  }
  async searchCss(query, tabId = "default") {
    return this.send("search.css", { query, tabId });
  }
  async searchId(query, tabId = "default") {
    return this.send("search.id", { query, tabId });
  }
  async waitForSelector(selector, timeout = 30000, tabId = "default") {
    await this.send("wait.selector", { selector, timeout, tabId });
  }
  async waitForNavigation(tabId = "default") {
    await this.send("wait.navigation", { tabId });
  }
  async waitForResponse(urlPattern, timeout = 30000, tabId = "default") {
    await this.send("wait.response", { url: urlPattern, timeout, tabId });
  }
  async screenshot(filePath, tabId = "default") {
    const b64 = await this.send("screenshot", { tabId });
    if (filePath) {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, Buffer.from(b64, "base64"));
    }
    return filePath ?? b64;
  }
  async pdf(filePath, tabId = "default") {
    const b64 = await this.send("pdf", { tabId });
    if (filePath) {
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, Buffer.from(b64, "base64"));
    }
    return filePath ?? b64;
  }
  async blockImages(tabId = "default") {
    await this.send("intercept.block.images", { tabId });
  }
  async unblockImages(tabId = "default") {
    await this.send("intercept.unblock.images", { tabId });
  }
  async setCookie(name, value, domain, path = "/", tabId = "default") {
    await this.send("cookie.set", { name, value, domain, path, tabId });
  }
  async getCookie(name, tabId = "default") {
    return this.send("cookie.get", { name, tabId });
  }
  async deleteCookie(name, tabId = "default") {
    await this.send("cookie.delete", { name, tabId });
  }
  async listCookies(tabId = "default") {
    return this.send("cookie.list", { tabId });
  }
  async addInterceptRule(action, pattern, options = {}, tabId = "default") {
    await this.send("intercept.rule.add", { action, pattern, ...options, tabId });
  }
  async clearInterceptRules(tabId = "default") {
    await this.send("intercept.rule.clear", { tabId });
  }
  async captureStart(tabId = "default") {
    await this.send("capture.start", { tabId });
  }
  async captureStop(tabId = "default") {
    await this.send("capture.stop", { tabId });
  }
  async captureRequests(tabId = "default") {
    return this.send("capture.requests", { tabId });
  }
  async captureWs(tabId = "default") {
    return this.send("capture.ws", { tabId });
  }
  async captureCookies(tabId = "default") {
    return this.send("capture.cookies", { tabId });
  }
  async captureStorage(tabId = "default") {
    return this.send("capture.storage", { tabId });
  }
  async captureClear(tabId = "default") {
    await this.send("capture.clear", { tabId });
  }
  async sessionExport(tabId = "default") {
    return this.send("session.export", { tabId });
  }
  async sessionImport(data, tabId = "default") {
    await this.send("session.import", { data, tabId });
  }
  async exposeFunction(name, handler, tabId = "default") {
    if (!this.eventHandlers.has(tabId))
      this.eventHandlers.set(tabId, new Map);
    this.eventHandlers.get(tabId).set(name, async (data) => {
      try {
        const result = await handler(data);
        if (result && typeof result === "object" && (("success" in result) || ("error" in result)))
          return result;
        return { success: true, result };
      } catch (err) {
        return { success: false, error: err.message || String(err) };
      }
    });
    await this.send("expose.function", { name, tabId });
    logger_default.success(`[${tabId}] exposed function: ${name}`);
  }
  async unexposeFunction(name, tabId = "default") {
    const handlers = this.eventHandlers.get(tabId);
    if (handlers)
      handlers.delete(name);
    logger_default.info(`[${tabId}] unexposed function: ${name}`);
  }
  async clearExposedFunctions(tabId = "default") {
    this.eventHandlers.set(tabId, new Map);
    logger_default.info(`[${tabId}] cleared all exposed functions`);
  }
}
export {
  PiggyClient
};
