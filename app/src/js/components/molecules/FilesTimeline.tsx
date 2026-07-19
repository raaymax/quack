import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import styled from "styled-components";
import { DateSeparator } from "../atoms/DateSeparator";
import { Loader } from "../atoms/Loader";
import { FileListItem, type FileItem } from "./FileListItem";
import { FileGridItem } from "./FileGridItem";
import type { ViewMode } from "./FilesToolbar";
import { ClassNames, cn, formatDate } from "../../utils";

const Container = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;

  .older-loader {
    padding: 16px 0;
  }

  .day-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
    padding: 8px 16px 16px;
  }
`;

type DayGroup = {
  key: string;
  date: string;
  files: FileItem[];
};

const groupByDay = (files: FileItem[]): DayGroup[] => {
  const groups: DayGroup[] = [];
  for (const file of files) {
    const key = formatDate(file.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.files.push(file);
    else groups.push({ key, date: file.createdAt, files: [file] });
  }
  return groups;
};

type FilesTimelineProps = {
  files: FileItem[];
  view: ViewMode;
  showDateSeparators?: boolean;
  hasMoreOlder?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  onDownload?: (file: FileItem) => void;
  onRemove?: (file: FileItem) => void;
  className?: ClassNames;
};

export const FilesTimeline = ({
  files,
  view,
  showDateSeparators = true,
  hasMoreOlder = false,
  loadingOlder = false,
  onLoadOlder,
  onDownload,
  onRemove,
  className,
}: FilesTimelineProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevHeight = useRef<number | null>(null);
  const anchored = useRef(false);

  const groups = useMemo(() => groupByDay(files), [files]);

  // Anchor to the newest file (bottom) on first populate.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || anchored.current || files.length === 0) return;
    el.scrollTop = el.scrollHeight;
    anchored.current = true;
  }, [files.length]);

  // Keep the viewport steady when older files are prepended above.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || prevHeight.current === null) return;
    el.scrollTop += el.scrollHeight - prevHeight.current;
    prevHeight.current = null;
  }, [files]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop <= 48 && hasMoreOlder && !loadingOlder) {
      prevHeight.current = el.scrollHeight;
      onLoadOlder?.();
    }
  }, [hasMoreOlder, loadingOlder, onLoadOlder]);

  const renderItems = (items: FileItem[]) =>
    view === "grid"
      ? (
        <div className="day-grid">
          {items.map((file) => (
            <FileGridItem
              key={file.id}
              file={file}
              onDownload={onDownload}
              onRemove={onRemove}
            />
          ))}
        </div>
      )
      : (
        <div className="day-list">
          {items.map((file) => (
            <FileListItem
              key={file.id}
              file={file}
              onDownload={onDownload}
              onRemove={onRemove}
            />
          ))}
        </div>
      );

  return (
    <Container
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn("files-timeline", className)}
    >
      {loadingOlder && <div className="older-loader"><Loader /></div>}

      {showDateSeparators
        ? groups.map((group) => (
          <div className="day-group" key={group.key}>
            <DateSeparator date={group.date} />
            {renderItems(group.files)}
          </div>
        ))
        : renderItems(files)}
    </Container>
  );
};
