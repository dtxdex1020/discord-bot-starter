import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../types.js';

export default defineCommand({
  data: new SlashCommandBuilder().setName('ping').setDescription('Check that the bot is alive'),
  cooldown: 5,
  async execute(interaction) {
    const res = await interaction.reply({ content: 'Pinging...', withResponse: true });
    const sent = res.resource?.message?.createdTimestamp ?? Date.now();
    const roundtrip = sent - interaction.createdTimestamp;
    const ws = interaction.client.ws.ping;
    await interaction.editReply(
      `Pong! Roundtrip ${roundtrip}ms, gateway ${ws < 0 ? 'n/a' : `${ws}ms`}.`,
    );
  },
});
