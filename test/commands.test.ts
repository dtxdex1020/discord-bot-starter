import { Collection, MessageFlags, type Client } from 'discord.js';
import { describe, expect, it } from 'vitest';
import info, { buildInfoEmbed, formatUptime } from '../src/commands/info.js';
import ping from '../src/commands/ping.js';
import poll, { buildPoll, parseAnswers } from '../src/commands/poll.js';
import { context, fakeInteraction } from './helpers.js';

describe('/ping', () => {
  it('reports roundtrip and gateway latency', async () => {
    const interaction = fakeInteraction({ client: { ws: { ping: 37 } } as unknown as Client });
    await ping.execute(interaction, context());
    expect(interaction.reply).toHaveBeenCalledWith({ content: 'Pinging...', withResponse: true });
    expect(interaction.editReply).toHaveBeenCalledWith('Pong! Roundtrip 42ms, gateway 37ms.');
  });

  it('handles an unknown gateway ping', async () => {
    const interaction = fakeInteraction({ client: { ws: { ping: -1 } } as unknown as Client });
    await ping.execute(interaction, context());
    expect(interaction.editReply).toHaveBeenCalledWith('Pong! Roundtrip 42ms, gateway n/a.');
  });
});

describe('/info', () => {
  it('formats uptime', () => {
    expect(formatUptime(0)).toBe('0s');
    expect(formatUptime(59_000)).toBe('59s');
    expect(formatUptime(3_723_000)).toBe('1h 2m 3s');
    expect(formatUptime(90_061_000)).toBe('1d 1h 1m 1s');
  });

  it('builds a stats embed', async () => {
    const client = {
      user: { username: 'Starter', displayAvatarURL: () => 'https://cdn.example/avatar.png' },
      guilds: {
        cache: new Collection([
          ['1', {}],
          ['2', {}],
        ]),
      },
      uptime: 61_000,
    } as unknown as Client;
    const embed = buildInfoEmbed(client, 50 * 1024 * 1024).toJSON();
    expect(embed.title).toBe('Starter');
    expect(embed.color).toBe(0x4aa3df);
    expect(embed.fields).toEqual(
      expect.arrayContaining([
        { name: 'Servers', value: '2', inline: true },
        { name: 'Uptime', value: '1m 1s', inline: true },
        { name: 'Memory', value: '50 MB', inline: true },
      ]),
    );

    const interaction = fakeInteraction({ client });
    await info.execute(interaction, context());
    expect(interaction.reply).toHaveBeenCalledWith({ embeds: [expect.anything()] });
  });
});

describe('/poll', () => {
  it('parses answers with | or commas and drops duplicates', () => {
    expect(parseAnswers('Pizza | Tacos |  | pizza | Sushi')).toEqual(['Pizza', 'Tacos', 'Sushi']);
    expect(parseAnswers('yes, no')).toEqual(['yes', 'no']);
    expect(parseAnswers('Salt, pepper | Just salt')).toEqual(['Salt, pepper', 'Just salt']);
  });

  it('builds poll data', () => {
    expect(buildPoll(' Lunch? ', 'Pizza | Tacos', 4, true)).toEqual({
      question: { text: 'Lunch?' },
      answers: [{ text: 'Pizza' }, { text: 'Tacos' }],
      duration: 4,
      allowMultiselect: true,
    });
  });

  it('validates answers', () => {
    expect(buildPoll('q', 'only one')).toMatch(/at least two/);
    expect(buildPoll('q', Array.from({ length: 11 }, (_, i) => `a${i}`).join('|'))).toMatch(
      /at most 10/,
    );
    expect(buildPoll('q', `ok | ${'x'.repeat(56)}`)).toMatch(/too long/);
  });

  it('replies with a native poll', async () => {
    const interaction = fakeInteraction({
      options: { question: 'Best editor?', answers: 'vim, emacs' },
    });
    await poll.execute(interaction, context());
    expect(interaction.reply).toHaveBeenCalledWith({
      poll: {
        question: { text: 'Best editor?' },
        answers: [{ text: 'vim' }, { text: 'emacs' }],
        duration: 24,
        allowMultiselect: false,
      },
    });
  });

  it('explains bad input privately', async () => {
    const interaction = fakeInteraction({ options: { question: 'Hmm', answers: 'just this' } });
    await poll.execute(interaction, context());
    expect(interaction.reply).toHaveBeenCalledWith({
      content: 'A poll needs at least two different answers.',
      flags: MessageFlags.Ephemeral,
    });
  });
});
