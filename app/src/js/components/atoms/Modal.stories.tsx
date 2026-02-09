import type { Meta, StoryObj } from "@storybook/react";
import { ModalOverlay, ModalContainer, ModalHeader, ModalCloseButton } from "./Modal";
import { Icon } from "./Icon";

const meta: Meta = {
  title: "Atoms/Modal",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Default: StoryObj = {
  render: () => (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <h2>
            <Icon icon="hash" size={24} />
            Modal Title
          </h2>
          <ModalCloseButton onClick={() => alert("Close clicked")} />
        </ModalHeader>
        <p style={{ margin: 0 }}>Modal content goes here.</p>
      </ModalContainer>
    </ModalOverlay>
  ),
};

export const WithForm: StoryObj = {
  render: () => (
    <ModalOverlay>
      <ModalContainer>
        <ModalHeader>
          <h2>Create Something</h2>
          <ModalCloseButton />
        </ModalHeader>
        <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input type="text" placeholder="Enter name..." style={{ padding: 12 }} />
          <button type="submit" style={{ padding: 12 }}>Submit</button>
        </form>
      </ModalContainer>
    </ModalOverlay>
  ),
};
