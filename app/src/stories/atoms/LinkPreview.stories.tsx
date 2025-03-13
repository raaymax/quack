import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { LinkPreview } from "../../js/components/atoms/LinkPreview";

const meta: Meta<typeof LinkPreview> = {
  component: LinkPreview,
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
