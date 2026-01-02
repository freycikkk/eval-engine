/** @format */

import util from 'node:util';
import { sanitize } from '../utils/sanitize.js';
import { Chunking } from '../utils/Chunking.js';
import { Paginator } from '../utils/paginator.js';

import type { Client } from 'discord.js';
import type { Context } from '../interface/Context.js';

const MAX_BYTES = 1_000_000;

export const curl = async (client: Client, input: string | undefined, ctx: Context) => {
  const { message } = ctx;

  if (!input) {
    await message.reply({ content: '[ EvalEngine ] Missing url to curl.' });
    return;
  }

  try {
    const url = new URL(input);

    if (!['http:', 'https:'].includes(url.protocol)) {
      await message.reply('[ EvalEngine ] Only http/https URLs are allowed.');
      return;
    }

    const host = url.hostname;
    if (
      host === 'localhost' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('172.')
    ) {
      await message.reply('[ EvalEngine ] Access to private networks is blocked.');
      return;
    }

    const res = await globalThis.fetch(url.toString());

    if (!res.ok) {
      await message.reply(`[ EvalEngine ] HTTP ${res.status}: ${res.statusText}`);
      return;
    }

    const text = await res.text();

    if (text.length > MAX_BYTES) {
      await message.reply('[ EvalEngine ] Response too large.');
      return;
    }

    const sanitized = sanitize(text, ctx.secrets, client.token);

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
  } catch (err) {
    const pages = Chunking(util.inspect(err, { depth: Infinity }));
    const paginator = new Paginator(message, pages, 'js');
    await paginator.init();
  }
};
