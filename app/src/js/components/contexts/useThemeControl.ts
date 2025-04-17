import { useContext } from "react";
import { ThemeControl, ThemeSelectorContext } from "./theme.tsx";

export const useThemeControl = (): ThemeControl => {
  const theme = useContext(ThemeSelectorContext);
  return theme;
};
