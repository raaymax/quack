import { useContext } from "react";
import { UserContext } from "./user.tsx";

export const useLoggedUserId = (): string | null => {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser must be used within a UserContext");
  return user;
};
