import { observer } from "mobx-react-lite";
import { client } from "../../core";
import { useApp } from "../contexts/appState";
import { getFileUrl } from "../hooks/fileUrl";
import { LoggedUser } from "./LoggedUser";

type LoggedUserConnectedProps = {
  onOpenSettings?: () => void;
};

export const LoggedUserConnected = observer(
  ({ onOpenSettings }: LoggedUserConnectedProps) => {
    const app = useApp();
    const user = app.profile;

    const avatarUrl = getFileUrl(user?.avatarFileId);

    if (!user) {
      return null;
    }

    const handleLogout = async () => {
      await client.api.auth.logout();
      document.location.reload();
    };

    return (
      <LoggedUser
        name={user.name}
        avatarUrl={avatarUrl}
        onLogout={handleLogout}
        onOpenSettings={onOpenSettings}
      />
    );
  },
);
