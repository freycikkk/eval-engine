/** @format */

import { ClusterClient } from 'discord-hybrid-sharding';
import type { Client } from 'discord.js';

function findClusterClient(obj: unknown) {
  if (obj === null || typeof obj !== 'object') return;
  for (const value of Object.values(obj as Record<string, unknown>)) {
    if (value instanceof ClusterClient) return value as ClusterClient<Client>;
  }
  return;
}

export function detectShard(client: Client): {
  shardType: 'hybrid' | 'djs' | 'none';
  cluster?: ClusterClient<Client>;
} {
  const cluster = findClusterClient(client);
  if (cluster) return { shardType: 'hybrid', cluster };
  if (client.shard) return { shardType: 'djs' };
  return { shardType: 'none' };
}
