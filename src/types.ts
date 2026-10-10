import type {
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  Collection,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import type { Config } from './config.js';
import type { Cooldowns } from './lib/cooldowns.js';
import type { Logger } from './lib/logger.js';

export interface BotContext {
  client: Client;
  config: Config;
  commands: Collection<string, Command>;
  cooldowns: Cooldowns;
  logger: Logger;
}

export interface Command {
  /** Usually a SlashCommandBuilder. */
  data: { name: string; toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  /** Seconds between uses per user. Falls back to DEFAULT_COOLDOWN_SECONDS. */
  cooldown?: number;
  execute(interaction: ChatInputCommandInteraction, ctx: BotContext): Promise<unknown>;
}

export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute(ctx: BotContext, ...args: ClientEvents[K]): unknown;
}

/** Helpers that keep command and event files fully typed without casts. */
export const defineCommand = (command: Command): Command => command;
export const defineEvent = <K extends keyof ClientEvents>(event: Event<K>): Event<K> => event;
