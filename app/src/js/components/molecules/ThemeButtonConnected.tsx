import { ThemeButton } from "../atoms/ThemeButton";
import { useThemeControl } from "../contexts/useThemeControl";

export const ThemeButtonConnected = () => {
  const themeControl = useThemeControl();
  const count = themeControl.themeNames.length;
  const idx = themeControl.themeNames.findIndex(
    (name) => name === themeControl.theme,
  );
  const nextTheme = themeControl.themeNames[(idx + 1) % count];
  return (
    <ThemeButton
      themes={themeControl.themes}
      active={themeControl.theme}
      onClick={() => {
        if (nextTheme) themeControl.setTheme(nextTheme);
      }}
    />
  );
};
