/** @format */

import { spawn } from 'node:child_process';
import path from 'node:path';

import { Chunking } from '../utils/Chunking.js';
import { sanitize } from '../utils/sanitize.js';
import { CodeBlock } from '../utils/codeBlock.js';
import { Paginator } from '../utils/paginator.js';

import type { Client } from 'discord.js';
import type { Context } from '../interface/Context.js';

const UPDATE_INTERVAL = 800;
const HARD_TIMEOUT = 3 * 60 * 1000;
const MAX_BUFFER = 50_000;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function getShell() {
  if (process.platform === 'win32') {
    return {
      cmd: 'powershell.exe',
      args: [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '& { ' +
          '$ErrorActionPreference = "Continue"; ' +
          'try { ' +
          'iex $args[0]; ' +
          'exit $LASTEXITCODE ' +
          '} catch { ' +
          'Write-Error $_; ' +
          'exit 1 ' +
          '} ' +
          '}'
      ]
    };
  }

  return {
    cmd: process.env.SHELL || '/bin/bash',
    args: ['-c']
  };
}

function normalizePaths(text: string): string {
  return text.replace(/([A-Za-z]:\\[^\s\n\r]+|\/[^\s\n\r]+)/g, (p) => path.basename(p));
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

export const shell = async (client: Client, rawCode: string | undefined, ctx: Context) => {
  const { message } = ctx;

  if (!rawCode) {
    await message.reply('[ EvalEngine ] Missing command to execute.');
    return;
  }

  const parsed = CodeBlock.parse(rawCode);
  const input = (parsed?.content ?? rawCode).trim();

  let buffer = `$ ${input}\n\n`;
  let sent = '';
  let exited = false;

  const append = (text: string) => {
    buffer += text;
    if (buffer.length > MAX_BUFFER) {
      buffer = buffer.slice(-MAX_BUFFER);
    }
  };

  const pages = Chunking(buffer);

  const { cmd, args } = getShell();

  const proc = spawn(cmd, [...args, input], {
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
    env: {
      ...process.env,
      TERM: 'dumb'
    }
  });

  proc.stdin.end();

  const paginator = new Paginator(message, pages, 'sh', 120_000, () => {
    if (!proc.killed) {
      proc.kill(process.platform === 'win32' ? 'SIGTERM' : 'SIGKILL');
      exited = true;
      append('\n[status] process killed by user\n');
    }
  });

  await paginator.init();

  proc.stdout.on('data', (d) => append(d.toString()));
  proc.stderr.on('data', (d) => append(`[stderr] ${d.toString()}`));

  proc.on('error', (err) => {
    exited = true;
    append(`[error] ${err.message}\n`);
    paginator.markProcessKilled();
  });

  proc.on('exit', (code, signal) => {
    exited = true;
    append(`\n[status] process exited with ${signal ?? `code ${code}`}\n`);
    paginator.markProcessKilled();
  });

  const killer = setTimeout(() => {
    if (!exited) {
      proc.kill();
      exited = true;
      append('\n[status] process killed by timeout\n');
      paginator.markProcessKilled();
    }
  }, HARD_TIMEOUT);

  async function updateLoop(): Promise<void> {
    const cleaned = normalizeWhitespace(normalizePaths(buffer));
    const sanitized = String(sanitize(cleaned, ctx.secrets, client.token));

    if (sanitized !== sent || exited) {
      sent = sanitized;
      paginator.updatePages(Chunking(sanitized));
    }

    if (exited) {
      clearTimeout(killer);
      return;
    }

    await sleep(UPDATE_INTERVAL);
    return updateLoop();
  }

  await updateLoop();
};
