// piggy/launch/spawn.ts
import { spawn as nodeSpawn } from "child_process";
import { execSync } from "child_process";
import { platform } from "os";
import { detectBinary, type BinaryMode } from "./detect";
import logger from "../logger";

let activeProcess: any = null;
const extraProcesses: any[] = [];

// Runtime detection without importing "bun" at build time
const isBun = typeof (globalThis as any).Bun !== 'undefined';

export function killAllBrowsers(): void {
  try {
    logger.info('Cleaning up existing browser processes...');
    
    if (platform() === 'win32') {
      execSync('taskkill /F /IM nothing-browser-headless.exe 2>nul || true', { stdio: 'ignore' });
      execSync('taskkill /F /IM nothing-browser-headful.exe 2>nul || true', { stdio: 'ignore' });
      execSync('taskkill /F /IM QtWebEngineProcess.exe 2>nul || true', { stdio: 'ignore' });
    } else {
      execSync('pkill -f nothing-browser-headless 2>/dev/null || true', { stdio: 'ignore' });
      execSync('pkill -f nothing-browser-headful 2>/dev/null || true', { stdio: 'ignore' });
      execSync('pkill -f QtWebEngineProcess 2>/dev/null || true', { stdio: 'ignore' });
      execSync('rm -f /tmp/piggy', { stdio: 'ignore' });
    }
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

  if (isBun) {
    // Bun runtime - use Bun.spawn
    const Bun = (globalThis as any).Bun;
    activeProcess = Bun.spawn([binaryPath], {
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
  } else {
    // Node.js runtime
    activeProcess = nodeSpawn(binaryPath, [], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });

    if (activeProcess.stdout) {
      activeProcess.stdout.on('data', (data: Buffer) => {
        logger.debug(`[Browser] ${data.toString()}`);
      });
    }

    if (activeProcess.stderr) {
      activeProcess.stderr.on('data', (data: Buffer) => {
        logger.debug(`[Browser Error] ${data.toString()}`);
      });
    }

    activeProcess.on('exit', (code: number | null) => {
      logger.warn(`Browser process exited with code: ${code}`);
      activeProcess = null;
    });
  }

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

  if (isBun) {
    // Bun runtime
    const Bun = (globalThis as any).Bun;
    const proc = Bun.spawn([binaryPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PIGGY_SOCKET: socketName },
    });

    extraProcesses.push(proc);

    proc.exited.then((code: number | null) => {
      logger.warn(`Browser on socket ${socketName} exited with code: ${code}`);
    });
  } else {
    // Node.js runtime
    const proc = nodeSpawn(binaryPath, [], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PIGGY_SOCKET: socketName },
    });

    extraProcesses.push(proc);

    proc.on('exit', (code: number | null) => {
      logger.warn(`Browser on socket ${socketName} exited with code: ${code}`);
    });
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  logger.success(`Browser spawned (${mode}) on socket: ${socketName}`);
}

export function killBrowser(): void {
  if (activeProcess) {
    logger.info('Killing browser process...');
    if (isBun) {
      activeProcess.kill();
    } else {
      activeProcess.kill('SIGTERM');
    }
    activeProcess = null;
  }
  
  for (const proc of extraProcesses) {
    if (isBun) {
      proc.kill();
    } else {
      proc.kill('SIGTERM');
    }
  }
  extraProcesses.length = 0;
}