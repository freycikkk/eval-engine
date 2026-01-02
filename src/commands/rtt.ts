/** @format */

import WebSocket from 'ws';

import type { Client } from 'discord.js';
import type { Context } from '../interface/Context.js';

export const rtt = async (client: Client, ctx: Context) => {
  const { message } = ctx;

  let output = '[ EvalEngine ] Calculating round-trip time...\n';
  const statusMsg = await message.reply(output);

  const latencies: number[] = [];

  for (let i = 1; i <= 5; i++) {
    const latency = await measureGatewayRTT();

    if (latency !== null) {
      latencies.push(latency);
      output += `\nReading ${i}: ${latency}ms`;
    } else {
      output += `\nReading ${i}: Failed`;
    }

    if (i < 5) {
      await statusMsg.edit(output);
    }
  }

  if (!latencies.length) {
    await statusMsg.edit(output + '\n\nAll readings failed.');
    return;
  }

  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  const stdDev = Math.sqrt(latencies.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / latencies.length);

  output += `\n\nAverage Gateway RTT: ${avg.toFixed(2)}ms ± ${stdDev.toFixed(2)}ms`;
  output += `\nClient WS Ping: ${client.ws.ping}ms`;

  await statusMsg.edit(output);
};

function measureGatewayRTT(): Promise<number | null> {
  return new Promise((resolve) => {
    const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
    const start = Date.now();

    const timeout = setTimeout(() => {
      ws.terminate();
      resolve(null);
    }, 5_000);

    ws.once('message', () => {
      clearTimeout(timeout);
      const end = Date.now();
      ws.close();
      resolve(end - start);
    });

    ws.once('error', () => {
      clearTimeout(timeout);
      ws.terminate();
      resolve(null);
    });
  });
}
