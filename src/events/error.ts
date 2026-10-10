import { Events } from 'discord.js';
import { defineEvent } from '../types.js';

export default defineEvent({
  name: Events.Error,
  execute(ctx, error) {
    ctx.logger.error('Client error:', error);
  },
});
