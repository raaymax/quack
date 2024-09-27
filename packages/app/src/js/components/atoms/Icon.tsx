import styled from 'styled-components';
import { useSize } from '../contexts/useSize';
import { cn, ClassNames } from '../../utils';

type IconProps = {
  icon: string,
  className?: ClassNames;
  size?: number;
}

const StyledIcon = styled.i`
  margin: auto;
  padding: 0;
  vertical-align: middle;
  text-align: center;
  display: inline;
`;

const iconMap: Record<string, string> = {
  bars: 'fa-solid fa-bars',
  emojis: 'fa-solid fa-face-smile-beam',
  plus: 'fa-solid fa-plus',
  xmark: 'fa-solid fa-xmark',
  'circle-xmark': 'fa-solid fa-circle-xmark',
  check: 'fa-solid fa-circle-check',
  send: 'fa-solid fa-paper-plane',
  hash: 'fa-solid fa-hashtag',
  delete: 'fa-solid fa-trash-can',
  edit: 'fa-solid fa-pen-to-square',
  icons: 'fa-solid fa-icons',
  reply: 'fa-solid fa-reply',
  thumbtack: 'fa-solid fa-thumbtack',
  down: 'fa-solid fa-down-long',
  search: 'fa-solid fa-magnifying-glass',
  refresh: 'fa-solid fa-arrows-rotate',
  back: 'fa-solid fa-arrow-left',
  lock: 'fa-solid fa-lock',
  logout: 'fa-solid fa-right-from-bracket',
  'system-user': 'fa-solid fa-user-gear',
  user: 'fa-solid fa-user',
};

const getIcon = (icon: string) => {
  const [key, mod] = icon?.split(':') ?? [];
  return `${iconMap[key] ?? icon} ${mod ?? ''}`;
};

export const Icon = ({ size, className, icon }: IconProps) => {
  const $size = useSize(size);
  return (
    <StyledIcon className={cn('icon', getIcon(icon), className)} style={$size ? {
      width: `${$size}px`,
      height: `${$size}px`,
      lineHeight: `${$size}px`,
      fontSize: `${$size}px`,
    } : undefined} />
  );
};
