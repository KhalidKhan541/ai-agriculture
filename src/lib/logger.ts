// ═══════════════════════════════════════════════════════════════
// LOG LEVELS
// ═══════════════════════════════════════════════════════════════

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.FATAL]: "FATAL",
};

const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "\x1b[36m", // cyan
  [LogLevel.INFO]: "\x1b[32m",  // green
  [LogLevel.WARN]: "\x1b[33m",  // yellow
  [LogLevel.ERROR]: "\x1b[31m", // red
  [LogLevel.FATAL]: "\x1b[35m", // magenta
};

const RESET_COLOR = "\x1b[0m";

// ═══════════════════════════════════════════════════════════════
// LOG INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  requestId?: string;
  userId?: string;
  farmId?: string;
  duration?: number;
  source?: string;
}

export interface LoggerOptions {
  level?: LogLevel;
  serviceName?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
  filePath?: string;
  maxFileSize?: string;
  maxFiles?: number;
  enableJson?: boolean;
  enableColors?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONSOLE TRANSPORT
// ═══════════════════════════════════════════════════════════════

class ConsoleTransport {
  private enableColors: boolean;
  private enableJson: boolean;

  constructor(options: { enableColors?: boolean; enableJson?: boolean } = {}) {
    this.enableColors = options.enableColors ?? process.env.NODE_ENV === "development";
    this.enableJson = options.enableJson ?? process.env.NODE_ENV === "production";
  }

  write(entry: LogEntry): void {
    if (this.enableJson) {
      console.log(JSON.stringify(entry));
      return;
    }

    const level = entry.level;
    const timestamp = entry.timestamp;
    const message = entry.message;
    const contextStr = entry.context
      ? ` ${JSON.stringify(entry.context)}`
      : "";
    const errorStr = entry.error
      ? `\n  Error: ${entry.error.message}\n  Stack: ${entry.error.stack ?? "N/A"}`
      : "";

    if (this.enableColors) {
      const color = LOG_LEVEL_COLORS[entry.level as unknown as LogLevel] ?? "";
      console.log(
        `${color}[${timestamp}] ${level}${RESET_COLOR} ${message}${contextStr}${errorStr}`
      );
    } else {
      console.log(`[${timestamp}] ${level} ${message}${contextStr}${errorStr}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// FILE TRANSPORT (In-Memory Buffer)
// ═══════════════════════════════════════════════════════════════

class FileTransport {
  private buffer: LogEntry[] = [];
  private maxBufferSize: number;
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: { maxBufferSize?: number; flushIntervalMs?: number } = {}) {
    this.maxBufferSize = options.maxBufferSize ?? 100;
    this.flushInterval = setInterval(
      () => this.flush(),
      options.flushIntervalMs ?? 5000
    );
  }

  write(entry: LogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    // In production, write to file system or cloud logging service
    if (process.env.NODE_ENV === "production") {
      // Would integrate with winston, pino, or cloud logging
      // For now, we'll use console as fallback
      for (const log of logs) {
        console.log(JSON.stringify(log));
      }
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN LOGGER CLASS
// ═══════════════════════════════════════════════════════════════

class Logger {
  private level: LogLevel;
  private serviceName: string;
  private consoleTransport: ConsoleTransport;
  private fileTransport: FileTransport | null = null;
  private defaultContext: LogContext = {};

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? this.getLevelFromEnv();
    this.serviceName = options.serviceName ?? "ai-agriculture";
    this.consoleTransport = new ConsoleTransport({
      enableColors: options.enableColors,
      enableJson: options.enableJson,
    });

    if (options.enableFile) {
      this.fileTransport = new FileTransport({
        maxFileSize: options.maxFileSize as unknown as number,
        maxFiles: options.maxFiles,
      });
    }
  }

  private getLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case "DEBUG":
        return LogLevel.DEBUG;
      case "INFO":
        return LogLevel.INFO;
      case "WARN":
        return LogLevel.WARN;
      case "ERROR":
        return LogLevel.ERROR;
      case "FATAL":
        return LogLevel.FATAL;
      default:
        return process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error & { code?: string }
  ): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: LOG_LEVEL_NAMES[level],
      message,
      context: {
        ...this.defaultContext,
        ...context,
        service: this.serviceName,
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code,
      };
    }

    this.consoleTransport.write(entry);
    this.fileTransport?.write(entry);
  }

  // ─── Public API ───────────────────────────────────────────

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error & { code?: string }, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error & { code?: string }, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  // ─── Context Methods ──────────────────────────────────────

  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger({
      level: this.level,
      serviceName: this.serviceName,
    });
    childLogger.defaultContext = {
      ...this.defaultContext,
      ...defaultContext,
    };
    return childLogger;
  }

  setContext(context: LogContext): void {
    this.defaultContext = { ...this.defaultContext, ...context };
  }

  clearContext(): void {
    this.defaultContext = {};
  }

  // ─── Convenience Methods ──────────────────────────────────

  logRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      duration: durationMs,
    });
  }

  logError(error: Error, context?: LogContext): void {
    this.error(error.message, error, context);
  }

  logDatabaseQuery(query: string, durationMs: number, error?: Error): void {
    if (error) {
      this.error("Database query failed", error, { query, duration: durationMs });
    } else if (durationMs > 1000) {
      this.warn("Slow database query", { query, duration: durationMs });
    } else {
      this.debug("Database query", { query, duration: durationMs });
    }
  }

  logExternalService(
    service: string,
    method: string,
    statusCode: number,
    durationMs: number,
    error?: Error
  ): void {
    const level = error ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `${service}.${method} ${statusCode}`, {
      service,
      method,
      statusCode,
      duration: durationMs,
      ...(error ? { error: error.message } : {}),
    });
  }

  logAuth(event: string, userId?: string, details?: LogContext): void {
    this.info(`Auth: ${event}`, {
      userId,
      ...details,
    });
  }

  logBusiness(event: string, details?: LogContext): void {
    this.info(`Business: ${event}`, details);
  }

  // ─── Lifecycle ────────────────────────────────────────────

  flush(): void {
    this.fileTransport?.flush();
  }

  destroy(): void {
    this.fileTransport?.destroy();
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════

export const logger = new Logger({
  serviceName: process.env.SERVICE_NAME ?? "ai-agriculture",
  enableConsole: true,
  enableFile: process.env.NODE_ENV === "production",
  enableColors: process.env.NODE_ENV !== "production",
  enableJson: process.env.NODE_ENV === "production",
});

// ═══════════════════════════════════════════════════════════════
// REQUEST LOGGER MIDDLEWARE HELPER
// ═══════════════════════════════════════════════════════════════

export function createRequestLogger() {
  return {
    start: (method: string, path: string) => {
      const start = Date.now();
      return {
        end: (statusCode: number) => {
          const duration = Date.now() - start;
          logger.logRequest(method, path, statusCode, duration);
        },
      };
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// PERFORMANCE TIMER
// ═══════════════════════════════════════════════════════════════

export class PerformanceTimer {
  private start: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.start = performance.now();
  }

  stop(context?: LogContext): number {
    const duration = performance.now() - this.start;

    if (duration > 5000) {
      logger.warn(`Slow operation: ${this.label}`, {
        duration: Math.round(duration),
        ...context,
      });
    } else {
      logger.debug(`Operation completed: ${this.label}`, {
        duration: Math.round(duration),
        ...context,
      });
    }

    return duration;
  }
}

// ═══════════════════════════════════════════════════════════════
// STRUCTURED ERROR LOGGER
// ═══════════════════════════════════════════════════════════════

export function logError(
  error: Error,
  context?: LogContext & { requestId?: string; userId?: string }
): void {
  logger.error(error.message, error, {
    ...context,
    name: error.name,
    ...(error as { code?: string }).code ? { code: (error as { code: string }).code } : {},
  });
}

export function logFatal(error: Error, context?: LogContext): void {
  logger.fatal(error.message, error, context);
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { Logger, LogLevel };
export type { LogContext, LogEntry, LoggerOptions };
export default logger;
