import { z } from 'zod';

const snowflake = z
  .string({ error: 'is required' })
  .regex(/^\d{17,20}$/, 'must be a Discord ID (17-20 digits)');

const schema = z.object({
  DISCORD_TOKEN: z.string({ error: 'is required' }).min(1, 'is required'),
  DISCORD_CLIENT_ID: snowflake,
  /** When set, commands are deployed to this guild only, which updates instantly. */
  DISCORD_GUILD_ID: snowflake.optional(),
  DEFAULT_COOLDOWN_SECONDS: z.coerce.number().min(0).default(3),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof schema>;

export class ConfigError extends Error {
  override name = 'ConfigError';
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  // Empty values from a copied .env.example count as unset.
  const cleaned = Object.fromEntries(Object.entries(env).filter(([, v]) => v !== ''));
  const result = schema.safeParse(cleaned);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join('.')} ${i.message}`);
    throw new ConfigError(`Invalid environment. Check your .env file:\n${lines.join('\n')}`);
  }
  return result.data;
}
