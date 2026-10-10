import { Client, GatewayIntentBits } from 'discord.js';
import type { Config } from './config.js';
import { Cooldowns } from './lib/cooldowns.js';
import { loadCommands, loadEvents } from './lib/loader.js';
import { createLogger } from './lib/logger.js';
import type { BotContext } from './types.js';

/** Builds the client and wires up commands and events. Call client.login() to start. */
export async function createBot(config: Config): Promise<BotContext> {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const ctx: BotContext = {
    client,
    config,
    commands: await loadCommands(new URL('./commands/', import.meta.url)),
    cooldowns: new Cooldowns(),
    logger: createLogger(config.LOG_LEVEL),
  };

  for (const event of await loadEvents(new URL('./events/', import.meta.url))) {
    const listener = (...args: unknown[]) =>
      Promise.resolve((event.execute as (...a: unknown[]) => unknown)(ctx, ...args)).catch((err) =>
        ctx.logger.error(`Event ${event.name} failed:`, err),
      );
    if (event.once) client.once(event.name, listener);
    else client.on(event.name, listener);
  }

  setInterval(() => ctx.cooldowns.sweep(), 60_000).unref();
  return ctx;
}
