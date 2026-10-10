import { REST, Routes } from 'discord.js';
import { ConfigError, loadConfig } from './config.js';
import { loadCommands } from './lib/loader.js';

// Registers slash commands with Discord. Guild deploys show up instantly;
// global ones (--global) can take up to an hour.
try {
  const config = loadConfig();
  const global = process.argv.includes('--global');
  if (!global && !config.DISCORD_GUILD_ID) {
    throw new ConfigError('Set DISCORD_GUILD_ID for a guild deploy, or pass --global.');
  }

  const commands = await loadCommands(new URL('./commands/', import.meta.url));
  const body = commands.map((c) => c.data.toJSON());
  const rest = new REST().setToken(config.DISCORD_TOKEN);
  const route = global
    ? Routes.applicationCommands(config.DISCORD_CLIENT_ID)
    : Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID!);

  const result = (await rest.put(route, { body })) as unknown[];
  const where = global ? 'globally' : `to guild ${config.DISCORD_GUILD_ID}`;
  console.log(
    `Deployed ${result.length} commands ${where}: ${body.map((c) => `/${c.name}`).join(' ')}`,
  );
} catch (err) {
  console.error(err instanceof ConfigError ? err.message : err);
  process.exit(1);
}
