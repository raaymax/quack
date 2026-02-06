import type { Meta, StoryObj } from "@storybook/react";

import { LinkPreview } from "./LinkPreview.tsx";

const meta: Meta<typeof LinkPreview> = {
  component: LinkPreview,
  title: "Atoms/LinkPreview",
  argTypes: {
    link: {
      control: "object",
      description: "Link preview data with url, siteName, title, description, and images",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LinkPreview>;

export const Primary: Story = {
  args: {
    link: {
      url: "https://example.com",
      siteName: "Example",
      title: "Example",
      description: "Example description",
      images: ["https://picsum.photos/200"],
    },
  },
};
