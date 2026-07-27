import { useState } from "react";
import { NavChannels } from "../molecules/NavChannels";
import { NavUsers } from "../molecules/NavUsers";
import { ClassNames, cn } from "../../utils";
import styled from "styled-components";
import { ThemeButtonConnected } from "../molecules/ThemeButtonConnected";
import { LoggedUserConnected } from "../molecules/LoggedUserConnected";
import { ProfileSettings } from "./ProfileSettings";
import { observer } from "mobx-react-lite";

const Container = styled.div`
  flex: 0 0 356px;
  display: flex;
  background-color: ${(props) => props.theme.Channel.Background};
  flex-direction: column;

  .side-menu-header {
    flex: 0 0 64px;
    height: 64px;
    border-bottom: 1px solid ${(props) => props.theme.Strokes};
    padding: 16px 24px;
    font-size: 24px;
  }

  .slider {
    flex: 1 calc(100% - 50px);
    overflow-y: auto;
    scrollbar-width: none;
  }
  .bottom {
    flex: 0 50px;
  }
  @media (max-width: 710px) {
    width: 100%;
    height: 100vh;

    & .channel,
    & .user {
      display: flex;
      align-items: center;
      min-height: 40px;
      font-size: 20px;
    }
    & .channel .name,
    & .user .name {
      font-size: 20px;
    }
    & .user .text {
      display: flex;
      align-items: center;
      margin: 0;
    }
  }
  &.hidden {
    flex: 0 0px;
    width: 0px;
  }
`;
export const Sidebar = observer(
  (
    { style, className }: {
      style?: { [key: string]: string };
      className?: ClassNames;
    },
  ) => {
    const [showSettings, setShowSettings] = useState(false);
    return (
      <Container className={cn("side-menu", className)} style={style}>
        <div className="side-menu-header">
          Workspace
        </div>
        <div className="slider">
          <NavChannels />
          <NavUsers />
        </div>
        <div className="bottom">
          <ThemeButtonConnected />
          <LoggedUserConnected onOpenSettings={() => setShowSettings(true)} />
        </div>
        {showSettings && (
          <ProfileSettings onClose={() => setShowSettings(false)} />
        )}
      </Container>
    );
  },
);
