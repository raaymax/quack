import styled from "styled-components";
import { ClassNames, cn } from "../../utils";

export type FileCategory =
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "archive"
  | "code"
  | "document"
  | "spreadsheet"
  | "presentation"
  | "text"
  | "file";

type CategoryStyle = {
  icon: string;
  color: string;
};

const CATEGORY_STYLES: Record<FileCategory, CategoryStyle> = {
  image: { icon: "fa-file-image", color: "#30a46c" },
  video: { icon: "fa-file-video", color: "#8e4ec6" },
  audio: { icon: "fa-file-audio", color: "#0d9488" },
  pdf: { icon: "fa-file-pdf", color: "#e5484d" },
  archive: { icon: "fa-file-zipper", color: "#f5a623" },
  code: { icon: "fa-file-code", color: "#3b82f6" },
  document: { icon: "fa-file-word", color: "#2b6cb0" },
  spreadsheet: { icon: "fa-file-excel", color: "#21a366" },
  presentation: { icon: "fa-file-powerpoint", color: "#d24726" },
  text: { icon: "fa-file-lines", color: "#6b7280" },
  file: { icon: "fa-file", color: "#6b7280" },
};

const CODE_TYPES = [
  "application/json",
  "application/javascript",
  "application/xml",
  "application/x-sh",
];

export const getFileCategory = (contentType: string): FileCategory => {
  const type = contentType?.toLowerCase() ?? "";

  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf") return "pdf";
  if (
    type.includes("zip") ||
    type.includes("compressed") ||
    type.includes("tar") ||
    type.includes("rar") ||
    type.includes("7z")
  ) {
    return "archive";
  }
  if (type.includes("word") || type === "application/msword") return "document";
  if (type.includes("sheet") || type.includes("excel")) return "spreadsheet";
  if (type.includes("presentation") || type.includes("powerpoint")) {
    return "presentation";
  }
  if (CODE_TYPES.includes(type) || type.includes("xml")) return "code";
  if (type.startsWith("text/")) return "text";

  return "file";
};

const Container = styled.div<{ $size: number; $color: string }>`
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.$color};

  i {
    font-size: ${(props) => props.$size}px;
    line-height: 1;
  }
`;

type FileTypeIconProps = {
  contentType: string;
  size?: number;
  className?: ClassNames;
};

export const FileTypeIcon = (
  { contentType, size = 20, className }: FileTypeIconProps,
) => {
  const category = getFileCategory(contentType);
  const { icon, color } = CATEGORY_STYLES[category];

  return (
    <Container
      className={cn("file-type-icon", category, className)}
      $size={size}
      $color={color}
    >
      <i className={`fa-solid ${icon}`} />
    </Container>
  );
};
