import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { describe, expect, it, vi } from 'vitest';
import { handleInteraction } from '../src/handler.js';
import { ERROR_MESSAGE } from '../src/lib/errors.js';
import type { Command } from '../src/types.js';
import { context, fakeInteraction } from './helpers.js';

const command = (execute: Command['execute'], cooldown?: number): Command => ({
  data: new SlashCommandBuilder().setName('test').setDescription('test'),
  cooldown,
  execute,
});

describe('handleInteraction', () => {
  it('runs the matching command with the context', async () => {
    const execute = vi.fn(async () => {});
    const ctx = context([command(execute)]);
    const interaction = fakeInteraction();
    await handleInteraction(interaction, ctx);
    expect(execute).toHaveBeenCalledWith(interaction, ctx);
  });

  it('ignores interactions that are not slash commands', async () => {
    const execute = vi.fn(async () => {});
    const interaction = { ...fakeInteraction(), isChatInputCommand: () => false };
    await handleInteraction(interaction as never, context([command(execute)]));
    expect(execute).not.toHaveBeenCalled();
  });

  it('answers unknown commands', async () => {
    const interaction = fakeInteraction({ commandName: 'gone' });
    await handleInteraction(interaction, context());
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: MessageFlags.Ephemeral }),
    );
  });

  it('enforces cooldowns per user', async () => {
    let now = 0;
    const execute = vi.fn(async () => {});
    const ctx = context([command(execute, 10)], () => now);

    await handleInteraction(fakeInteraction(), ctx);
    now = 4_000;
    const blocked = fakeInteraction();
    await handleInteraction(blocked, ctx);
    await handleInteraction(fakeInteraction({ userId: 'someone-else' }), ctx);

    expect(execute).toHaveBeenCalledTimes(2);
    expect(blocked.reply).toHaveBeenCalledWith({
      content: 'Slow down! You can use `/test` again in 6s.',
      flags: MessageFlags.Ephemeral,
    });
  });

  it('falls back to the default cooldown', async () => {
    const execute = vi.fn(async () => {});
    const ctx = context([command(execute)]);
    await handleInteraction(fakeInteraction(), ctx);
    await handleInteraction(fakeInteraction(), ctx);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('replies with an error when a command throws', async () => {
    const ctx = context([command(async () => Promise.reject(new Error('boom')))]);
    const interaction = fakeInteraction();
    await handleInteraction(interaction, ctx);
    expect(interaction.reply).toHaveBeenCalledWith({
      content: ERROR_MESSAGE,
      flags: MessageFlags.Ephemeral,
    });
    expect(ctx.logger.error).toHaveBeenCalled();
  });

  it('follows up instead when the command already replied', async () => {
    const ctx = context([command(async () => Promise.reject(new Error('late boom')))]);
    const interaction = fakeInteraction({ replied: true });
    await handleInteraction(interaction, ctx);
    expect(interaction.reply).not.toHaveBeenCalled();
    expect(interaction.followUp).toHaveBeenCalledWith({
      content: ERROR_MESSAGE,
      flags: MessageFlags.Ephemeral,
    });
  });

  it('survives a failing error reply', async () => {
    const ctx = context([command(async () => Promise.reject(new Error('boom')))]);
    const interaction = fakeInteraction();
    interaction.reply.mockRejectedValueOnce(new Error('Unknown interaction'));
    await expect(handleInteraction(interaction, ctx)).resolves.toBeUndefined();
    expect(ctx.logger.warn).toHaveBeenCalled();
  });
});
