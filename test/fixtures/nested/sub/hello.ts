import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('hello').setDescription('Nested command'),
  execute: async () => {},
};
