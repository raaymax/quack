import { useTheme } from "styled-components";
import { useSize } from "../contexts/useSize";

export const Logo = ({ onClick }: {onClick: () => void}) => (
  <div className='logo' onClick={onClick}>
    <img className='logo-img' src='/avatar.svg' alt='logo' />
    <span className='logo-name'>Quack</span>
  </div>
);

export const LogoPic = ({ onClick, size }: {onClick: () => void, size?: number}) => {
  const $size = useSize(size);
  const theme = useTheme();
  return (
    <img className='logo-img' src={theme.logo} alt='logo' style={$size ? {
      width: `${$size}px`,
      height: `${$size}px`,
      lineHeight: `${$size}px`,
      fontSize: `${$size}px`,
      borderRadius: "8px",
    } : undefined} onClick={onClick}/>
  );
}
