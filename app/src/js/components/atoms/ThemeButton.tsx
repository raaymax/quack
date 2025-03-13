import styled from "styled-components";
import { Icon } from "./Icon";
import { useThemeControl } from "../contexts/useThemeControl";
import { observer } from "mobx-react-lite";

const Container = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: row;
  gap: 12px;
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.Channel.Hover};
    color: ${({ theme }) => theme.Channels.HoverText};
  }

  .icon {
    color: ${({ theme }) => theme.SecondaryButton.Default};
  }
  .label {
    display: flex;
    flex-direction: column;
    .name {
      font-size: 12px;
      line-height: 16px;
      font-weight: 500;
      color: ${({ theme }) => theme.Text};
    }
    .cta {
      font-size: 10px;
      line-height: 12px;
      color: ${({ theme }) => theme.Labels};
    }
  }
  .spacer {
    flex: 1;
  }

  .dots {
    display: flex;
    flex-direction: row;
    margin: auto;

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 6px;
      margin: 0 4px;
      border: 1px solid ${({ theme }) => theme.SecondaryButton.Default};
      &.active {
        background-color: ${({ theme }) => theme.SecondaryButton.Default};
      }
    }
  }

`;

type ThemeButtonProps = {
  onClick: () => void;
  themes: { [id: string]: { name: string; icon: string } };
  active: string;
};

export const ThemeButton = observer(
  ({ themes, active, onClick }: ThemeButtonProps) => {
    const current = themes[active];
    return (
      <Container onClick={onClick}>
        <Icon icon={current?.icon ?? "icons"} size={32} />
        <div className="label">
          <div className="name">{current?.name ?? "Unknown"}</div>
          <div className="cta">Click to change</div>
        </div>
        <div className="spacer" />
        <div className="dots">
          {Object.keys(themes).map((id) => (
            <div key={id} className={`dot ${id === active ? "active" : ""}`}>
            </div>
          ))}
        </div>
      </Container>
    );
  },
);

export const ThemeButtonS = () => {
  const themeControl = useThemeControl();
  const count = themeControl.themeNames.length;
  const idx = themeControl.themeNames.findIndex((name) =>
    name === themeControl.theme
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
