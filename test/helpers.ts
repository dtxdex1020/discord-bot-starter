import { Collection, type ChatInputCommandInteraction, type Client } from 'discord.js';
import { vi } from 'vitest';
import type { Config } from '../src/config.js';
import { Cooldowns } from '../src/lib/cooldowns.js';
import type { Logger } from '../src/lib/logger.js';
import type { BotContext, Command } from '../src/types.js';

export const config: Config = {
  DISCORD_TOKEN: 'token',
  DISCORD_CLIENT_ID: '123456789012345678',
  DEFAULT_COOLDOWN_SECONDS: 3,
  LOG_LEVEL: 'error',
};

export const silentLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

export function context(commands: Command[] = [], now = () => 0): BotContext {
  return {
    client: {} as Client,
    config,
    commands: new Collection(commands.map((c) => [c.data.name, c])),
    cooldowns: new Cooldowns(now),
    logger: silentLogger(),
  };
}

interface FakeOptions {
  commandName?: string;
  userId?: string;
  options?: Record<string, string | number | boolean | null>;
  replied?: boolean;
  deferred?: boolean;
  client?: Partial<Client>;
}

/** Just enough of a ChatInputCommandInteraction for handler and command tests. */
export function fakeInteraction(opts: FakeOptions = {}) {
  const values = opts.options ?? {};
  const get = (name: string, required?: boolean) => {
    const v = values[name] ?? null;
    if (v === null && required) throw new Error(`missing option ${name}`);
    return v;
  };
  const interaction = {
    commandName: opts.commandName ?? 'test',
    user: { id: opts.userId ?? 'user-1' },
    replied: opts.replied ?? false,
    deferred: opts.deferred ?? false,
    createdTimestamp: 1_000,
    client: opts.client ?? {},
    isChatInputCommand: () => true,
    reply: vi.fn(async () => ({ resource: { message: { createdTimestamp: 1_042 } } })),
    editReply: vi.fn(async () => undefined),
    followUp: vi.fn(async () => undefined),
    options: {
      getString: get,
      getInteger: get,
      getBoolean: get,
    },
  };
  return interaction as typeof interaction & ChatInputCommandInteraction;
}
