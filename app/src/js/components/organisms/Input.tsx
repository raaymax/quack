import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";

import { EmojiDescriptor } from "../../types";
import { buildEmojiNode, ClassNames, cn, isMobile } from "../../utils";
import { InputProvider } from "../contexts/input";
import { useInput } from "../contexts/useInput";

import { StatusLine } from "../atoms/StatusLine";
import { Toolbar } from "../atoms/Toolbar";

import { Attachments } from "../molecules/Attachments";
import { EmojiSelector } from "../molecules/InputEmojiSelector";
import { ChannelSelector } from "../molecules/InputChannelSelector";
import { UserSelector } from "../molecules/InputUserSelector";
import { ButtonWithIcon } from "../molecules/ButtonWithIcon";

import { EmojiSearch } from "./EmojiSearch";

import { observer } from "mobx-react-lite";
import { InputModel } from "../../core/models/input";
import { client } from "../../core";
import { useApp } from "../contexts/appState";

export const InputContainer = styled.div`
  position: relative;
  max-height: 50%;
  max-width: 100%;
  font-size: 16px;
  margin: 0px 16px 32px 16px;
  display: flex;
  padding: 0;
  flex-direction: column;
  color: ${(props) => props.theme.Text};

  & > .input-box {
    border: 1px solid ${(props) => props.theme.Strokes};
    background-color: ${(props) => props.theme.Input.Background};
    padding: 8px 16px;
    height: 100%;
    border-radius: 8px;
    overflow-y: auto;

    .cta {
      color: ${(props) => props.theme.Labels};
      position: absolute;
      top: 12px;
      left: 18px;
      font-size: 16px;
      font-style: normal;
      font-weight: 500;
      line-height: 24px;
      pointer-events: none;
    }

    .controls {
      position: absolute;
      right: 16px;
      top: 8px;
      width: auto;
      height: 32px;
      button {
        height: 32px;
      }
    }
    .scroller {
      .input {
        border: 0;
        padding: 0px;
        height: fit-content;
        margin: 4px 0;
        width: calc(100% - ${isMobile() ? 96 : 64}px);

        font-size: 16px;
        font-style: normal;
        font-weight: 500;
        line-height: 24px;

        &:focus-visible {
          outline: none;
        }
      }

      .input-attachments {
        height: fit-content;
      }
    }
  }

  .info {
    position: absolute;
    bottom: -16px;
    left: 0;
    line-height: 16px;
    padding: 0px 16px;
    font-weight: 300;
    vertical-align: middle;
    font-size: 10px;
  }

  .info.error {
    color: #852007;
  }

  .info.action:hover {
    cursor: pointer;
    font-weight: bold;
  }

  .channel {
    color: #3080a0;
  }

  .emoji img {
    width: 1.5em;
    height: 1.5em;
    display: inline-block;
    vertical-align: bottom;
  }

  .user {
    color: ${(props) => props.theme.mentionsColor};
  }
  .cmp-emoji-search {
    position: absolute;
    bottom: 70px;
    right: 16px;
    z-index: 100;
  }
`;

type InputFormProps = {
  className?: ClassNames;
  model: InputModel;
};

export const InputForm = observer(({ className, model }: InputFormProps) => {
  const app = useApp();
  const [showEmojis, setShowEmojis] = useState(false);
  const {
    input,
    onPaste,
    onInput,
    onKeyDown,
    onFileChange,
    fileInput,
    focus,
    addFile,
    insert,
    send,
    scope,
    currentText,
    wrapMatching,
  } = useInput();

  const onEmojiInsert = useCallback((emoji: EmojiDescriptor) => {
    insert(buildEmojiNode(emoji, client.api.getUrl));
    setShowEmojis(!showEmojis);
    focus();
  }, [showEmojis, focus, insert, setShowEmojis]);

  const ctrl = useCallback((e: KeyboardEvent) => {
    if (scope === "root" && currentText.match(/`[^`]+$/) && e.key === "`") {
      wrapMatching(/`([^`]+)$/, "code");
      e.preventDefault();
    }
  }, [currentText, scope, wrapMatching]);

  useEffect(() => {
    const { current } = input;
    if (!current) return;
    current.addEventListener("keydown", ctrl);
    return () => {
      current.removeEventListener("keydown", ctrl);
    };
  }, [input, ctrl]);

  return (
    <InputContainer className={cn(className)}>
      <div className="input-box">
        <div className="scroller">
          <div
            data-scope="root"
            className="input"
            ref={input}
            contentEditable="true"
            onPaste={onPaste}
            onInput={onInput}
            onKeyDown={(e) => onKeyDown(e)}
          >
          </div>
          {!input.current?.innerHTML && (
            <div className="cta">
              Write here..
            </div>
          )}
          <Attachments model={model.files} className="input-attachments" />
        </div>
        <Toolbar className="controls" size={32}>
          <ButtonWithIcon
            icon="emojis"
            onClick={() => setShowEmojis(!showEmojis)}
          />
          <ButtonWithIcon icon="plus" onClick={addFile} />
          {isMobile() ? <ButtonWithIcon icon="send" onClick={send} /> : null}
        </Toolbar>
      </div>

      <StatusLine info={app.info} typing={model.thread.typing} />
      <ChannelSelector />
      <UserSelector />
      <EmojiSelector />
      {showEmojis && <EmojiSearch onSelect={onEmojiInsert} />}
      <input
        onChange={onFileChange}
        ref={fileInput}
        type="file"
        multiple
        style={{
          height: 0,
          opacity: 0,
          width: 0,
          position: "absolute",
          bottom: 0,
          left: 0,
        }}
      />
    </InputContainer>
  );
});

type InputProps = {
  messageId?: string;
  className?: ClassNames;
  model: InputModel;
};

export const Input = observer(({ className, ...args }: InputProps) => (
  <InputProvider {...args}>
    <InputForm className={className} {...args} />
  </InputProvider>
));
