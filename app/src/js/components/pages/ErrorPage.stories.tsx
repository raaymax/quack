import type { Meta, StoryObj } from "@storybook/react";

import { ErrorPage } from "./ErrorPage.tsx";

const meta: Meta<typeof ErrorPage> = {
  component: ErrorPage,
  title: "Pages/ErrorPage",
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    title: {
      control: "text",
      description: "Error title to display",
    },
    description: {
      control: "text",
      description: "Error description message",
    },
    buttons: {
      control: "object",
      description: "Array of button types to show: retry, back, home",
    },
    debug: {
      control: "object",
      description: "Debug info with error message and stack trace",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ErrorPage>;

export const Default: Story = {
  args: {},
};

export const WithDebugInfo: Story = {
  args: {
    debug: {
      error: "TypeError: Cannot read property 'foo' of undefined",
      stack: "at Component.render (app.js:123)\nat processChild (react.js:456)",
    },
  },
};

export const NotFound: Story = {
  args: {
    title: "404",
    description: "The page you're looking for doesn't exist.",
    buttons: ["back", "home"],
  },
};

export const ServerError: Story = {
  args: {
    title: "500",
    description: "Something went wrong on our end. Please try again later.",
    buttons: ["retry", "home"],
  },
};

export const CustomMessage: Story = {
  args: {
    title: "Connection Lost",
    description: [
      "We couldn't connect to the server.",
      "Please check your internet connection.",
    ],
    buttons: ["retry"],
  },
};
