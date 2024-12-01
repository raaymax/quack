import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { useSize } from '../contexts/useSize';
import { ClassNames } from '../../utils';

interface ButtonWithIconProps {
  onClick?: (e: React.MouseEvent) => void;
  icon?: string;
  size?: number;
  iconSize?: number;
  disabled?: boolean;
  tooltip?: string | string[];
  children?: React.ReactNode;
  className?: ClassNames;
}

export const ButtonWithIcon = ({
  onClick, size, icon, iconSize, children, className, disabled, tooltip,
}: ButtonWithIconProps) => {
  const $size = useSize(size);
  if (!iconSize) {
    iconSize = $size ? $size / 2 : $size;
  }
  return (
    <Button disabled={disabled} size={$size} onClick={onClick} className={className} tooltip={tooltip}> 
      {icon && <Icon icon={icon} size={iconSize} />}
      {children}
    </Button>
  );
};
