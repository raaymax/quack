#!/usr/bin/env -S deno run -A
/**
 * Exports mobile-relevant config from chat.config.ts to JSON
 * Run: deno task mobile:config
 */

import config from "@quack/config/load";
import { join } from "@std/path";

// For local dev, use frontend URL (Vite dev server) which proxies API requests
// For production, use the backend URL directly
// Note: capacitor.config.ts converts localhost -> 10.0.2.2 for emulator
// Note: Install ssl/cert.pem as CA certificate on emulator for HTTPS to work
const isLocalDev = config.baseUrl.includes("localhost") ||
  config.baseUrl.includes("127.0.0.1");
const serverUrl = isLocalDev
  ? config.baseUrl.replace(":3001", ":3000").replace("http://", "https://") // Frontend dev server (HTTPS)
  : config.baseUrl;

const mobileConfig = {
  serverUrl,
};

const outPath = join(Deno.cwd(), "mobile", "mobile.config.json");
Deno.writeTextFileSync(outPath, JSON.stringify(mobileConfig, null, 2));
console.log(`Wrote mobile config to ${outPath}`);
console.log(mobileConfig);
