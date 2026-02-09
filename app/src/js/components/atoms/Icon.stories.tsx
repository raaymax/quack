import type { Meta, StoryObj } from "@storybook/react";

import { Icon } from "./Icon.tsx";

const meta: Meta<typeof Icon> = {
  component: Icon,
  title: "Atoms/Icon",
  argTypes: {
    icon: {
      control: "select",
      options: [
        "star", "bars", "emojis", "plus", "xmark", "circle-xmark", "check",
        "send", "hash", "delete", "edit", "icons", "reply", "thumbtack",
        "down", "search", "refresh", "back", "lock", "logout", "system-user",
        "user", "smile", "moon", "sun", "carrot", "vail",
      ],
      description: "Icon name from the icon map",
    },
    size: {
      control: { type: "number", min: 12, max: 64, step: 4 },
      description: "Icon size in pixels",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Default: Story = {
  args: {
    icon: "star",
    size: 24,
  },
};

export const Small: Story = {
  args: {
    icon: "hash",
    size: 16,
  },
};

export const Large: Story = {
  args: {
    icon: "user",
    size: 48,
  },
};

export const AllIcons: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {[
        "star", "bars", "emojis", "plus", "xmark", "circle-xmark", "check",
        "send", "hash", "delete", "edit", "icons", "reply", "thumbtack",
        "down", "search", "refresh", "back", "lock", "logout", "system-user",
        "user", "smile", "moon", "sun", "carrot", "vail",
      ].map((icon) => (
        <div key={icon} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <Icon icon={icon as any} size={24} />
          <span style={{ fontSize: 10, color: "#666" }}>{icon}</span>
        </div>
      ))}
    </div>
  ),
};
