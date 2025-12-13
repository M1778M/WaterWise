export const logger = {
  log: __DEV__ ? console.log : () => {},
  error: console.error,
  warn: __DEV__ ? console.warn : () => {},
  debug: __DEV__ ? console.debug : () => {},
};
