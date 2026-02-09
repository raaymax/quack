import { useCallback, useState } from "react";
import styled from "styled-components";
import { ChannelCreateForm } from "./ChannelCreateForm";
import { Channel } from "./NavChannel";
import { SectionHeader } from "../atoms/SectionHeader";
import { useSidebar } from "../contexts/useSidebar";
import { isMobile } from "../../utils";
import { useNavigate, useParams } from "../AppRouter.tsx";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

const ChannelsContainer = styled.div`
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const app = useApp();
  let navigate = (_path: string) => {};
  try {
    navigate = useNavigate();
  } catch { /* ignore */ }
  const badges = app.readReceipts;
  const { channelId: id } = useParams();
  const { hideSidebar } = useSidebar();
  const channels = app.channels.getAll(["PUBLIC", "PRIVATE"]);

  const handleCreateChannel = useCallback(
    (data: { name: string; description: string; type: "public" | "private" }) => {
      app.channels.create({
        name: data.name,
        description: data.description,
        channelType: data.type.toUpperCase() as "PUBLIC" | "PRIVATE",
      });
      setShowCreateModal(false);
    },
    [app]
  );

  return (
    <ChannelsContainer>
      <SectionHeader
        title="channels"
        actionIcon="plus"
        onAction={() => setShowCreateModal(true)}
      />
      <ChannelCreateForm
        isOpen={showCreateModal}
        onSubmit={handleCreateChannel}
        onCancel={() => setShowCreateModal(false)}
      />
      {channels && channels.map((c) => (
        <Channel
          channelId={c.id}
          {...c}
          className={{ active: id === c.id }}
          key={c.id}
          icon={icon ?? "hash"}
          badge={badges.getForChannel(c.id as any)}
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
