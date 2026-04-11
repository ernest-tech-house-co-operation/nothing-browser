import { spawn } from 'bun';
import { execSync } from 'child_process';
import { detectBinary, type BinaryMode } from './detect';
import logger from '../logger';

let activeProcess: any = null;
const extraProcesses: any[] = [];

export function killAllBrowsers(): void {
  try {
    logger.info('Cleaning up existing browser processes...');
    execSync('pkill -f nothing-browser-headless 2>/dev/null || true', { stdio: 'ignore' });
    execSync('pkill -f nothing-browser-headful 2>/dev/null || true', { stdio: 'ignore' });
    execSync('pkill -f QtWebEngineProcess 2>/dev/null || true', { stdio: 'ignore' });
    execSync('rm -f /tmp/piggy', { stdio: 'ignore' });
  } catch {
    // no processes to kill
  }
}

export async function spawnBrowser(mode: BinaryMode = 'headless'): Promise<string> {
  killAllBrowsers();
  await new Promise(resolve => setTimeout(resolve, 500));

  const binaryPath = detectBinary(mode);
  if (!binaryPath) {
    throw new Error(`Binary not found (${mode}). Cannot launch.`);
  }

  logger.info(`Spawning Nothing Browser (${mode}) from: ${binaryPath}`);

  activeProcess = spawn([binaryPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  if (activeProcess.stdout) {
    const reader = activeProcess.stdout.getReader();
    const read = async () => {
      const { done, value } = await reader.read();
      if (!done) {
        logger.debug(`[Browser] ${new TextDecoder().decode(value)}`);
        read();
      }
    };
    read();
  }

  activeProcess.exited.then((code: number | null) => {
    logger.warn(`Browser process exited with code: ${code}`);
    activeProcess = null;
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  if (activeProcess) {
    logger.success(`Browser spawned and running (${mode})`);
  } else {
    logger.error('Browser started but exited immediately');
  }

  return binaryPath;
}

export async function spawnBrowserOnSocket(
  socketName: string,
  mode: BinaryMode = 'headless'
): Promise<void> {
  const binaryPath = detectBinary(mode);
  if (!binaryPath) {
    throw new Error(`Binary not found (${mode}). Cannot launch.`);
  }

  logger.info(`Spawning browser (${mode}) on socket: ${socketName}`);

  const proc = spawn([binaryPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PIGGY_SOCKET: socketName },
  });

  extraProcesses.push(proc);

  proc.exited.then((code: number | null) => {
    logger.warn(`Browser on socket ${socketName} exited with code: ${code}`);
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
  logger.success(`Browser spawned (${mode}) on socket: ${socketName}`);
}

export function killBrowser(): void {
  if (activeProcess) {
    logger.info('Killing browser process...');
    activeProcess.kill();
    activeProcess = null;
  }
  for (const proc of extraProcesses) proc.kill();
  extraProcesses.length = 0;
}