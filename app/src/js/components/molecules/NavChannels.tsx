import { useState } from "react";
import styled from "styled-components";
import { ChannelCreate } from "./ChannelCreate";
import { Channel } from "./NavChannel";
import { useSidebar } from "../contexts/useSidebar";
import { isMobile } from "../../utils";
import { useNavigate, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

const ChannelsContainer = styled.div`
  .header {
    display: flex;
    flex-direction: row;
    padding: 5px 10px;
    padding-top: 20px;
    font-weight: bold;
    .title {
      flex: 1;
    }

    i {
      cursor: pointer;
      flex: 0 15px;
      font-size: 19px;
    }

  }

  .channel {
    padding: 5px 5px 5px 20px; 
    cursor: pointer;
  }
  .channel .name {
    padding: 0px 10px; 
    cursor: pointer;
  }
  .channel.active {
    background-color: var(--primary_active_mask);
  }

  .channel:hover {
    font-weight: bold;
    background-color: ${(props) => props.theme.Channel.Hover};
    color: ${(props) => props.theme.Channels.HoverText};
  }
`;

type NavChannelsProps = {
  icon?: string;
};

export const NavChannels = observer(({ icon }: NavChannelsProps) => {
  const [show, setShow] = useState(false);
  const app = useApp();
  let navigate = (_path: string) => {};
  try {
    navigate = useNavigate();
  } catch { /* ignore */ }
  const badges = app.readReceipts;
  const { channelId: id } = useParams();
  const { hideSidebar } = useSidebar();
  const channels = app.channels.getAll(["PUBLIC", "PRIVATE"]);
  return (
    <ChannelsContainer>
      <div className="header">
        <span className="title">channels</span>
        <i
          className={show ? "fa-solid fa-minus" : "fa-solid fa-plus"}
          onClick={() => setShow(!show)}
        />
      </div>
      {show && <ChannelCreate />}
      {channels && channels.map((c) => (
        <Channel
          channelId={c.id}
          {...c}
          className={{ active: id === c.id }}
          key={c.id}
          icon={icon ?? "hash"}
          badge={badges.getForChannel(c.id)}
          onClick={() => {
            if (isMobile()) {
              hideSidebar();
            }
            navigate(`/${c.id}`);
          }}
        />
      ))}
    </ChannelsContainer>
  );
});
