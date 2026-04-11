import { existsSync } from 'fs';
import { join } from 'path';
import logger from '../logger';

export type BinaryMode = 'headless' | 'headful';

const BINARY_NAMES: Record<BinaryMode, string> = {
  headless: 'nothing-browser-headless',
  headful:  'nothing-browser-headful',
};

export function detectBinary(mode: BinaryMode = 'headless'): string | null {
  const cwd = process.cwd();
  const name = BINARY_NAMES[mode];

  // Windows
  if (process.platform === 'win32') {
    const p = join(cwd, `${name}.exe`);
    if (existsSync(p)) {
      logger.success(`Binary found (${mode}): ${p}`);
      return p;
    }
  }

  // Linux / macOS
  const p = join(cwd, name);
  if (existsSync(p)) {
    logger.success(`Binary found (${mode}): ${p}`);
    return p;
  }

  logger.error(`❌ Binary not found in project root: ${name}`);
  logger.error('');
  logger.error('Download from:');
  logger.error('  https://github.com/BunElysiaReact/nothing-browser/releases/');
  logger.error('');
  logger.error(`Place in: ${cwd}/${name}${process.platform === 'win32' ? '.exe' : ''}`);
  if (process.platform !== 'win32') {
    logger.error(`Then run: chmod +x ${name}`);
  }

  return null;
}