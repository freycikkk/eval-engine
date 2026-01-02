/** @format */

import { ClusterClient } from 'discord-hybrid-sharding';
import type { Client } from 'discord.js';

export function detectShard(client: Client): {
  shardType: 'hybrid' | 'djs' | 'none';
  cluster?: ClusterClient<Client>;
} {
  const anyClient = client as any;
  if (anyClient.cluster instanceof ClusterClient) return { shardType: 'hybrid', cluster: anyClient.cluster };

  if (
    anyClient.cluster &&
    typeof anyClient.cluster.send === 'function' &&
    typeof anyClient.cluster.broadcastEval === 'function' &&
    typeof anyClient.cluster.fetchClientValues === 'function'
  )
    return { shardType: 'hybrid', cluster: anyClient.cluster };

  if (client.shard) return { shardType: 'djs' };
  return { shardType: 'none' };
}
