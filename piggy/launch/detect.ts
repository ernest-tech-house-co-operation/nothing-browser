import { existsSync } from 'fs';
import { join } from 'path';
import logger from '../logger';

export function detectBinary(): string | null {
    const cwd = process.cwd();
    
    // Windows
    const windowsPath = join(cwd, 'nothing-browser-headless.exe');
    if (process.platform === 'win32' && existsSync(windowsPath)) {
        logger.success(`Binary found! Platform: Windows`);
        return windowsPath;
    }
    
    // Linux / macOS
    const unixPath = join(cwd, 'nothing-browser-headless');
    if (existsSync(unixPath)) {
        logger.success(`Binary found at: ${unixPath}`);
        return unixPath;
    }
    
    logger.error("❌ Binary not found in project root");
    logger.error("");
    logger.error("Download from:");
    logger.error("  https://github.com/BunElysiaReact/nothing-browser/releases/");
    logger.error("");
    logger.error(`Place in: ${cwd}/nothing-browser-headless${process.platform === 'win32' ? '.exe' : ''}`);
    if (process.platform !== 'win32') {
        logger.error("Then run: chmod +x nothing-browser-headless");
    }
    
    return null;
}