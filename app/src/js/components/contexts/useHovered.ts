import { useContext } from "react";
import { HoverContext } from "./hover";

export const useHovered = () => {
  const state = useContext(HoverContext);
  if (!state) throw new Error("useHovered must be used within a HoverContext");
  return state;
};
