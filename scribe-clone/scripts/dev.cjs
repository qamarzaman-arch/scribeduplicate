const { spawn } = require('node:child_process');
const path = require('node:path');

const vitePackagePath = require.resolve('vite/package.json');
const viteEntry = path.join(path.dirname(vitePackagePath), 'bin', 'vite.js');
const suppressedLine = /^ERROR: The process "\d+" not found\.\s*$/i;

function pipeStream(stream, target) {
  let buffer = '';

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!suppressedLine.test(line)) {
        target.write(`${line}\n`);
      }
    }
  });

  stream.on('end', () => {
    if (buffer && !suppressedLine.test(buffer)) {
      target.write(buffer);
    }
  });
}

const child = spawn(process.execPath, [viteEntry], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['inherit', 'pipe', 'pipe'],
  windowsHide: false,
});

pipeStream(child.stdout, process.stdout);
pipeStream(child.stderr, process.stderr);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
