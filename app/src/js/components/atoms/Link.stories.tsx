import type { Meta, StoryObj } from "@storybook/react";

import { Link } from "./Link.tsx";

const meta: Meta<typeof Link> = {
  component: Link,
  title: "Atoms/Link",
  argTypes: {
    href: {
      control: "text",
      description: "URL the link points to",
    },
    children: {
      control: "text",
      description: "Link text content",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Default: Story = {
  args: {
    href: "https://example.com",
    children: "Example Link",
  },
};

export const LongUrl: Story = {
  args: {
    href: "https://example.com/very/long/path/that/should/break/properly",
    children: "https://example.com/very/long/path/that/should/break/properly",
  },
};

export const Email: Story = {
  args: {
    href: "mailto:contact@example.com",
    children: "contact@example.com",
  },
};
