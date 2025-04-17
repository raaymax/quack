import react from "@vitejs/plugin-react";
import deno from "@deno/vite-plugin";
import { VitePWA } from "vite-plugin-pwa";

import path from "node:path";
import process from "node:process";
import { defineConfig } from "vite";

const __dirname = new URL(".", import.meta.url).pathname;
const sslPath = path.join(__dirname, "../ssl/");

export default defineConfig(({ command }) => ({
  define: {
    APP_VERSION: JSON.stringify(process.env.APP_VERSION),
    APP_NAME: JSON.stringify(process.env.APP_NAME),
    API_URL: JSON.stringify(""),
  },
  server: command === "serve"
    ? {
      https: {
        key: Deno.readTextFileSync(path.join(sslPath, "key.pem")),
        cert: Deno.readTextFileSync(path.join(sslPath, "cert.pem")),
      },
      port: 3000,
      strictPort: true,
      hmr: {
        overlay: false,
      },
      watch: {
        ignored: ["**/src-tauri/**"],
      },
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
        },
      },
    }
    : {},
  resolve: {
    alias: {
      "@quack/encryption": path.resolve(__dirname, "../deno/encryption/mod.ts"),
      "@quack/api": path.resolve(__dirname, "../deno/api/mod.ts"),
      "@quack/tools": path.resolve(__dirname, "../deno/tools/mod.ts"),
    },
  },
  plugins: [
    deno(),
    react(),
    VitePWA({
      injectRegister: "auto",
      strategies: "injectManifest",
      srcDir: "./src",
      filename: "sw.ts",
      devOptions: {
        enabled: true,
        type: "module",
      },
      manifest: {
        id: "io.codecat.chat.pwa",
        name: "Quack",
        short_name: "quack",
        start_url: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#1a1d21",
        theme_color: "#673ab8",
        icons: [
          {
            src: "/icons/android_192x192.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "any maskable",
          },
          {
            src: "/icons/android_512x512.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "any maskable",
          },
        ],
        share_target: {
          action: "/share",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            title: "title",
            text: "text",
            url: "url",
          },
        },
      },
    }),
  ],
}));
