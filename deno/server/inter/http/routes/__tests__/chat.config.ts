export default {
  databaseUrl: "mongodb://chat:chat@localhost:27017/tests?authSource=admin",
  storage: {
    type: "memory",
  },
  trustProxy: 1,
  loginRateLimit: {
    maxFailuresPerIp: 100_000,
  },
};
