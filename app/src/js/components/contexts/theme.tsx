import { createContext, useCallback, useEffect, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { IconNames } from '../atoms/Icon';

export type Theme = {
    name: string, 
    icon: IconNames, 
    logo: string,
    loginIlustration: string,
    registerIlustration: string,

    borderColor: string,
    backgroundColor: string,
    highlightedBackgroundColor: string,
    inputBackgroundColor: string,
    dateBarBackgroundColor: string,
    fontColor: string,
    frontHoverColor: string,
    userActive: string,
    userConnected: string,
    userSystem: string,
    userDisconnected: string,
    actionButtonBackgroundColor: string,
    actionButtonHoverBackgroundColor: string,
    actionButtonActiveBackgroundColor: string,
    actionButtonFontColor: string,
    buttonHoverBackground: string,
    buttonActiveBackground: string,
    borderColorHover: string,
    searchBoxBackgroundColor: string,
    labelColor: string,
    linkColor: string,
    mentionsColor: string,
    Text: string,
    Labels: string,
    SecondaryButton: {
      Hover: string,
      Default: string,
      Background: string,
    },
    Navbar: {
      Background: string,
      Icons: string,
      Hover: string,
    },
    Input: {
      Background: string,
    },
    Strokes: string,
    Chatbox: {
      Background: string,
      Message: {
        Hover: string,
        ProgressDone: string,
        ReactionButton: string,
        InputActive: string,
      },
      Div: string,
    },
    PrimaryButton: {
      Background: string,
      Text: string,
    },
    ToggleButtons: {
      Default: string,
      Hover: string,
    },
    Channel: {
      Active: string,
      Hover: string,
      Inactive: string,
      Background: string,
    },
    User: {
      Active: string,
      Inactive: string,
      AFK: string,
    },
    Channels: {
      HoverText: string,
    },
    Icons: {
      Static: string,
      Hover: string,
    },
    ActiveOverlay: string,
};

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

export type Themes = {
  [id: string]: Theme
};

export type ThemeControl = {
  theme: string, 
  themes: Themes,
  themeNames: string[],
  setTheme: (v: string) => void
};

const themes: Themes = {
  light: {
    loginIlustration: '/login_ilustration_light.svg',
    registerIlustration: '/register_light.svg',
    name: "Light",
    icon: "sun",
    logo: "/avatar.svg",
    borderColor: "#565856",
    backgroundColor: "#1a1d21",
    highlightedBackgroundColor: "#2a2d31",
    inputBackgroundColor: "#2a2d31",
    dateBarBackgroundColor: "#2a2d31",
    fontColor: "#d9d9d9",
    frontHoverColor: "var(--primary_active_mask)",
    userActive: "#3c7e3c",
    userConnected: "#8f8f45",
    userSystem: "#d9d9d9",
    userDisconnected: "#4f4f4f",
    actionButtonBackgroundColor: "#2E1A4E",
    actionButtonHoverBackgroundColor: "#3D2760",
    actionButtonActiveBackgroundColor: "#3D2760",
    actionButtonFontColor: "#d9d9d9",
    buttonHoverBackground: "#3D2760",
    buttonActiveBackground: "#3D2760",
    borderColorHover: "white",
    searchBoxBackgroundColor: "#2a2d31",
    labelColor: "gray",
    linkColor: "#4a90e2",
    mentionsColor: "#4ac0e2",
    Text: "#3C3B3B",
    Labels: "#8D8C8C",
    SecondaryButton: {
      Hover: "#262626",
      Default: "#595959",
      Background: "#FAF9F7",
    },
    Navbar: {
      Background: "#E6E5E4",
      Icons: "#050505",
      Hover: "#D9D8D7",
    },
    Input: {
      Background: "#F0EFED",
    },
    Strokes: "#BFBEBD",
    Chatbox: {
      Background: "#FAF9F7",
      Message: {
        Hover: "#EAE8E6",
        ProgressDone: "#D9D9D9",
        ReactionButton: "#E6E4E1",
        InputActive: "#737270",
      },
      Div: "#8C8C8B",
    },
    PrimaryButton: {
      Background: "#FF8C00",
      Text: "#FAFAFA",
    },
    ToggleButtons: {
      Default: "#8D8C8A",
      Hover: "#050505",
    },
    Channel: {
      Active: "#E0DFDE",
      Hover: "#EBEAE9",
      Inactive: "#8B8A89",
      Background: "#F2F1F0",
    },
    User: {
      Active: "#40BE44",
      Inactive: "#EC0A0E",
      AFK: "#FFB26F",
    },
    Channels: {
      HoverText: "#747882",
    },
    Icons: {
      Static: "#050505",
      Hover: "#050505",
    },
    ActiveOverlay: "#0000000D",
  },
  test: {
    name: "Test",
    icon: "vail",
    loginIlustration: '/login_ilustration_dark.svg',
    registerIlustration: '/register_dark.svg',
    logo: "/avatar.svg",
    borderColor: "#565856",
    backgroundColor: "#1a1d21",
    highlightedBackgroundColor: "#2a2d31",
    inputBackgroundColor: "#2a2d31",
    dateBarBackgroundColor: "#2a2d31",
    fontColor: "#d9d9d9",
    frontHoverColor: "var(--primary_active_mask)",
    userActive: "#3c7e3c",
    userConnected: "#8f8f45",
    userSystem: "#d9d9d9",
    userDisconnected: "#4f4f4f",
    actionButtonBackgroundColor: "#2E1A4E",
    actionButtonHoverBackgroundColor: "#3D2760",
    actionButtonActiveBackgroundColor: "#3D2760",
    actionButtonFontColor: "#d9d9d9",
    buttonHoverBackground: "#3D2760",
    buttonActiveBackground: "#3D2760",
    borderColorHover: "white",
    searchBoxBackgroundColor: "#2a2d31",
    labelColor: "gray",
    linkColor: "#4a90e2",
    mentionsColor: "#4ac0e2",
    Text: "#FAFAFA",
    Labels: "#737272",
    SecondaryButton: {
      Hover: "#0D0D0D",
      Default: "#737272",
      Background: "#050505",
    },
    Navbar: {
      Background: "#110922",
      Icons: "#E0E0E0",
      Hover: "#292928",
    },
    Input: {
      Background: "#313131",
    },
    Strokes: "#403F3F",
    Chatbox: {
      Background: "#383837",
      Message: {
        Hover: "#313131",
        ProgressDone: "#262626",
        ReactionButton: "#222221",
        InputActive: "#A6A4A2",
      },
      Div: "#737272",
    },
    PrimaryButton: {
      Background: "#FF8C00",
      Text: "#FAFAFA",
    },
    ToggleButtons: {
      Default: "#737270",
      Hover: "#FAFAFA",
    },
    Channel: {
      Active: "#1F1E1E",
      Hover: "#403F3F",
      Inactive: "#8B8A89",
      Background: "#333332",
    },
    User: {
      Active: "#40BE44",
      Inactive: "#EC0A0E",
      AFK: "#FFB26F",
    },
    Channels: {
      HoverText: "#FAFAFA",
    },
    Icons: {
      Static: "#050505",
      Hover: "#FFFFFF",
    },
    ActiveOverlay: "#0000000D",
  },
  dark: {
    name: "Dark",
    icon: "moon",
    logo: "/avatar.svg",
    loginIlustration: '/login_ilustration_dark.svg',
    registerIlustration: '/register_dark.svg',
    borderColor: "#565856",
    backgroundColor: "#1a1d21",
    highlightedBackgroundColor: "#2a2d31",
    inputBackgroundColor: "#2a2d31",
    dateBarBackgroundColor: "#2a2d31",
    fontColor: "#d9d9d9",
    frontHoverColor: "var(--primary_active_mask)",
    userActive: "#3c7e3c",
    userConnected: "#8f8f45",
    userSystem: "#d9d9d9",
    userDisconnected: "#4f4f4f",
    actionButtonBackgroundColor: "#2E1A4E",
    actionButtonHoverBackgroundColor: "#3D2760",
    actionButtonActiveBackgroundColor: "#3D2760",
    actionButtonFontColor: "#d9d9d9",
    buttonHoverBackground: "#3D2760",
    buttonActiveBackground: "#3D2760",
    borderColorHover: "white",
    searchBoxBackgroundColor: "#2a2d31",
    labelColor: "gray",
    linkColor: "#4a90e2",
    mentionsColor: "#4ac0e2",
    Text: "#FAFAFA",
    Labels: "#737373",
    SecondaryButton: {
      Hover: "#F2F2F2",
      Default: "#BFBFBF",
      Background: "#050505",
    },
    Navbar: {
      Background: "#201F22",
      Icons: "#E0E0E0",
      Hover: "#262529",
    },
    Input: {
      Background: "#2E2C31",
    },
    Strokes: "#3C3940",
    Chatbox: {
      Background: "#343238",
      Message: {
        Hover: "#2E2C31",
        ProgressDone: "#242226",
        ReactionButton: "#201F22",
        InputActive: "#9B95A6",
      },
      Div: "#6B6773",
    },
    PrimaryButton: {
      Background: "#FF8C00",
      Text: "#FAFAFA",
    },
    ToggleButtons: {
      Default: "#6B6773",
      Hover: "#E9E1FA",
    },
    Channel: {
      Active: "#1D1C1F",
      Hover: "#3C3940",
      Inactive: "#817D8B",
      Background: "#2F2D32",
    },
    User: {
      Active: "#40BE44",
      Inactive: "#EC0A0E",
      AFK: "#FFB26F",
    },
    Channels: {
      HoverText: "#FAFAFA",
    },
    Icons: {
      Static: "#E0E0E0",
      Hover: "#FFFFFF",
    },
    ActiveOverlay: "#FFFFFF0D",
  },
  "dark-orange-test": {
    name: "Dark Orange Test",
    icon: "carrot",
    logo: "/avatar.svg",
    loginIlustration: '/login_ilustration_dark.svg',
    registerIlustration: '/register_dark.svg',
    borderColor: "#565856",
    backgroundColor: "#1a1d21",
    highlightedBackgroundColor: "#2a2d31",
    inputBackgroundColor: "#2a2d31",
    dateBarBackgroundColor: "#2a2d31",
    fontColor: "#d9d9d9",
    frontHoverColor: "var(--primary_active_mask)",
    userActive: "#3c7e3c",
    userConnected: "#8f8f45",
    userSystem: "#d9d9d9",
    userDisconnected: "#4f4f4f",
    actionButtonBackgroundColor: "#2E1A4E",
    actionButtonHoverBackgroundColor: "#3D2760",
    actionButtonActiveBackgroundColor: "#3D2760",
    actionButtonFontColor: "#d9d9d9",
    buttonHoverBackground: "#3D2760",
    buttonActiveBackground: "#3D2760",
    borderColorHover: "white",
    searchBoxBackgroundColor: "#2a2d31",
    labelColor: "gray",
    linkColor: "#4a90e2",
    mentionsColor: "#4ac0e2",
    Text: "#FAFAFA",
    Labels: "#737373",
    SecondaryButton: {
      Hover: "#0D0C0B",
      Default: "#736E67",
      Background: "#050505",
    },
    Navbar: {
      Background: "#22201F",
      Icons: "#E0E0E0",
      Hover: "#292725",
    },
    Input: {
      Background: "#312F2C",
    },
    Strokes: "#403D39",
    Chatbox: {
      Background: "#383532",
      Message: {
        Hover: "#312F2C",
        ProgressDone: "#262522",
        ReactionButton: "#22201F",
        InputActive: "#A69E95",
      },
      Div: "#6B6773",
    },
    PrimaryButton: {
      Background: "#FF8C00",
      Text: "#FAFAFA",
    },
    ToggleButtons: {
      Default: "#736E67",
      Hover: "#FAEFE1",
    },
    Channel: {
      Active: "#1F1D1C",
      Hover: "#403D39",
      Inactive: "#8B847D",
      Background: "#33312E",
    },
    User: {
      Active: "#40BE44",
      Inactive: "#FF3700",
      AFK: "#FFB26F",
    },
    Channels: {
      HoverText: "#FAFAFA",
    },
    Icons: {
      Static: "#E0E0E0",
      Hover: "#FFFFFF",
    },
    ActiveOverlay: "#0000000D",
  },
};

export const ThemeSelectorContext = createContext<ThemeControl>({
  theme: 'dark',
  themeNames: ['dark'],
  themes: themes,
  setTheme: () => {}
});

type ThemeSelectorContextProps = {
  children: React.ReactNode;
  defaultTheme?: string;
  value?: string;
};

export const ThemeSelectorProvider = ({ children, defaultTheme = 'dark', value }: ThemeSelectorContextProps) => {
  const savedTheme = localStorage.getItem('theme');
  const [theme, setTheme] = useState(savedTheme || defaultTheme);
  const setThemeAndSave = useCallback((theme: string) => {
    setTheme(theme);
    localStorage.setItem('theme', theme);
  }, [setTheme])

  useEffect(() => {
    if (value) {
      setThemeAndSave(value);
    }
  }, [value, setThemeAndSave]);

  document.body.setAttribute('style', `--background-color: ${themes[theme].Chatbox.Background};`);

  const currentTheme = themes[theme] ?? themes[defaultTheme];
  return (
    <ThemeSelectorContext.Provider value={{theme, setTheme: setThemeAndSave, themes: themes, themeNames: Object.keys(themes)}}>
      <ThemeProvider theme={currentTheme}>
        {children}
      </ThemeProvider>
    </ThemeSelectorContext.Provider>
  );
}
