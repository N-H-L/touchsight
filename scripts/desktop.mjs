// Launch the TouchSight-NG application in a Neutralino desktop window.
//
// This starts scripts/serve.mjs (the static server for src/), waits for it to
// accept connections, then runs the Neutralino binary in
// desktop/neutralino/ pointed at http://localhost:5173/. When the Neutralino
// window closes, the static server is shut down.
//
// Prerequisites:
//   npm install          (installs @neutralinojs/neu as a dev dependency)
//   npx neu update      (once, downloads the Neutralino binaries into
//                        desktop/neutralino/bin/, which is git-ignored)
//
// Usage:
//   npm run desktop
import { spawn } from 'node:child_process';
import { connect } from 'node:net';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const neutralinoDir = join(repoRoot, 'desktop', 'neutralino');
const port = Number(process.env.PORT || 5173);

function waitForServer(port, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const socket = connect(port, '127.0.0.1');
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() > deadline) {
          reject(new Error('Static server did not start before timeout.'));
        } else {
          setTimeout(tryOnce, 250);
        }
      });
    };
    tryOnce();
  });
}

const server = spawn(process.execPath, [join(repoRoot, 'scripts', 'serve.mjs')], {
  stdio: 'inherit',
  env: { ...process.env, PORT: String(port) },
});

let neu;
try {
  await waitForServer(port);
  // PATH must include the local npm binaries so "neu" from the dev dependency
  // is discoverable on Windows, macOS, and Linux.
  neu = spawn('neu', ['run', '--', '--path=' + neutralinoDir], {
    cwd: neutralinoDir,
    stdio: 'inherit',
    env: { ...process.env, PATH: join(repoRoot, 'node_modules', '.bin') + (process.platform === 'win32' ? ';' : ':') + (process.env.PATH || '') },
  });
} catch (error) {
  console.error(error.message);
  server.kill();
  process.exit(1);
}

const shutdown = () => {
  neu && neu.kill();
  server.kill();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
neu.on('exit', shutdown);
neu.on('error', (error) => {
  console.error('Failed to launch Neutralino. Run "npx neu update" inside desktop/neutralino first.');
  console.error(error.message);
  server.kill();
  process.exit(1);
});
