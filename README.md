# discord-bot-starter

[![CI](https://img.shields.io/github/actions/workflow/status/dtxdex1020/discord-bot-starter/ci.yml?branch=main&style=flat-square&label=CI&labelColor=1f4e79)](https://github.com/dtxdex1020/discord-bot-starter/actions/workflows/ci.yml)
[![discord.js](https://img.shields.io/badge/discord.js-v14-4aa3df?style=flat-square&labelColor=1f4e79&logo=discord&logoColor=white)](https://discord.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-4aa3df?style=flat-square&labelColor=1f4e79&logo=typescript&logoColor=white)](./tsconfig.json)
[![template](https://img.shields.io/badge/use%20this-template-4aa3df?style=flat-square&labelColor=1f4e79)](https://github.com/dtxdex1020/discord-bot-starter/generate)
[![license](https://img.shields.io/badge/license-MIT-4aa3df?style=flat-square&labelColor=1f4e79)](./LICENSE)

The Discord bot boilerplate I wish I'd started with. Drop a file in `src/commands/`, it becomes a slash command. Drop a file in `src/events/`, it gets wired up. Config is typed and validated before anything connects, every command gets a cooldown, and errors reach the user instead of vanishing into "This interaction failed".

Comes with `/ping`, `/info` and `/poll` (native Discord polls) so you can see the pattern, plus a test suite that runs without a bot token.

## Quick start

1. Click **[Use this template](https://github.com/dtxdex1020/discord-bot-starter/generate)** (or clone it).
2. Create an application at the [Discord developer portal](https://discord.com/developers/applications), add a bot, and copy its token and the application ID.
3. Invite it with this URL (swap in your ID):
   `https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands`
4. Set up and run:

```sh
npm install
cp .env.example .env   # fill in DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID
npm run deploy         # register slash commands in your test server
npm run dev            # start with hot reload
```

For production: `npm run build && npm run deploy:global && npm start`.

## Project layout

```text
src/
  commands/            one file per slash command, loaded automatically
    ping.ts
    info.ts
    poll.ts
  events/              one file per client event, loaded automatically
    ready.ts
    interactionCreate.ts
    error.ts
  lib/
    loader.ts          finds and validates commands and events
    cooldowns.ts       per-user, per-command cooldowns
    errors.ts          logs and replies, whatever state the interaction is in
    logger.ts
  bot.ts               builds the client and wires everything up
  handler.ts           slash command routing: lookup, cooldown, run, catch
  config.ts            zod-validated environment
  deploy-commands.ts   registers commands with Discord
  index.ts             entry point
```

Subfolders work too (`src/commands/fun/meme.ts`), so you can group commands however you like.

## Adding a command

```ts
// src/commands/roll.ts
import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../types.js';

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a die')
    .addIntegerOption((o) => o.setName('sides').setDescription('Default 6').setMinValue(2)),
  cooldown: 2, // seconds, optional
  async execute(interaction) {
    const sides = interaction.options.getInteger('sides') ?? 6;
    await interaction.reply(`You rolled a ${1 + Math.floor(Math.random() * sides)}`);
  },
});
```

Then `npm run deploy`. That's it. If `execute` throws, the user gets a private "something went wrong" message and the error is logged with the command name and user ID.

## Adding an event

```ts
// src/events/guildCreate.ts
import { Events } from 'discord.js';
import { defineEvent } from '../types.js';

export default defineEvent({
  name: Events.GuildCreate,
  execute(ctx, guild) {
    ctx.logger.info(`Joined ${guild.name}`);
  },
});
```

`defineEvent` infers the argument types from the event name, so `guild` is a typed `Guild`. Every handler also gets `ctx` with the client, config, commands, cooldowns and logger.

## Configuration

| Variable                   | Required | Default |                                                        |
| -------------------------- | -------- | ------- | ------------------------------------------------------ |
| `DISCORD_TOKEN`            | yes      |         | Bot token                                              |
| `DISCORD_CLIENT_ID`        | yes      |         | Application ID                                         |
| `DISCORD_GUILD_ID`         | no       |         | Test server for `npm run deploy` (updates instantly)   |
| `DEFAULT_COOLDOWN_SECONDS` | no       | `3`     | Used when a command doesn't set `cooldown`; `0` = none |
| `LOG_LEVEL`                | no       | `info`  | `debug`, `info`, `warn` or `error`                     |

Bad or missing values stop the bot before it connects, with every problem listed:

```text
Invalid environment. Check your .env file:
  DISCORD_TOKEN is required
  DISCORD_CLIENT_ID must be a Discord ID (17-20 digits)
```

## Scripts

| Script                  | What it does                                    |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Run from source with reload on save             |
| `npm run deploy`        | Register commands in `DISCORD_GUILD_ID`         |
| `npm run deploy:global` | Register commands everywhere (can take an hour) |
| `npm run build`         | Compile to `dist/`                              |
| `npm start`             | Run the compiled bot                            |
| `npm test`              | Vitest, no token or network needed              |
| `npm run lint`          | ESLint, Prettier and type checks                |

Uses Node's built-in `--env-file`, so there's no dotenv dependency. Node 20.12 or newer.

## Why

Most bot templates are either a single 400-line `index.js` or a framework with its own opinions about everything. This sits in between: the plumbing every bot ends up needing (loading, cooldowns, error replies, config checks, a deploy script), written plainly enough that you can change any of it. Only the `Guilds` intent is enabled by default; add more in `src/bot.ts` when you need them.

## License

[MIT](./LICENSE)
