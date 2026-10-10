import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Collection } from 'discord.js';
import type { Command, Event } from '../types.js';

const MODULE = /\.(?:js|ts)$/;
const SKIP = /\.(?:d|test|spec)\.ts$/;

/** Imports every module under dir (recursively) and returns their default exports. */
export async function importAll(
  dir: string | URL,
): Promise<Array<{ file: string; value: unknown }>> {
  const root = dir instanceof URL ? fileURLToPath(dir) : dir;
  const entries = await readdir(root, { recursive: true, withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && MODULE.test(e.name) && !SKIP.test(e.name))
    .map((e) => join(e.parentPath, e.name))
    .sort();
  return Promise.all(
    files.map(async (file) => ({
      file,
      value: ((await import(pathToFileURL(file).href)) as { default?: unknown }).default,
    })),
  );
}

function isCommand(value: unknown): value is Command {
  const v = value as Partial<Command> | undefined;
  return (
    typeof v?.data?.name === 'string' &&
    typeof v.data.toJSON === 'function' &&
    typeof v.execute === 'function'
  );
}

function isEvent(value: unknown): value is Event {
  const v = value as Partial<Event> | undefined;
  return typeof v?.name === 'string' && typeof v.execute === 'function';
}

export async function loadCommands(dir: string | URL): Promise<Collection<string, Command>> {
  const commands = new Collection<string, Command>();
  for (const { file, value } of await importAll(dir)) {
    if (!isCommand(value)) throw new Error(`${file} does not default-export a command`);
    if (commands.has(value.data.name)) {
      throw new Error(`Duplicate command name "${value.data.name}" in ${file}`);
    }
    commands.set(value.data.name, value);
  }
  return commands;
}

export async function loadEvents(dir: string | URL): Promise<Event[]> {
  const events: Event[] = [];
  for (const { file, value } of await importAll(dir)) {
    if (!isEvent(value)) throw new Error(`${file} does not default-export an event`);
    events.push(value);
  }
  return events;
}
