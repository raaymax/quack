import type { Meta, StoryObj } from "@storybook/react";

import "../../styles.ts";
import { Link } from "../../js/components/atoms/Link";

const meta: Meta<typeof Link> = {
  component: Link,
};

export default meta;
type Story = StoryObj<typeof Link>;

export const Primary: Story = {
  args: {
    href: "https://example.com",
    children: "Example",
  },
};
