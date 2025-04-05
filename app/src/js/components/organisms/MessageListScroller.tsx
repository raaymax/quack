import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import {
  MessageListRenderer,
  MessageListRendererProps,
} from "./MessageListRenderer";
import { Message as MessageType } from "../../types";
import { ClassNames, cn } from "../../utils";
import { observer } from "mobx-react-lite";
import { autorun } from "mobx";
import { ThreadModel } from "../../core/models/thread";

const ListContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
  position: relative;
  overflow-y: scroll;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scrollbar-width: none;

  .space {
    height: 50px;
  }
`;

const getMax = (list: MessageType[]) =>
  list.reduce(
    (acc, item) => Math.max(acc, new Date(item.createdAt).getTime()),
    new Date("1970-01-01").getTime(),
  );

type MessageListProps = MessageListRendererProps & {
  model: ThreadModel;
  renderer?: React.ComponentType<MessageListRendererProps>;
  onScrollTop?: () => void;
  onScrollBottom?: () => void;
  onDateChange?: (date: Date) => void;
  date?: Date;
  className?: ClassNames;
};

export const MessageList = observer((props: MessageListProps) => {
  const Renderer = props.renderer ?? MessageListRenderer;
  const {
    model,
    onScrollTop,
    onScrollBottom,
    onDateChange,
    date,
    ...rest
  } = props;
  const element = useRef<HTMLDivElement>(null);
  const [oldList, setOldList] = useState<MessageType[]>([]);
  const [current, setCurrent] = useState<
    [Date | undefined, DOMRect | undefined]
  >([date, undefined]);
  const [selected, setSelected] = useState<string | null>();
  const [list, setList] = useState<MessageType[]>([]);

  useEffect(() => {
    autorun(() => {
      setList(model.messages?.getAll() || []);
    });
  }, [model]);

  const detectDate = useCallback((e: React.SyntheticEvent) => {
    const target = e.target as HTMLElement;
    const c = target.getBoundingClientRect();
    const r = [...target.children]
      .filter((child) => child.className.includes("message"))
      .find((child) => {
        const rect = child.getBoundingClientRect();
        return rect.y < c.height / 2 + 50;
      });
    if (r) {
      const dataDate = r.getAttribute("data-date");
      if (setCurrent) {
        setCurrent([new Date(dataDate ?? ""), r.getBoundingClientRect()]);
      }
      if (onDateChange && dataDate) onDateChange(new Date(dataDate));
    }
  }, [setCurrent, onDateChange]);

  // fix scroll position when scrolling and new messages are added/removed from the list
  useEffect(() => {
    if (!element?.current) return;
    if (list === oldList) return;
    const getRect = (): DOMRect | undefined => {
      if (!element.current) return;
      return [...element.current.children]
        ?.find((child) =>
          child.getAttribute("data-date") === current[0]?.toISOString()
        )
        ?.getBoundingClientRect();
    };
    const max = getMax(list);
    const oldMax = getMax(oldList);
    if (new Date(max).toISOString() !== new Date(oldMax).toISOString()) {
      const rect = getRect();
      if (!rect) return;
      if (model.messages.mode === "live") {
        element.current.scrollTop = 0;
      } else if (rect && current && current[1]?.y) {
        element.current.scrollTop += rect.y - current[1].y;
      }
      setCurrent([current[0], rect]);
    }
    setOldList(list);
  }, [list, model.messages.mode, oldList, setOldList, current, setCurrent]);

  // scroll selected item into view
  useEffect(() => {
    if (!element.current) return;
    if (model.messages.selected === selected) return;
    const found = [...element.current.children]
      ?.find((child) =>
        child.getAttribute("data-id") === model.messages.selected
      );

    if (found) {
      setTimeout(() => {
        found.scrollIntoView({ block: "center" });
      }, 100);
      setTimeout(() => {
        found.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 500);
      setSelected(model.messages.selected);
    }
  }, [model.messages.selected, selected, setSelected]);

  const scroll = useCallback((e: React.SyntheticEvent) => {
    detectDate(e);
    if (!element.current) return;
    if (list !== oldList) return;

    if (Math.floor(Math.abs(element.current.scrollTop)) <= 1) {
      if (onScrollBottom) onScrollBottom();
    } else if (
      Math.floor(Math.abs(
        element.current.scrollHeight - element.current.offsetHeight +
          element.current.scrollTop,
      )) <= 1
    ) {
      if (onScrollTop) onScrollTop();
    }
  }, [detectDate, list, oldList, onScrollTop, onScrollBottom]);

  return (
    <ListContainer
      ref={element}
      onScroll={scroll}
      className={cn("message-list-scroll", props.className)}
    >
      <div className="v-space">&nbsp;</div>
      <Renderer model={model} {...rest} />
    </ListContainer>
  );
});

export default MessageList;
