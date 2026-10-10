import { describe, expect, it } from 'vitest';
import { loadCommands, loadEvents } from '../src/lib/loader.js';

const fixtures = (name: string) => new URL(`./fixtures/${name}/`, import.meta.url);

describe('loadCommands', () => {
  it('loads the bundled commands with valid payloads', async () => {
    const commands = await loadCommands(new URL('../src/commands/', import.meta.url));
    expect([...commands.keys()].sort()).toEqual(['info', 'ping', 'poll']);
    for (const command of commands.values()) {
      const json = command.data.toJSON();
      expect(json.name).toBe(command.data.name);
      expect(json.description?.length).toBeGreaterThan(0);
    }
  });

  it('finds commands in subfolders', async () => {
    expect([...(await loadCommands(fixtures('nested'))).keys()]).toEqual(['hello']);
  });

  it('rejects modules that are not commands', async () => {
    await expect(loadCommands(fixtures('bad'))).rejects.toThrow(
      /oops\.ts does not default-export a command/,
    );
  });

  it('rejects duplicate names', async () => {
    await expect(loadCommands(fixtures('dupes'))).rejects.toThrow(/Duplicate command name "same"/);
  });
});

describe('loadEvents', () => {
  it('loads the bundled events', async () => {
    const events = await loadEvents(new URL('../src/events/', import.meta.url));
    expect(events.map((e) => e.name).sort()).toEqual(['clientReady', 'error', 'interactionCreate']);
    expect(events.find((e) => e.name === 'clientReady')?.once).toBe(true);
  });
});
