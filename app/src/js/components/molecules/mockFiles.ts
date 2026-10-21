import type { FileItem } from "./FileListItem.tsx";

const svgImage = (color: string, width = 400, height = 300) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect width='${width}' height='${height}' fill='%23${color}'/%3E%3C/svg%3E`;

const UPLOADERS = {
  ada: {
    id: "u-ada",
    name: "Ada Lovelace",
    avatarUrl: svgImage("8e4ec6", 64, 64),
  },
  alan: {
    id: "u-alan",
    name: "Alan Turing",
    avatarUrl: svgImage("0d9488", 64, 64),
  },
  grace: {
    id: "u-grace",
    name: "Grace Hopper",
    avatarUrl: svgImage("2b6cb0", 64, 64),
  },
};

export const mockFiles: FileItem[] = [
  {
    id: "f1",
    fileName: "quarterly-roadmap.pdf",
    contentType: "application/pdf",
    size: 2_400_000,
    createdAt: "2026-07-14T10:12:00.000Z",
    url: "https://example.com/quarterly-roadmap.pdf",
    uploader: UPLOADERS.ada,
  },
  {
    id: "f2",
    fileName: "design-mockup-final.png",
    contentType: "image/png",
    size: 5_800_000,
    createdAt: "2026-07-13T16:40:00.000Z",
    url: svgImage("30a46c"),
    uploader: UPLOADERS.grace,
  },
  {
    id: "f3",
    fileName: "onboarding-walkthrough.mp4",
    contentType: "video/mp4",
    size: 48_200_000,
    createdAt: "2026-07-11T09:05:00.000Z",
    url: "https://example.com/onboarding.mp4",
    uploader: UPLOADERS.alan,
  },
  {
    id: "f4",
    fileName: "budget-2026.xlsx",
    contentType: "application/vnd.ms-excel",
    size: 340_000,
    createdAt: "2026-07-10T14:22:00.000Z",
    url: "https://example.com/budget.xlsx",
    uploader: UPLOADERS.ada,
  },
  {
    id: "f5",
    fileName: "assets-bundle.zip",
    contentType: "application/zip",
    size: 128_400_000,
    createdAt: "2026-07-08T11:00:00.000Z",
    url: "https://example.com/assets.zip",
    uploader: UPLOADERS.grace,
  },
  {
    id: "f6",
    fileName: "api-notes.md",
    contentType: "text/markdown",
    size: 12_800,
    createdAt: "2026-07-07T08:30:00.000Z",
    url: "https://example.com/api-notes.md",
    uploader: UPLOADERS.alan,
  },
  {
    id: "f7",
    fileName: "logo-source.svg",
    contentType: "image/svg+xml",
    size: 24_500,
    createdAt: "2026-07-05T19:14:00.000Z",
    url: svgImage("f5a623"),
    uploader: UPLOADERS.grace,
  },
  {
    id: "f8",
    fileName: "team-photo.jpg",
    contentType: "image/jpeg",
    size: 3_100_000,
    createdAt: "2026-07-02T12:48:00.000Z",
    url: svgImage("e5484d"),
    uploader: UPLOADERS.ada,
  },
];

const OLDER_TEMPLATES = [
  { ext: "pdf", type: "application/pdf" },
  { ext: "png", type: "image/png" },
  { ext: "docx", type: "application/msword" },
  { ext: "zip", type: "application/zip" },
  { ext: "md", type: "text/markdown" },
  { ext: "xlsx", type: "application/vnd.ms-excel" },
];

const IMAGE_COLORS = ["3b82f6", "30a46c", "8e4ec6", "d24726"];

const UPLOADER_LIST = [UPLOADERS.ada, UPLOADERS.alan, UPLOADERS.grace];

const DAY_MS = 24 * 60 * 60 * 1000;

export const makeOlderFiles = (
  count: number,
  before: string,
  seed = 0,
): FileItem[] => {
  const start = new Date(before).getTime();
  return Array.from({ length: count }, (_, i) => {
    const idx = seed + i;
    const template = OLDER_TEMPLATES[idx % OLDER_TEMPLATES.length];
    const uploader = UPLOADER_LIST[idx % UPLOADER_LIST.length];
    const createdAt = new Date(
      start - (i + 1) * (DAY_MS / 2) - idx * 3_600_000,
    ).toISOString();
    const isImage = template.type.startsWith("image/");
    return {
      id: `older-${idx}`,
      fileName: `archived-${idx + 1}.${template.ext}`,
      contentType: template.type,
      size: 40_000 + ((idx * 733) % 9_000_000),
      createdAt,
      url: isImage
        ? svgImage(IMAGE_COLORS[idx % IMAGE_COLORS.length])
        : `https://example.com/archived-${idx + 1}.${template.ext}`,
      uploader,
    };
  });
};
