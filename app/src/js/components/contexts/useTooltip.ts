import { useContext } from "react";
import { TooltipContext, TooltipContextType } from "./tooltip";

export const useTooltip = (): TooltipContextType => {
  const tooltip = useContext(TooltipContext);
  if (tooltip === undefined) {
    throw new Error("useTooltip must be used within a TooltipProvider");
  }
  return tooltip;
};
