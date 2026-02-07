import { useMemo } from "react";
import { BaseInputSelector, SelectorOption } from "./BaseInputSelector";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";
import type { User } from "../../types";

const mapUserToOption = (user: User): SelectorOption => ({
  name: user.name,
  id: user.id as string,
  icon: "fa-solid fa-user",
});

export const UserSelector = observer(() => {
  const app = useApp();
  const users = app.users.getAll();

  const config = useMemo(
    () => ({
      scope: "user",
      triggerKey: "@",
      selectorClassName: "user-selector",
      resultClassName: "user",
      attributeName: "userId",
      items: users,
      fuseKeys: ["name"],
      mapOption: mapUserToOption,
    }),
    [users]
  );

  return <BaseInputSelector config={config} />;
});
