/** @format */

import util from 'node:util';
import { sanitize } from '../utils/sanitize.js';
import { Chunking } from '../utils/Chunking.js';
import { CodeBlock } from '../utils/codeBlock.js';
import { Paginator } from '../utils/paginator.js';

import type { Client } from 'discord.js';
import type { Context } from '../interface/Context.js';

export const js = async (client: Client, ctx: Context, rawCode: string | undefined) => {
  const { message } = ctx;

  if (!rawCode) {
    await message.reply({ content: '[ EvalEngine ] Missing code to execute.' });
    return;
  }

  const parsed = CodeBlock.parse(rawCode);
  const code = parsed?.content ?? rawCode;

  try {
    let result: unknown = await eval(code);
    if (typeof result === 'function') result = result.toString();
    const sanitized = sanitize(result, ctx.secrets, client.token);

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
