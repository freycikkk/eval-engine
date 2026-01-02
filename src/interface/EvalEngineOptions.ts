/** @format */

import type { Snowflake } from 'discord.js';

export interface EvalEngineOptions {
  aliases?: string[];
  owners: Snowflake[];
  prefix?: string;
  secrets?: string[];
}
