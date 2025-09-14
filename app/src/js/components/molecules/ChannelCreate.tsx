import { useCallback, useState } from "react";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

const NewChannelContainer = styled.div`
  width: 100%;
  padding: 0;
  margin: 10px 0;
  form {
    display: flex;
    padding: 0;
    margin: 0;
    width: 100%;
  }
  input {
    padding: 0 0 0 19px;
    margin: 0;
    border-radius: 0;
    background-color: ${(props) => props.theme.inputBackgroundColor};
    border: 1px solid #000000;
    border-right: none;
    flex: 1;
    height: 40px;
    &:focus {
      outline: none;
    }
  }
  button {
    margin: 0;
    background-color: ${(props) => props.theme.actionButtonBackgroundColor};
    color: ${(props) => props.theme.actionButtonFontColor};
    border-radius: 0;
    border: 1px solid #000000;
    height: 40px;
    width: 40px;
    flex: 0 40px;
    &:hover {
      background-color: ${(props) =>
        props.theme.actionButtonHoverBackgroundColor};
      color: ${(props) => props.theme.actionButtonFontColor};
    }
    &:active {
      background-color: ${(props) =>
        props.theme.actionButtonActiveBackgroundColor};
      color: ${(props) => props.theme.actionButtonFontColor};
    }
  }
`;

// FIXME: extract inputs into atoms? use atom button
export const ChannelCreate = observer(() => {
  const [name, setName] = useState("");
  const app = useApp();
  const submit = useCallback((e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    app.channels.create({ name });
    setName("");
  }, [app, name, setName]);
  return (
    <NewChannelContainer>
      <form action="#" onSubmit={submit}>
        <input
          type="text"
          placeholder="Channel name"
          onChange={(e) => setName(e.target.value)}
          value={name}
        />
        <button type="submit">
          <i className="fa-solid fa-plus" />
        </button>
      </form>
    </NewChannelContainer>
  );
});
