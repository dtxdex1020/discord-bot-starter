import { MessageFlags, SlashCommandBuilder, type PollData } from 'discord.js';
import { defineCommand } from '../types.js';

// Limits from the Discord API.
export const MAX_ANSWERS = 10;
export const MAX_ANSWER_LENGTH = 55;
export const MAX_HOURS = 768;

/** Splits "Pizza | Tacos | Sushi" (or comma separated) into unique answers. */
export function parseAnswers(raw: string): string[] {
  const sep = raw.includes('|') ? '|' : ',';
  const seen = new Set<string>();
  const answers: string[] = [];
  for (const part of raw.split(sep)) {
    const text = part.trim();
    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      answers.push(text);
    }
  }
  return answers;
}

export function buildPoll(
  question: string,
  rawAnswers: string,
  hours = 24,
  allowMultiselect = false,
): PollData | string {
  const answers = parseAnswers(rawAnswers);
  if (answers.length < 2) return 'A poll needs at least two different answers.';
  if (answers.length > MAX_ANSWERS) return `A poll can have at most ${MAX_ANSWERS} answers.`;
  const tooLong = answers.find((a) => a.length > MAX_ANSWER_LENGTH);
  if (tooLong) return `"${tooLong}" is too long (max ${MAX_ANSWER_LENGTH} characters).`;
  return {
    question: { text: question.trim() },
    answers: answers.map((text) => ({ text })),
    duration: hours,
    allowMultiselect,
  };
}

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Start a native Discord poll')
    .addStringOption((o) =>
      o
        .setName('question')
        .setDescription('What are you asking?')
        .setRequired(true)
        .setMaxLength(300),
    )
    .addStringOption((o) =>
      o
        .setName('answers')
        .setDescription('Answers separated by | or commas, e.g. Pizza | Tacos | Sushi')
        .setRequired(true),
    )
    .addIntegerOption((o) =>
      o
        .setName('hours')
        .setDescription('How long the poll runs (default 24)')
        .setMinValue(1)
        .setMaxValue(MAX_HOURS),
    )
    .addBooleanOption((o) =>
      o.setName('multiple').setDescription('Allow picking more than one answer'),
    ),
  cooldown: 30,
  async execute(interaction) {
    const poll = buildPoll(
      interaction.options.getString('question', true),
      interaction.options.getString('answers', true),
      interaction.options.getInteger('hours') ?? 24,
      interaction.options.getBoolean('multiple') ?? false,
    );
    if (typeof poll === 'string') {
      await interaction.reply({ content: poll, flags: MessageFlags.Ephemeral });
      return;
    }
    await interaction.reply({ poll });
  },
});
