import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Icon, IconNames } from "../atoms/Icon";
import { ClassNames, cn } from "../../utils";

export type ViewMode = "list" | "grid";
export type ChannelType = "PUBLIC" | "PRIVATE" | "DIRECT";

const CHANNEL_ICON: Record<ChannelType, IconNames> = {
  PUBLIC: "hash",
  PRIVATE: "lock",
  DIRECT: "user",
};

const MOBILE = "@media (max-width: 540px)";

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid ${(props) => props.theme.Strokes};
  background-color: ${(props) => props.theme.Input.Background};

  .channel {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;

    .channel-icon {
      color: ${(props) => props.theme.Labels};
      align-self: center;
    }

    .channel-name {
      font-size: 16px;
      font-weight: 600;
      color: ${(props) => props.theme.Text};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .count {
      font-size: 13px;
      color: ${(props) => props.theme.Labels};
      white-space: nowrap;
    }
  }

  .spacer {
    flex: 1;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 34px;
    height: 34px;
    border: 1px solid ${(props) => props.theme.Strokes};
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    color: ${(props) => props.theme.Labels};

    &:hover {
      color: ${(props) => props.theme.Text};
    }

    &.active {
      color: ${(props) => props.theme.Text};
      background-color: ${(props) => props.theme.Channel.Background};
    }
  }

  .search-toggle {
    display: none;
  }

  .search {
    position: relative;
    display: flex;
    align-items: center;

    .icon.search-icon {
      position: absolute;
      left: 10px;
      color: ${(props) => props.theme.Labels};
      pointer-events: none;
    }

    input {
      width: 200px;
      height: 34px;
      padding: 0 12px 0 30px;
      border: 1px solid ${(props) => props.theme.Strokes};
      border-radius: 8px;
      background-color: ${(props) => props.theme.Input.Background};
      color: ${(props) => props.theme.Text};
      font-size: 13px;
      outline: none;

      &:focus {
        border-color: ${(props) => props.theme.Labels};
      }
    }

    .search-close {
      display: none;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 34px;
      height: 34px;
      margin-left: 4px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
      color: ${(props) => props.theme.Labels};
    }
  }

  .view-toggle {
    display: flex;
    flex: 0 0 auto;
    border: 1px solid ${(props) => props.theme.Strokes};
    border-radius: 8px;
    overflow: hidden;

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border: 0;
      background: transparent;
      cursor: pointer;
      color: ${(props) => props.theme.Labels};

      &:hover {
        color: ${(props) => props.theme.Text};
      }

      &.active {
        color: ${(props) => props.theme.Text};
        background-color: ${(props) => props.theme.Channel.Background};
      }
    }
  }

  ${MOBILE} {
    gap: 8px;

    .search-toggle {
      display: flex;
    }

    .search {
      display: none;
    }

    &.search-open {
      .channel,
      .spacer,
      .search-toggle,
      .date-toggle,
      .view-toggle,
      .close-btn {
        display: none;
      }

      .search {
        display: flex;
        flex: 1;

        input {
          width: 100%;
        }

        .search-close {
          display: flex;
        }
      }
    }
  }
`;

type FilesToolbarProps = {
  channelName: string;
  channelType?: ChannelType;
  count: number;
  query: string;
  onQueryChange: (value: string) => void;
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
  showDates: boolean;
  onToggleDates: () => void;
  onClose?: () => void;
  className?: ClassNames;
};

export const FilesToolbar = ({
  channelName,
  channelType = "PUBLIC",
  count,
  query,
  onQueryChange,
  view,
  onViewChange,
  showDates,
  onToggleDates,
  onClose,
  className,
}: FilesToolbarProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    onQueryChange("");
  };

  return (
    <Container
      className={cn("files-toolbar", { "search-open": searchOpen }, className)}
    >
      <div className="channel">
        <Icon
          className="channel-icon"
          icon={CHANNEL_ICON[channelType]}
          size={18}
        />
        <span className="channel-name">{channelName}</span>
        <span className="count">
          {count} {count === 1 ? "file" : "files"}
        </span>
      </div>

      <div className="spacer" />

      <button
        type="button"
        title="Search files"
        className="toggle-btn search-toggle"
        onClick={() => setSearchOpen(true)}
      >
        <Icon icon="search" size={14} />
      </button>

      <div className="search">
        <Icon className="search-icon" icon="search" size={14} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search files"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        <button
          type="button"
          title="Close search"
          className="search-close"
          onClick={closeSearch}
        >
          <Icon icon="xmark" size={16} />
        </button>
      </div>

      <button
        type="button"
        title={showDates ? "Hide date separators" : "Show date separators"}
        className={cn("toggle-btn", "date-toggle", { active: showDates })}
        onClick={onToggleDates}
      >
        <Icon icon="calendar" size={14} />
      </button>

      <div className="view-toggle">
        <button
          type="button"
          title="List view"
          className={cn({ active: view === "list" })}
          onClick={() => onViewChange("list")}
        >
          <Icon icon="list" size={14} />
        </button>
        <button
          type="button"
          title="Grid view"
          className={cn({ active: view === "grid" })}
          onClick={() => onViewChange("grid")}
        >
          <Icon icon="grid" size={14} />
        </button>
      </div>

      {onClose && (
        <button
          type="button"
          title="Close"
          className="toggle-btn close-btn"
          onClick={onClose}
        >
          <Icon icon="xmark" size={16} />
        </button>
      )}
    </Container>
  );
};
