import { MessageFlags, type ChatInputCommandInteraction } from 'discord.js';
import type { Logger } from './logger.js';

export const ERROR_MESSAGE = 'Something went wrong running that command. Try again in a moment.';

/** Logs the error and tells the user, whatever state the interaction is in. */
export async function handleCommandError(
  interaction: ChatInputCommandInteraction,
  error: unknown,
  logger: Logger,
): Promise<void> {
  logger.error(`/${interaction.commandName} failed for ${interaction.user.id}:`, error);
  const reply = { content: ERROR_MESSAGE, flags: MessageFlags.Ephemeral } as const;
  try {
    if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
    else await interaction.reply(reply);
  } catch (err) {
    // The interaction may have expired; nothing else we can do.
    logger.warn('Could not send the error reply:', err);
  }
}
