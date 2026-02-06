import type { Meta, StoryObj } from "@storybook/react";
import { FormInput, FormTextArea, FormLabel, FormGroup, FormHelpText } from "./FormInput";

const meta: Meta = {
  title: "Atoms/FormInput",
  parameters: {
    layout: "centered",
  },
};

export default meta;

export const Input: StoryObj = {
  render: () => (
    <FormGroup style={{ width: 300 }}>
      <FormLabel>Channel name</FormLabel>
      <FormInput placeholder="e.g. marketing" />
      <FormHelpText>Names must be lowercase, without spaces.</FormHelpText>
    </FormGroup>
  ),
};

export const TextArea: StoryObj = {
  render: () => (
    <FormGroup style={{ width: 300 }}>
      <FormLabel>Description</FormLabel>
      <FormTextArea placeholder="What's this channel about?" />
      <FormHelpText>Let people know what this channel is for.</FormHelpText>
    </FormGroup>
  ),
};

export const AllVariants: StoryObj = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, width: 300 }}>
      <FormGroup>
        <FormLabel>Text Input</FormLabel>
        <FormInput placeholder="Enter text..." />
        <FormHelpText>This is help text.</FormHelpText>
      </FormGroup>
      <FormGroup>
        <FormLabel>Text Area</FormLabel>
        <FormTextArea placeholder="Enter longer text..." />
        <FormHelpText>This is help text for textarea.</FormHelpText>
      </FormGroup>
    </div>
  ),
};
