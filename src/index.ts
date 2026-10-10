import { createBot } from './bot.js';
import { ConfigError, loadConfig } from './config.js';

try {
  const config = loadConfig();
  const { client, logger } = await createBot(config);

  const shutdown = async () => {
    logger.info('Shutting down');
    await client.destroy();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('unhandledRejection', (err) => logger.error('Unhandled rejection:', err));

  await client.login(config.DISCORD_TOKEN);
} catch (err) {
  console.error(err instanceof ConfigError ? err.message : err);
  process.exit(1);
}
