import { useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { MessageFile } from "../../types.ts";
import { client } from "../../core";
import { useApp } from "../contexts/appState";
import { useSidebar } from "../contexts/useSidebar";
import { useNavigate, useParams } from "../AppRouter.tsx";
import { FilesView } from "./FilesView";
import { type FileItem } from "../molecules/FileListItem";

export const ChannelFiles = observer(() => {
  const app = useApp();
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
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

  const onAttach = useCallback((file: FileItem) => {
    model?.attach(file.id);
  }, [model]);

  const onUpload = useCallback((files: FileList) => {
    model?.uploadMany(files);
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
      removable: file.userId === app.userId,
      draft: file.status === "draft",
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
      channelType={channel.channelType}
      loading={model.loading && !model.initialized}
      error={model.error}
      onRetry={() => model.load()}
      onUpload={onUpload}
      uploads={model.uploads}
      onDismissUpload={(clientId) => model.dismissUpload(clientId)}
      onRetryUpload={(clientId) => model.retryUpload(clientId)}
      actionError={model.actionError}
      onClearActionError={() => model.clearActionError()}
      onDownload={onDownload}
      onRemove={onRemove}
      onAttach={onAttach}
      onClose={onClose}
      onMenu={toggleSidebar}
    />
  );
});
