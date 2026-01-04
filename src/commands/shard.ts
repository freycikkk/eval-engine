/** @format */

import util from 'node:util';
import { sanitize } from '../utils/sanitize.js';
import { Chunking } from '../utils/Chunking.js';
import { CodeBlock } from '../utils/codeBlock.js';
import { Paginator } from '../utils/paginator.js';

import type { Client } from 'discord.js';
import type { Context } from '../interface/Context.js';
import type { EngineClient } from '../interface/EngineClient.js';

export const shard = async (client: Client, ctx: Context, rawCode: string | undefined) => {
  const { message } = ctx;

  if (!rawCode) {
    await message.reply({ content: '[ EvalEngine ] Missing code to execute.' });
    return;
  }

  const engineClient = client as EngineClient;
  const meta = engineClient.__evalEngine;

  if (!meta || meta.shardType === 'none') {
    await message.reply({ content: '[ EvalEngine ] Shard manager not found.' });
    return;
  }

  const parsed = CodeBlock.parse(rawCode);
  const code = parsed?.content ?? rawCode;

  try {
    const evalFn = Function('client', `"use strict"; return (async () => { return ${code} })();`) as (
      client: Client<boolean>
    ) => Promise<unknown>;

    let results: unknown[];

    if (meta.shardType === 'hybrid') {
      if (!meta.cluster) throw new Error('[ EvalEngine ] Cluster manager not ready.');
      results = await meta.cluster.broadcastEval(evalFn);
    } else {
      if (!client.shard) throw new Error('[ EvalEngine ] Shard manager not ready.');
      results = await client.shard.broadcastEval(evalFn);
    }

    const valid = results.filter((v) => v !== undefined);

    let total: unknown = valid;

    if (valid.length && valid.every((v) => typeof v === 'number')) {
      total = valid.reduce((a, b) => (a as number) + (b as number), 0);
    } else if (valid.length && valid.every((v) => Array.isArray(v))) {
      total = valid.flat();
    }

    const output = [
      '// TOTAL',
      util.inspect(total, {
        depth: Infinity,
        maxArrayLength: Infinity,
        breakLength: 80,
        compact: false
      }),
      '',
      ...results.map(
        (value, index) =>
          `// #${index} ${meta.shardType === 'hybrid' ? 'CLUSTER' : 'SHARD'}\n` +
          util.inspect(value, {
            depth: Infinity,
            maxArrayLength: Infinity,
            breakLength: 80,
            compact: false
          })
      )
    ].join('\n\n');

    const sanitized = sanitize(output, ctx.secrets, client.token);

    const text =
      typeof sanitized === 'string'
        ? sanitized
        : util.inspect(sanitized, {
            depth: Infinity,
            maxArrayLength: Infinity,
            breakLength: 80,
            compact: false
          });

    const pages = Chunking(text);
    const paginator = new Paginator(message, pages, 'js');
    await paginator.init();
  } catch (err: unknown) {
    const sanitized = sanitize(err, ctx.secrets, client.token);
    const output = typeof sanitized === 'string' ? sanitized : util.inspect(sanitized, { depth: Infinity });

    const pages = Chunking(output);
    const paginator = new Paginator(message, pages, 'js');
    await paginator.init();
  }
};
