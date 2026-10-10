import { Events } from 'discord.js';
import { defineEvent } from '../types.js';

export default defineEvent({
  name: Events.ClientReady,
  once: true,
  execute(ctx, client) {
    ctx.logger.info(`Logged in as ${client.user.tag} with ${ctx.commands.size} commands`);
  },
});
