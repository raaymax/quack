import { useCallback, useState } from "react";
import styled from "styled-components";
import { ChannelCreateForm } from "./ChannelCreateForm";
import {
  type ChannelViewKey,
  NavChannelTree,
} from "./NavChannelTree";
import { SectionHeader } from "../atoms/SectionHeader";
import { useSidebar } from "../contexts/useSidebar";
import { isMobile } from "../../utils";
import { getActiveView, useNavigate, useParams } from "../AppRouter.tsx";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

const ChannelsContainer = styled.div``;

export const NavChannels = observer((
  { expandedId, onExpand }: {
    expandedId?: string | null;
    onExpand?: (id: string | null) => void;
  } = {},
) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const app = useApp();
  let navigate = (_path: string) => {};
  try {
    navigate = useNavigate();
  } catch { /* ignore */ }
  const badges = app.readReceipts;
  const params = useParams();
  const { channelId: id } = params;
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
      <NavChannelTree
        channels={channels.map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.channelType,
          unread: badges.getForChannel(String(c.id))?.count ?? 0,
        }))}
        activeChannelId={id}
        activeView={getActiveView(params)}
        expandedId={expandedId}
        onExpand={onExpand}
        onSelectChannel={(channelId) => {
          if (isMobile()) hideSidebar();
          navigate(`/${channelId}`);
        }}
        onSelectView={(channelId, view: ChannelViewKey) => {
          if (isMobile()) hideSidebar();
          navigate(view === "files" ? `/${channelId}/files` : `/${channelId}`);
        }}
      />
    </ChannelsContainer>
  );
});
