export type Config = {
  vapid: {
    publicKey: string;
    privateKey: string;
  };
  trustProxy: boolean | number | string | string[];
  loginRateLimit?: {
    windowMinutes?: number;
    maxFailuresPerIp?: number;
  };
  sessionSecret: string;
  port: number;
  databaseUrl: string;
  cors: (string | RegExp)[];
  plugins?: ((app: unknown, core: unknown) => Promise<void> | void)[];
  webhooks?: {
    url: string;
    events?: string[];
  }[];
  storage: {
    type: "gcs";
    bucket: string;
  } | {
    type: "fs";
    directory: string;
  } | {
    type: "memory";
  };
  baseUrl: string;
};
