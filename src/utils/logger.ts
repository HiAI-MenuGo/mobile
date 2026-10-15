/**
 * Logger thống nhất cho mobile.
 * - Dev: in màu (ansi) ra console Metro/Flipper
 * - Prod (EAS build): chỉ ghi error/warn, info bị mute
 * - Không log HTTP method (GET/POST/PATCH/PUT) để tránh rối
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = __DEV__ && !process.env.EXPO_PUBLIC_SILENT_LOGS;
const LOG_LEVEL: LogLevel = (process.env.EXPO_PUBLIC_LOG_LEVEL as LogLevel) || (isDev ? 'debug' : 'warn');

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT = LEVELS[LOG_LEVEL];

const COLORS = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m',
};

function format(level: LogLevel, tag: string, message: string, meta?: any): string {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const color = COLORS[level];
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${color}[${ts}] [${level.toUpperCase()}] [${tag}]${COLORS.reset}: ${message}${metaStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return LEVELS[level] >= CURRENT;
}

export const logger = {
  debug: (tag: string, message: string, meta?: any) => {
    if (shouldLog('debug')) console.debug(format('debug', tag, message, meta));
  },
  info: (tag: string, message: string, meta?: any) => {
    if (shouldLog('info')) console.info(format('info', tag, message, meta));
  },
  warn: (tag: string, message: string, meta?: any) => {
    if (shouldLog('warn')) console.warn(format('warn', tag, message, meta));
  },
  error: (tag: string, message: string, meta?: any) => {
    if (shouldLog('error')) console.error(format('error', tag, message, meta));
  },
  
  // Helper: log error có stack
  errorWithStack: (tag: string, err: unknown, extra?: string) => {
    if (shouldLog('error')) {
      const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
      console.error(format('error', tag, extra ? `${extra}: ${msg}` : msg));
    }
  },
};

/**
 * Tag gợi ý theo module:
 * - API: 'API'          (chỉ warn/error)
 * - Socket: 'SOCKET'
 * - Auth: 'AUTH'
 * - Orders: 'ORDERS'
 * - Tables: 'TABLES'
 * - Revenue: 'REVENUE'
 * - Menu: 'MENU'
 * - Inventory: 'INV'
 * - Cashier: 'CASHIER'
 * - Settings: 'SETTINGS'
 * - History: 'HISTORY'
 */
export function createTaggedLogger(tag: string) {
  return {
    debug: (msg: string, meta?: any) => logger.debug(tag, msg, meta),
    info: (msg: string, meta?: any) => logger.info(tag, msg, meta),
    warn: (msg: string, meta?: any) => logger.warn(tag, msg, meta),
    error: (msg: string, meta?: any) => logger.error(tag, msg, meta),
    errorWithStack: (err: unknown, extra?: string) => logger.errorWithStack(tag, err, extra),
  };
}

export default logger;