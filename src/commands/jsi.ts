/** @format */

import util from 'node:util';
import { sanitize } from '../utils/sanitize.js';
import { Chunking } from '../utils/Chunking.js';
import { CodeBlock } from '../utils/codeBlock.js';
import { Paginator } from '../utils/paginator.js';

import type { Client } from 'discord.js';
import type { Context } from '../interface/Context.js';

function getConstructorName(value: unknown): string | null {
  if (value && typeof value === 'object') {
    return value.constructor?.name ?? null;
  }
  return null;
}

function getSizeInfo(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') return { length: value.length };
  if (Array.isArray(value)) return { length: value.length };
  if (value instanceof Map || value instanceof Set) return { size: value.size };
  if (value && typeof value === 'object') return { keys: Object.keys(value).length };
  return {};
}

export const jsi = async (client: Client, rawCode: string | undefined, ctx: Context) => {
  const { message } = ctx;

  if (!rawCode) {
    await message.reply({ content: '[ EvalEngine ] Missing code to execute.' });
    return;
  }

  const parsed = CodeBlock.parse(rawCode);
  const code = parsed?.content ?? rawCode;

  try {
    const result = await eval(code);
    const sanitized = sanitize(result, ctx.secrets, client.token);

    const type = typeof sanitized;
    const ctor = getConstructorName(sanitized);
    const sizeInfo = getSizeInfo(sanitized);

    const preview =
      typeof sanitized === 'string'
        ? sanitized
        : util.inspect(sanitized, {
            depth: Infinity,
            maxArrayLength: Infinity,
            breakLength: 80,
            compact: false
          });

    const summary = [
      '=== JS INSPECT ===',
      '',
      `Type        : ${type}`,
      `Constructor : ${ctor ?? 'null'}`,
      ...Object.entries(sizeInfo).map(([k, v]) => `${k.padEnd(12)}: ${v}`),
      '',
      '--- Result ---',
      preview
    ].join('\n');

    const pages = Chunking(summary);
    const paginator = new Paginator(message, pages, 'prolog');
    await paginator.init();
  } catch (err) {
    const pages = Chunking(util.inspect(err, { depth: Infinity }));
    const paginator = new Paginator(message, pages, 'js');
    await paginator.init();
  }
};
