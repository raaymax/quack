import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";

const __dirname = new URL(".", import.meta.url).pathname;

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-themes", "@chromatic-com/storybook"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: (config) => {
    config.define = {
      ...config.define,
      APP_VERSION: JSON.stringify("storybook"),
      APP_NAME: JSON.stringify("Quack"),
      API_URL: JSON.stringify(""),
    };
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@quack/encryption": path.resolve(__dirname, "../../deno/encryption/mod.ts"),
        "@quack/api": path.resolve(__dirname, "../../deno/api/mod.ts"),
        "@quack/tools": path.resolve(__dirname, "../../deno/tools/mod.ts"),
      },
    };
    return config;
  },
};
export default config;
