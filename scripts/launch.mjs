import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const bin = join(root, 'node_modules', '.bin', 'pondoknusa');
const args = process.argv.slice(2);
const production = args.includes('--production');
const forwarded = args.filter((arg) => arg !== '--production');
const host = process.env.PONDOKNUSA_HOST || '127.0.0.1';
const port = process.env.PONDOKNUSA_PORT || '3000';
const url = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}/`;
const openBrowser = process.env.OPEN_BROWSER !== '0';

const child = spawn(
  bin,
  production ? ['start', ...forwarded] : ['dev', '--no-queue', ...forwarded],
  {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  },
);

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

if (openBrowser) {
  waitForServer(url)
    .then(() => open(url))
    .catch(() => {
      console.error(`Server did not become ready at ${url}`);
    });
}

async function waitForServer(target, timeoutMs = 20_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(target, { redirect: 'manual' });
      if (response.status < 500) {
        return;
      }
    } catch {
      // Server is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('timeout');
}

function open(target) {
  const platform = process.platform;
  if (platform === 'darwin') {
    execFile('open', [target], { stdio: 'ignore' });
    return;
  }
  if (platform === 'win32') {
    execFile('cmd', ['/c', 'start', '', target], { stdio: 'ignore' });
    return;
  }
  execFile('xdg-open', [target], { stdio: 'ignore' });
}
