const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;

export type LogLevel = keyof typeof LEVELS;
export type Logger = Record<LogLevel, (...args: unknown[]) => void>;

export function createLogger(level: LogLevel = 'info'): Logger {
  const min = LEVELS[level];
  const log =
    (lvl: LogLevel, write: (...args: unknown[]) => void) =>
    (...args: unknown[]) => {
      if (LEVELS[lvl] >= min) write(`[${new Date().toISOString()}] ${lvl.toUpperCase()}`, ...args);
    };
  return {
    debug: log('debug', console.debug),
    info: log('info', console.log),
    warn: log('warn', console.warn),
    error: log('error', console.error),
  };
}
