type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m", // grey
  info: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
};

const RESET = "\x1b[0m";

const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "debug";

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= LEVELS[minLevel];
}

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 23);
}

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta || Object.keys(meta).length === 0) return "";
  return " " + JSON.stringify(meta);
}

export function createLogger(namespace?: string) {
  const prefix = namespace ? `[${namespace}]` : "";

  function log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ) {
    if (!shouldLog(level)) return;

    const color = COLORS[level];
    const line = `${timestamp()} ${color}${level.toUpperCase().padEnd(5)}${RESET} ${prefix}${message}${formatMeta(meta)}\n`;

    if (level === "error") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  }

  return {
    debug: (msg: string, meta?: Record<string, unknown>) =>
      log("debug", msg, meta),
    info: (msg: string, meta?: Record<string, unknown>) =>
      log("info", msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) =>
      log("warn", msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) =>
      log("error", msg, meta),
    child: (childNs: string) =>
      createLogger(`${namespace ? namespace + "." : ""}${childNs}`),
  };
}

export type Logger = ReturnType<typeof createLogger>;

export const logger = createLogger();
