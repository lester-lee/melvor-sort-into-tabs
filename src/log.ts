// Debug mode - set to true for verbose logging
const DEBUG = false;
const PREFIX = "[Sort Into Tabs]";

export type LogFn = (msg: string, ...args: unknown[]) => void;
export interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

export const debug: LogFn = (msg, ...args) => DEBUG && console.log(`${PREFIX} ${msg}`, ...args);
export const info: LogFn = (msg, ...args) => console.log(`${PREFIX} ${msg}`, ...args);
export const warn: LogFn = (msg, ...args) => console.warn(`${PREFIX} ${msg}`, ...args);
export const error: LogFn = (msg, ...args) => console.error(`${PREFIX} ${msg}`, ...args);
