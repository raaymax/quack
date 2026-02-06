import type { Meta, StoryObj } from "@storybook/react";

import { MessageBodyRenderer } from "./MessageBody.tsx";

const meta: Meta<typeof MessageBodyRenderer> = {
  component: MessageBodyRenderer,
};

export default meta;
type Story = StoryObj<typeof MessageBodyRenderer>;

export const PlainText: Story = {
  args: {
    body: [{ line: [{ text: "Hello, world!" }] }],
  },
};

export const MultipleLines: Story = {
  args: {
    body: [
      { line: [{ text: "First line" }] },
      { line: [{ text: "Second line" }] },
      { line: [{ text: "Third line" }] },
    ],
  },
};

export const Bold: Story = {
  args: {
    body: [{ line: [{ text: "This is " }, { bold: [{ text: "bold" }] }, { text: " text" }] }],
  },
};

export const Italic: Story = {
  args: {
    body: [{ line: [{ text: "This is " }, { italic: [{ text: "italic" }] }, { text: " text" }] }],
  },
};

export const Underline: Story = {
  args: {
    body: [
      { line: [{ text: "This is " }, { underline: [{ text: "underlined" }] }, { text: " text" }] },
    ],
  },
};

export const Strike: Story = {
  args: {
    body: [
      {
        line: [
          { text: "This is " },
          { strike: [{ text: "strikethrough" }] },
          { text: " text" },
        ],
      },
    ],
  },
};

export const MixedFormatting: Story = {
  args: {
    body: [
      {
        line: [
          { text: "This has " },
          { bold: [{ text: "bold" }] },
          { text: ", " },
          { italic: [{ text: "italic" }] },
          { text: ", and " },
          { bold: [{ italic: [{ text: "bold italic" }] }] },
          { text: " text." },
        ],
      },
    ],
  },
};

export const InlineCode: Story = {
  args: {
    body: [
      {
        line: [
          { text: "Use " },
          { code: "const x = 42" },
          { text: " to declare a variable." },
        ],
      },
    ],
  },
};

export const Codeblock: Story = {
  args: {
    body: [
      { codeblock: "function hello() {\n  console.log('Hello, world!');\n}" },
    ],
  },
};

export const Blockquote: Story = {
  args: {
    body: [
      { blockquote: [{ line: [{ text: "This is a quoted message." }] }] },
    ],
  },
};

export const BulletList: Story = {
  args: {
    body: [
      {
        bullet: [
          { item: [{ text: "First item" }] },
          { item: [{ text: "Second item" }] },
          { item: [{ text: "Third item" }] },
        ],
      },
    ],
  },
};

export const OrderedList: Story = {
  args: {
    body: [
      {
        ordered: [
          { item: [{ text: "First step" }] },
          { item: [{ text: "Second step" }] },
          { item: [{ text: "Third step" }] },
        ],
      },
    ],
  },
};

export const Link: Story = {
  args: {
    body: [
      {
        line: [
          { text: "Check out " },
          { link: [{ text: "this link" }], _href: "https://example.com" },
          { text: " for more info." },
        ],
      },
    ],
  },
};

export const Emoji: Story = {
  args: {
    body: [
      {
        line: [
          { text: "Hello " },
          { emoji: ":wave:" },
          { text: " How are you? " },
          { emoji: ":smile:" },
        ],
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Note: Emoji rendering depends on emoji data being loaded.",
      },
    },
  },
};

export const EmojiOnly: Story = {
  args: {
    body: [{ emoji: ":thumbsup:" }],
    opts: { emojiOnly: true },
  },
};

export const ComplexMessage: Story = {
  args: {
    body: [
      { line: [{ bold: [{ text: "Project Update" }] }] },
      { br: true },
      {
        line: [
          { text: "Here's what we accomplished this week:" },
        ],
      },
      {
        bullet: [
          {
            item: [
              { text: "Implemented " },
              { code: "useFileUrl" },
              { text: " hook" },
            ],
          },
          { item: [{ text: "Refactored molecules layer" }] },
          {
            item: [
              { text: "Added " },
              { bold: [{ text: "Storybook" }] },
              { text: " stories" },
            ],
          },
        ],
      },
      { br: true },
      {
        blockquote: [
          {
            line: [
              { italic: [{ text: "Clean code is not written by following rules." }] },
            ],
          },
        ],
      },
    ],
  },
};
