/** @format */

import path from 'node:path';
import util from 'node:util';
import { readFile } from 'node:fs/promises';
import { sanitize } from '../utils/sanitize.js';
import { Chunking } from '../utils/Chunking.js';
import { Paginator } from '../utils/paginator.js';

import type { Client } from 'discord.js';
import type { Context } from '../interface/Context.js';

const BASE_DIR = process.cwd();

export const cat = async (client: Client, filePath: string | undefined, ctx: Context) => {
  const { message } = ctx;

  if (!filePath) {
    await message.reply({ content: '[ EvalEngine ] Missing path.' });
    return;
  }

  try {
    const resolved = path.resolve(BASE_DIR, filePath);

    if (!resolved.startsWith(BASE_DIR)) {
      await message.reply('[ EvalEngine ] Access denied.');
      return;
    }

    const content = await readFile(resolved, 'utf8');
    const sanitized = sanitize(content, ctx.secrets, client.token);

    const output =
      typeof sanitized === 'string'
        ? sanitized
        : util.inspect(sanitized, {
            depth: Infinity,
            maxArrayLength: Infinity,
            breakLength: 80,
            compact: false
          });

    const pages = Chunking(output);
    const paginator = new Paginator(message, pages, 'js');
    await paginator.init();
  } catch (err: unknown) {
    const pages = Chunking(util.inspect(err, { depth: Infinity }));
    const paginator = new Paginator(message, pages, 'js');
    await paginator.init();
  }
};
