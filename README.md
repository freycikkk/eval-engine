<!-- @format -->

# EvalEngine

A powerful **owner-only evaluation engine for Discord bots** built on `discord.js`.

EvalEngine is a multi-purpose runtime tool designed for **live debugging**, **command execution**, and **cluster-aware inspection** in production bots. It goes far beyond a basic eval command.

---

## ✨ Features

### 🧠 Multi-Engine Evaluation

Run multiple execution engines through a single command:

- **JavaScript**: eval & inspect
- **Shell**: PowerShell / Bash / Zsh execution
- **Network**: Curl requests & RTT checks
- **Utility**: File inspection (`cat`) and Shard/Cluster inspection

### 📄 Dynamic Pagination

- Automatically paginates long outputs
- Button-based navigation
- Clean output formatting without message spam

### 🔄 Live Update Pagination (Shell)

Shell commands stream output **in real time**:

- Live-updating paginated output
- Handles long-running commands
- Safe process termination handling

### 🧩 Automatic Sharding Detection

EvalEngine automatically detects your shard environment:

- Native `discord.js` sharding
- Hybrid sharding (`discord-hybrid-sharding`)
- No sharding (single process)

---

## 📦 Installation

```bash
npm install @freycikkk/eval-engine
```

---

## 🚀 Basic Usage

```js
import { Client, GatewayIntentBits } from 'discord.js';
import { EvalEngine } from '@freycikkk/eval-engine';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent]
});

const evalEngine = new EvalEngine(client, {
  owners: ['YOUR_DISCORD_ID'],
  prefix: '!',
  secrets: ['SENSITIVE_VALUE'],
  aliases: ['e', 'debug']
});

client.on('messageCreate', (message) => {
  await evalEngine.run(message);
});

client.login('BOT_TOKEN');
```

---

## 🧾 Command Format

```text
<prefix><alias> <engine> <input>

```

### Examples

- `!eval js client.guilds.cache.size`
- `!eval shell ls -la`
- `!eval curl https://api.github.com`
- `!eval shard client.ws.ping`

---

## 🛠 Supported Engines

| Engine  | Description               |
| ------- | ------------------------- |
| `js`    | JavaScript evaluation     |
| `jsi`   | JavaScript inspect        |
| `shell` | Shell / PowerShell / Bash |
| `curl`  | HTTP requests             |
| `cat`   | File inspection           |
| `rtt`   | Round-trip latency        |
| `shard` | Shard & cluster info      |

---

## 🔒 Security Notice

> [!IMPORTANT]
> This tool is intended for **owner-only usage**. Do **not** expose EvalEngine to untrusted users.

- **No postinstall scripts**: No dynamic downloads or hidden telemetry.
- **Sanitization**: Configured secrets are automatically redacted from all outputs.

---

## 📄 License

MIT
