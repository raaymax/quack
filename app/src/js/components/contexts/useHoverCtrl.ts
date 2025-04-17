import { useCallback } from "react";
import { useHovered } from "./useHovered.ts";
import { isMobile } from "../../utils.ts";

export const useHoverCtrl = (id?: string) => {
  const [hovered, setHovered] = useHovered();

  const onEnter = useCallback(() => {
    setHovered(id ?? null);
  }, [setHovered, id]);

  const toggleHovered = useCallback(() => {
    if (!isMobile()) return;
    if (hovered !== id) {
      setHovered(id ?? null);
    } else {
      setHovered(null);
    }
  }, [hovered, setHovered, id]);

  const onLeave = useCallback(() => {
    if (hovered === id) {
      setHovered(null);
    }
  }, [setHovered, hovered, id]);

  return { onEnter, onLeave, toggleHovered };
};
