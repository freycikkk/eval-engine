/** @format */

import { ShardClientUtil } from 'discord.js';
import { ClusterClient } from 'discord-hybrid-sharding';

import type { Client } from 'discord.js';

function findClusterClient(obj: unknown, visited = new WeakSet<object>()): ClusterClient<Client> | undefined {
  if (obj === null || typeof obj !== 'object') return;

  if (visited.has(obj)) return;
  visited.add(obj);

  if (obj instanceof ClusterClient) return obj as ClusterClient<Client>;

  for (const value of Object.values(obj as Record<string, unknown>)) {
    const found = findClusterClient(value, visited);
    if (found) return found;
  }

  return;
}

export function detectShard(client: Client): {
  shardType: 'hybrid' | 'djs' | 'none';
  cluster?: ClusterClient<Client>;
} {
  const cluster = findClusterClient(client);
  if (cluster) return { shardType: 'hybrid', cluster };
  if (client.shard instanceof ShardClientUtil) return { shardType: 'djs' };
  return { shardType: 'none' };
}
