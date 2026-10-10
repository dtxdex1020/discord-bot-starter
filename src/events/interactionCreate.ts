import { Events } from 'discord.js';
import { handleInteraction } from '../handler.js';
import { defineEvent } from '../types.js';

export default defineEvent({
  name: Events.InteractionCreate,
  execute: (ctx, interaction) => handleInteraction(interaction, ctx),
});
