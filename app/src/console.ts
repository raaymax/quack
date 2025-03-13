const { log } = console;

console.log = (...args) => {
  log.apply(console, args);
  log.apply(console, [new Error().stack]);
};
