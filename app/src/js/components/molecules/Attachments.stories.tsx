import type { Meta, StoryObj } from "@storybook/react";

import { Attachment } from "./Attachments.tsx";
import { FileModel } from "../../core/models/files";

// Use the simpler Attachment component for stories since Attachments
// requires a complex FilesModel that's hard to mock
const meta: Meta<typeof Attachment> = {
  component: Attachment,
  argTypes: {
    onDelete: { action: "delete" },
  },
};

export default meta;
type Story = StoryObj<typeof Attachment>;

// Type for mock FileModel with only the properties used by Attachment
type MockFileModel = Pick<
  FileModel,
  "clientId" | "fileName" | "contentType" | "fileSize" | "status" | "progress"
>;

// Create mock FileModel-like objects for stories
const createMockFile = (overrides: Partial<MockFileModel>): MockFileModel => ({
  clientId: "file-1",
  fileName: "document.pdf",
  contentType: "application/pdf",
  fileSize: 1024000,
  status: "pending",
  progress: 0,
  ...overrides,
});

export const Pending: Story = {
  args: {
    model: createMockFile({
      fileName: "uploading-file.pdf",
      status: "pending",
      progress: 0,
    }) as FileModel,
  },
};

export const Uploading: Story = {
  args: {
    model: createMockFile({
      fileName: "uploading-file.pdf",
      status: "uploading",
      progress: 45,
    }) as FileModel,
  },
};

export const AlmostDone: Story = {
  args: {
    model: createMockFile({
      fileName: "almost-done.pdf",
      status: "uploading",
      progress: 95,
    }) as FileModel,
  },
};

export const Completed: Story = {
  args: {
    model: createMockFile({
      fileName: "completed-file.pdf",
      status: "ok",
      progress: 100,
    }) as FileModel,
  },
};

export const LongFileName: Story = {
  args: {
    model: createMockFile({
      fileName: "this-is-a-very-long-filename-that-should-be-truncated.pdf",
      status: "ok",
      progress: 100,
    }) as FileModel,
  },
};

export const ImageFile: Story = {
  args: {
    model: createMockFile({
      fileName: "photo.jpg",
      contentType: "image/jpeg",
      fileSize: 2048000,
      status: "ok",
      progress: 100,
    }) as FileModel,
  },
};
