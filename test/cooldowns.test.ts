import { describe, expect, it } from 'vitest';
import { Cooldowns } from '../src/lib/cooldowns.js';

describe('Cooldowns', () => {
  it('blocks repeat use until the cooldown expires', () => {
    let now = 0;
    const cd = new Cooldowns(() => now);
    expect(cd.hit('ping', 'u1', 5)).toBe(0);
    now = 1_200;
    expect(cd.hit('ping', 'u1', 5)).toBe(4);
    now = 5_000;
    expect(cd.hit('ping', 'u1', 5)).toBe(0);
  });

  it('tracks users and commands separately', () => {
    const cd = new Cooldowns(() => 0);
    cd.hit('ping', 'u1', 5);
    expect(cd.hit('ping', 'u2', 5)).toBe(0);
    expect(cd.hit('info', 'u1', 5)).toBe(0);
  });

  it('ignores zero cooldowns and sweeps expired entries', () => {
    let now = 0;
    const cd = new Cooldowns(() => now);
    expect(cd.hit('ping', 'u1', 0)).toBe(0);
    expect(cd.size).toBe(0);
    cd.hit('ping', 'u1', 1);
    cd.hit('poll', 'u1', 10);
    now = 2_000;
    cd.sweep();
    expect(cd.size).toBe(1);
  });
});
