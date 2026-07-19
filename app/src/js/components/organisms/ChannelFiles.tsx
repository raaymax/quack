import { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { MessageFile } from "../../types.ts";
import { client } from "../../core";
import { useApp } from "../contexts/appState";
import { useNavigate, useParams } from "../AppRouter.tsx";
import { FilesView } from "./FilesView";
import { type FileItem } from "../molecules/FileListItem";
import { type ChannelType } from "../molecules/FilesToolbar";

export const ChannelFiles = observer(() => {
  const app = useApp();
  const navigate = useNavigate();
  const { channelId } = useParams();

  useEffect(() => {
    if (!channelId) navigate("/");
  }, [channelId, navigate]);

  const model = channelId ? app.getFiles(channelId) : null;
  const channel = channelId ? app.getChannel(channelId) : null;

  useEffect(() => {
    model?.init();
  }, [model]);

  const onDownload = useCallback((file: FileItem) => {
    if (file.url) window.open(`${file.url}?download=true`);
  }, []);

  const onRemove = useCallback((file: FileItem) => {
    model?.remove(file.id);
  }, [model]);

  const onClose = useCallback(() => {
    if (channelId) navigate(`/${channelId}`);
  }, [channelId, navigate]);

  if (!model || !channel) return null;

  const channelName = channel.isDirect
    ? (channel.otherUser ?? channel.user)?.name ?? channel.name
    : channel.name;

  const files: FileItem[] = model.getAll().map((file: MessageFile) => {
    const uploader = app.users.get(file.userId);
    return {
      id: file.id,
      fileName: file.fileName,
      contentType: file.contentType,
      size: file.size,
      createdAt: file.createdAt,
      url: client.api.getFileUrl(file.channelId, file.id),
      resolution: file.resolution,
      messageId: file.messageId,
      removable: file.userId === app.userId,
      uploader: {
        id: file.userId,
        name: uploader?.name ?? "Unknown",
        avatarUrl: uploader?.avatarFileId
          ? client.api.getUrl(uploader.avatarFileId)
          : undefined,
      },
    };
  });

  return (
    <FilesView
      key={channelId}
      files={files}
      channelName={channelName}
      channelType={channel.channelType as ChannelType}
      loading={model.loading && !model.initialized}
      error={model.error}
      onRetry={() => model.load()}
      onDownload={onDownload}
      onRemove={onRemove}
      onClose={onClose}
    />
  );
});

export default ChannelFiles;
