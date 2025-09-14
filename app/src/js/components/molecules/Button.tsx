import { ClassNames } from "../../utils.ts";
import { Tooltip } from "../atoms/Tooltip.tsx";
import { BaseButton } from "../atoms/BaseButton.tsx";
import { observer } from "mobx-react-lite";

interface IconButtonProps {
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  size?: number;
  children?: React.ReactNode;
  className?: ClassNames;
  type?: "primary" | "secondary" | "other";
  tooltip?: string | string[];
}

export const Button = observer(({
  onClick,
  size,
  children,
  className,
  type = "other",
  tooltip,
  disabled = false,
}: IconButtonProps) => {
  const button = (
    <BaseButton
      onClick={onClick}
      size={size}
      className={className}
      type={type}
      disabled={disabled}
    >
      {children}
    </BaseButton>
  );
  if (tooltip) {
    return (
      <Tooltip text={tooltip}>
        {button}
      </Tooltip>
    );
  }
  return button;
});
