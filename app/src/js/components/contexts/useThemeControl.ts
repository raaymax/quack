import { useContext } from "react";
import { ThemeControl, ThemeSelectorContext } from "./theme";

export const useThemeControl = (): ThemeControl => {
  const theme = useContext(ThemeSelectorContext);
  return theme;
};
