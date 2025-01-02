import * as path from "@std/path";
import crypto from "node:crypto";
import type { Config } from "./types.ts";
export type { Config } from "./types.ts";

export const from = async (path: string): Promise<Config> => {
  const config = await importConfig(path);
  if (config === null) {
    throw new Error("No config file found");
  }
  return {
    ...defaults,
    ...secrets,
    ...config,
  };
};

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const SECRETS_FILE: string = path.join(__dirname, "..", "..", "secrets.json");
const PORT: number = parseInt(Deno.env.get("PORT") ?? "8080") || 8080;
const DATABASE_URL = Deno.env.get("DATABASE_URL");
const ENV = Deno.env.get("ENV_TYPE") || Deno.env.get("NODE_ENV");

export const generateSecrets = () => {
  try {
    const data = Deno.readTextFileSync(SECRETS_FILE);
    return JSON.parse(data);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      const secrets = {
        sessionSecret: crypto.randomBytes(64).toString("hex"),
      };
      Deno.writeTextFileSync(SECRETS_FILE, JSON.stringify(secrets, null, 2));
      return secrets;
    }
    console.log("Error reading secrets file", e);
    Deno.exit(1);
  }
};

const defaults: Partial<Config> = {
  port: PORT,
  databaseUrl: DATABASE_URL,
  // https://expressjs.com/en/guide/behind-proxies.html
  trustProxy: "uniquelocal",
  cors: [
    /https?:\/\/localhost(:[0-9]{,4})?/,
  ],
  plugins: [],
  storage: {
    type: "fs",
    directory: path.join(Deno.cwd(), "..", "..", "uploads"),
  },
  baseUrl: "http://localhost:8080",
};

const secrets = generateSecrets();

export async function load(): Promise<Config> {
  if (ENV === "test") {
    return await importTestConfig();
  }
  return await loadConfig();
}
async function loadConfig(): Promise<Config> {
  let config;
  const configFiles = [
    "chat.config.ts",
    "chat.config.js",
    "chat.config.mjs",
    "chat.config.json",
  ];

  for await (const file of configFiles) {
    config = await importConfig(file);
    if (config !== null) {
      break;
    }
  }
  if (config === null) {
    console.warn("No config file found - using defaults");
    return {
      ...defaults,
      ...secrets,
    };
  }

  return {
    ...defaults,
    ...secrets,
    ...config,
  };
}

async function importTestConfig(): Promise<Config> {
  let config;
  const configFiles = [
    "tests/chat.config.tests.ts",
    "tests/chat.config.tests.js",
    "tests/chat.config.tests.mjs",
    "tests/chat.config.tests.json",
  ];

  for await (const file of configFiles) {
    config = await importConfig(file);
    if (config !== null) {
      break;
    }
  }
  if (config === null) {
    if (Deno.env.get("DEBUG")) {
      console.log("No test config found, trying to load default config");
    }
    return await loadConfig();
  }

  return {
    ...defaults,
    ...secrets,
    ...config,
  };
}

async function importConfig(file: string): Promise<Config | null> {
  const ext = path.extname(file);
  if (ext === ".ts" || ext === ".js" || ext === ".mjs") {
    return await importScript(file);
  }
  if (ext === ".json") {
    return await loadJSON(file);
  }
  throw new Error(`Internal error: invalid config file extension ${ext}`);
}

async function importScript(file: string): Promise<Config | null> {
  try {
    const absPath = path.isAbsolute(file) ? file : path.join("..", "..", file);
    if (Deno.env.get("DEBUG")) {
      console.log("Trying config file path", absPath);
    }
    const { default: config } = await import(absPath);
    return config as Config;
  } catch (e) {
    if (Deno.env.get("DEBUG")) {
      console.debug(e);
    }
    return null;
  }
}

function loadJSON(file: string): Config | null {
  try {
    return JSON.parse(Deno.readTextFileSync(file));
  } catch {
    return null;
  }
}
