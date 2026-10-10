/** Per-user, per-command cooldowns kept in memory. */
export class Cooldowns {
  private readonly expires = new Map<string, number>();

  constructor(private readonly now: () => number = Date.now) {}

  /**
   * Starts a cooldown if none is active. Returns the seconds left when the user
   * is still cooling down, or 0 when the command may run.
   */
  hit(command: string, userId: string, seconds: number): number {
    if (seconds <= 0) return 0;
    const key = `${command}:${userId}`;
    const t = this.now();
    const until = this.expires.get(key);
    if (until !== undefined && until > t) return Math.ceil((until - t) / 1000);
    this.expires.set(key, t + seconds * 1000);
    return 0;
  }

  /** Drops expired entries. Called on an interval so the map doesn't grow forever. */
  sweep(): void {
    const t = this.now();
    for (const [key, until] of this.expires) if (until <= t) this.expires.delete(key);
  }

  get size(): number {
    return this.expires.size;
  }
}
