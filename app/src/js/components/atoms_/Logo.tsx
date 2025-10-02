import { observer } from "mobx-react-lite";

export const Logo = observer(({ onClick }: { onClick: () => void }) => (
  <div className="logo" onClick={onClick}>
    <img className="logo-img" src="/avatar.svg" alt="logo" />
    <span className="logo-name">Quack</span>
  </div>
));

export const LogoPic = observer(
  ({ onClick, logoSrc, size }: { onClick: () => void; logoSrc: string, size?: number }) => {
    return (
      <img
        className="logo-img"
        src={logoSrc}
        alt="logo"
        style={size
          ? {
            width: `${size}px`,
            height: `${size}px`,
            lineHeight: `${size}px`,
            fontSize: `${size}px`,
            borderRadius: "8px",
          }
          : undefined}
        onClick={onClick}
      />
    );
  },
);
