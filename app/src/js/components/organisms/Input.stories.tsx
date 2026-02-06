import type { Meta, StoryObj } from "@storybook/react";
import styled from "styled-components";

import { Input } from "./Input.tsx";
import { app } from "../../core/index.ts";

// Container that mimics the conversation layout
const StoryContainer = styled.div`
  width: 600px;
  height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: ${({ theme }) => theme.Chatbox.Background};
`;

// Helper to get input model at render time (after loaders run)
const getInputModel = () => {
  // Use "test" channel which is created in preview.tsx loaders
  const channel = app.channels.get("test");
  if (!channel) return undefined;
  return channel.getThread(null, { init: true }).input;
};

const meta: Meta<typeof Input> = {
  component: Input,
  title: "Organisms/Input",
  parameters: {
    layout: "centered",
  },
  argTypes: {
    model: {
      control: false,
      description: "Input model from thread context",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => {
    const model = getInputModel();
    if (!model) return <div>Input model not available. Channel "test" may not be initialized.</div>;
    return (
      <StoryContainer>
        <Input model={model} />
      </StoryContainer>
    );
  },
};

export const Wide: Story = {
  render: () => {
    const model = getInputModel();
    if (!model) return <div>Input model not available.</div>;
    return (
      <div style={{ width: "800px", height: "200px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <Input model={model} />
      </div>
    );
  },
};

export const Narrow: Story = {
  render: () => {
    const model = getInputModel();
    if (!model) return <div>Input model not available.</div>;
    return (
      <div style={{ width: "350px", height: "200px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <Input model={model} />
      </div>
    );
  },
};
