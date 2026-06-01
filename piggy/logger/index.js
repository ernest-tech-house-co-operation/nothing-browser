
//piggy/logger/index.ts
import { createLogger } from "ernest-logger";

const logger = createLogger({
    time: true,
    file: true,
    filePath: './piggy.log',
    prefix: '[PIGGY]',
    emoji: true,
    level: 'trace',
    customLevels: {
        info: {
            color: 'blue',
            emoji: 'ℹ️',
            priority: 2
        },
        success: {
            color: 'green',
            emoji: '✅',
            priority: 2
        },
        error: {
            color: 'red',
            emoji: '❌',
            priority: 5
        },
        warn: {
            color: 'yellow',
            emoji: '⚠️',
            priority: 4
        },
        debug: {
            color: 'magenta',
            emoji: '🐞',
            priority: 1
        },
        network: {
            color: 'brightCyan',
            emoji: '🌐',
            priority: 2
        },
        db: {
            color: 'brightMagenta',
            emoji: '🗄️',
            priority: 2
        },
        security: {
            color: 'brightRed',
            emoji: '🔒',
            priority: 3
        }
    }
});

// Now these methods exist with your custom colors
logger.info("logger initialized");      // Blue with ℹ️

export default logger;