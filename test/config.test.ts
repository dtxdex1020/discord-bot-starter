import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../src/config.js';

const valid = { DISCORD_TOKEN: 'abc', DISCORD_CLIENT_ID: '123456789012345678' };

describe('loadConfig', () => {
  it('applies defaults', () => {
    expect(loadConfig(valid)).toEqual({ ...valid, DEFAULT_COOLDOWN_SECONDS: 3, LOG_LEVEL: 'info' });
  });

  it('parses optional values and ignores empty ones', () => {
    const c = loadConfig({
      ...valid,
      DISCORD_GUILD_ID: '987654321098765432',
      DEFAULT_COOLDOWN_SECONDS: '0',
      LOG_LEVEL: '',
    });
    expect(c).toMatchObject({
      DISCORD_GUILD_ID: '987654321098765432',
      DEFAULT_COOLDOWN_SECONDS: 0,
      LOG_LEVEL: 'info',
    });
  });

  it('lists every problem', () => {
    try {
      loadConfig({ DISCORD_CLIENT_ID: 'abc', LOG_LEVEL: 'loud' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      const msg = (err as Error).message;
      expect(msg).toContain('DISCORD_TOKEN');
      expect(msg).toContain('DISCORD_CLIENT_ID must be a Discord ID');
      expect(msg).toContain('LOG_LEVEL');
    }
  });
});
