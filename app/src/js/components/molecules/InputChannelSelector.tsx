import { useMemo } from "react";
import { BaseInputSelector, SelectorOption } from "./BaseInputSelector";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";
import type { ChannelModel } from "../../core/models/channel";

const mapChannelToOption = (channel: ChannelModel): SelectorOption => ({
  name: channel.name,
  id: channel.id,
  icon: channel.isPrivate ? "fa-solid fa-lock" : "fa-solid fa-hashtag",
});

export const ChannelSelector = observer(() => {
  const app = useApp();
  const channels = app.channels.getAll(["PUBLIC", "PRIVATE"]);

  const config = useMemo(
    () => ({
      scope: "channel",
      triggerKey: "#",
      selectorClassName: "channel-selector",
      resultClassName: "channel",
      attributeName: "channelId",
      items: channels,
      fuseKeys: ["name"],
      mapOption: mapChannelToOption,
    }),
    [channels]
  );

  return <BaseInputSelector config={config} />;
});
