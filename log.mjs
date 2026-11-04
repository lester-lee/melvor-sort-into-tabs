// Debug mode - set to true for verbose logging
const DEBUG = false;
const PREFIX = "[Sort Into Tabs]";

export const debug = (msg, ...args) => DEBUG && console.log(`${PREFIX} ${msg}`, ...args);
export const info = (msg, ...args) => console.log(`${PREFIX} ${msg}`, ...args);
export const warn = (msg, ...args) => console.warn(`${PREFIX} ${msg}`, ...args);
export const error = (msg, ...args) => console.error(`${PREFIX} ${msg}`, ...args);
