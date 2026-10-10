import { MessageFlags, type Interaction } from 'discord.js';
import { handleCommandError } from './lib/errors.js';
import type { BotContext } from './types.js';

/** Routes slash commands: lookup, cooldown, execute, error handling. */
export async function handleInteraction(interaction: Interaction, ctx: BotContext): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const command = ctx.commands.get(interaction.commandName);
  if (!command) {
    ctx.logger.warn(`Unknown command /${interaction.commandName}`);
    await interaction.reply({
      content: 'That command is not available right now.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const seconds = command.cooldown ?? ctx.config.DEFAULT_COOLDOWN_SECONDS;
  const wait = ctx.cooldowns.hit(command.data.name, interaction.user.id, seconds);
  if (wait > 0) {
    await interaction.reply({
      content: `Slow down! You can use \`/${command.data.name}\` again in ${wait}s.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await command.execute(interaction, ctx);
  } catch (error) {
    await handleCommandError(interaction, error, ctx.logger);
  }
}
