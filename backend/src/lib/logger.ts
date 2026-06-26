import { environment } from '../config/index.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LogLevelMap: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel =
  LogLevelMap[environment.logLevel as LogLevel] || LogLevelMap.info;

const formatMessage = (level: LogLevel, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${dataStr}`;
};

export const logger = {
  debug: (message: string, data?: any) => {
    if (LogLevelMap.debug >= currentLogLevel) {
      console.debug(formatMessage('debug', message, data));
    }
  },
  info: (message: string, data?: any) => {
    if (LogLevelMap.info >= currentLogLevel) {
      console.log(formatMessage('info', message, data));
    }
  },
  warn: (message: string, data?: any) => {
    if (LogLevelMap.warn >= currentLogLevel) {
      console.warn(formatMessage('warn', message, data));
    }
  },
  error: (message: string, data?: any) => {
    if (LogLevelMap.error >= currentLogLevel) {
      console.error(formatMessage('error', message, data));
    }
  },
};
