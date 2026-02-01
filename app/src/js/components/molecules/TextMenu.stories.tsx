import type { Meta, StoryObj } from "@storybook/react";
import { useState, useRef } from "react";

import "../../../styles.ts";
import { TextMenu } from "./TextMenu.tsx";
import { InputContext, InputContextType } from "../contexts/input.tsx";

type TextMenuOption = {
  label?: string;
  name: string;
  icon?: string;
  url?: string;
};

type TextMenuWrapperProps = {
  open?: boolean;
  options: TextMenuOption[];
  onSelect: (idx: number, e: React.MouseEvent) => void;
  selected?: number;
};

// Wrapper component to provide InputContext
const TextMenuWrapper = (props: TextMenuWrapperProps) => {
  const inputRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(props.selected ?? 0);

  const mockInputContext: InputContextType = {
    input: inputRef,
    fileInput: { current: null },
    currentText: "",
    scope: "root",
    scopeContainer: undefined,
    insert: () => {},
    replace: () => {},
    getRange: () => document.createRange(),
    onPaste: () => {},
    onKeyDown: () => {},
    onInput: () => {},
    onFileChange: () => {},
    wrapMatching: () => {},
    addFile: () => {},
    send: () => {},
    focus: () => {},
  };

  return (
    <div style={{ position: "relative", padding: "100px 20px 20px 20px" }}>
      <InputContext.Provider value={mockInputContext}>
        <div ref={inputRef} style={{ minHeight: "50px" }}>
          <TextMenu
            {...props}
            selected={selected}
            setSelected={setSelected}
          />
        </div>
      </InputContext.Provider>
    </div>
  );
};

const meta: Meta<typeof TextMenu> = {
  component: TextMenu,
  render: (args) => <TextMenuWrapper {...args} />,
};

export default meta;
type Story = StoryObj<typeof TextMenu>;

export const UserSelector: Story = {
  args: {
    open: true,
    options: [
      { name: "John Doe", icon: "fa-solid fa-user" },
      { name: "Katie Smith", icon: "fa-solid fa-user" },
      { name: "Bob Wilson", icon: "fa-solid fa-user" },
    ],
    onSelect: (idx: number) => console.log("Selected:", idx),
    selected: 0,
  },
};

export const ChannelSelector: Story = {
  args: {
    open: true,
    options: [
      { name: "general", icon: "fa-solid fa-hashtag" },
      { name: "random", icon: "fa-solid fa-hashtag" },
      { name: "private-channel", icon: "fa-solid fa-lock" },
    ],
    onSelect: (idx: number) => console.log("Selected:", idx),
    selected: 0,
  },
};

export const EmojiSelector: Story = {
  args: {
    open: true,
    options: [
      { label: "😀", name: ":smile:" },
      { label: "👍", name: ":thumbsup:" },
      { label: "👎", name: ":thumbsdown:" },
      { label: "❌", name: "no emoji" },
    ],
    onSelect: (idx: number) => console.log("Selected:", idx),
    selected: 0,
  },
};

export const Closed: Story = {
  args: {
    open: false,
    options: [
      { name: "Option 1", icon: "fa-solid fa-circle" },
      { name: "Option 2", icon: "fa-solid fa-circle" },
    ],
    onSelect: (idx: number) => console.log("Selected:", idx),
    selected: 0,
  },
};
