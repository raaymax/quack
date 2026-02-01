import { observer } from "mobx-react-lite";
import { client } from "../../core";
import { useApp } from "../contexts/appState";
import { useFileUrl } from "../hooks/useFileUrl";
import { LoggedUser } from "./LoggedUser";

export const LoggedUserConnected = observer(() => {
  const app = useApp();
  const user = app.profile;

  const avatarUrl = useFileUrl(user?.avatarFileId);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await client.api.auth.logout();
    document.location.reload();
  };

  return (
    <LoggedUser name={user.name} avatarUrl={avatarUrl} onLogout={handleLogout} />
  );
});
