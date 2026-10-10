import { EmbedBuilder, SlashCommandBuilder, version as djsVersion, type Client } from 'discord.js';
import { defineCommand } from '../types.js';

export const BRAND_COLOR = 0x4aa3df;

export function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const parts = [
    [Math.floor(s / 86400), 'd'],
    [Math.floor((s % 86400) / 3600), 'h'],
    [Math.floor((s % 3600) / 60), 'm'],
    [s % 60, 's'],
  ] as const;
  const shown = parts.filter(([n]) => n > 0).map(([n, unit]) => `${n}${unit}`);
  return shown.length ? shown.join(' ') : '0s';
}

export function buildInfoEmbed(client: Client, memoryBytes = process.memoryUsage().rss) {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(client.user?.username ?? 'Bot info')
    .setThumbnail(client.user?.displayAvatarURL() ?? null)
    .addFields(
      { name: 'Servers', value: String(client.guilds.cache.size), inline: true },
      { name: 'Uptime', value: formatUptime(client.uptime ?? 0), inline: true },
      { name: 'Memory', value: `${Math.round(memoryBytes / 1024 / 1024)} MB`, inline: true },
      { name: 'Node.js', value: process.version, inline: true },
      { name: 'discord.js', value: `v${djsVersion}`, inline: true },
    )
    .setTimestamp();
}

export default defineCommand({
  data: new SlashCommandBuilder().setName('info').setDescription('Show bot stats'),
  async execute(interaction) {
    await interaction.reply({ embeds: [buildInfoEmbed(interaction.client)] });
  },
});
