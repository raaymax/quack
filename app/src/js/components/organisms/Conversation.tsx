import { useCallback, useEffect } from "react";
import styled from "styled-components";
import { MessageList } from "./MessageListScroller";
import { Input } from "./Input";
import { HoverProvider } from "../contexts/hover";
import { LoadingIndicator } from "../molecules/LoadingIndicator";
import { ClassNames, cn } from "../../utils";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";
import { client } from "../../core";

export const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  & > .message-list-container {
    flex: 0 100 100%;
  }
  & > .input-container {
    flex: 100 0 auto;
  }
`;

export const Conversation = observer(
  (
    { channelId, parentId, className }: {
      channelId: string;
      parentId?: string;
      className?: ClassNames;
    },
  ) => {
    const app = useApp();
    const threadModel = app.getThread(channelId, parentId);
    if (!threadModel) return null;
    const latest = threadModel.messages.latest;

    const drop = useCallback(async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const { files } = e.dataTransfer;
      app.getThread(channelId, parentId).input.files.uploadMany(files);
    }, [channelId, parentId]);

    const dragOverHandler = useCallback((ev: React.DragEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
    }, []);

    const bumpProgress = useCallback(() => {
      if (latest?.id) client.api.updateReadReceipt(latest.id);
    }, [latest]);

    useEffect(() => {
      app.getMessages(channelId, parentId).load();
    }, []);

    useEffect(() => {
      addEventListener("focus", bumpProgress);
      return () => {
        removeEventListener("focus", bumpProgress);
      };
    }, [bumpProgress]);

    return (
      <Container
        className={cn(className)}
        onDrop={drop}
        onDragOver={dragOverHandler}
      >
        <HoverProvider>
          <MessageList
            model={threadModel}
            className="message-list-container"
            onDateChange={(date) => threadModel.messages.setDate(date)}
            onScrollTop={async () => {
              await threadModel.messages?.loadPrev();
              threadModel.messages.setMode("archive");
              bumpProgress();
            }}
            onScrollBottom={async () => {
              const count = await threadModel.messages?.loadNext();
              if (count === 1) {
                threadModel.messages.setMode("live");
              }
              bumpProgress();
            }}
          />
          <LoadingIndicator />
          <Input className="input-container" model={threadModel.input} />
        </HoverProvider>
      </Container>
    );
  },
);
