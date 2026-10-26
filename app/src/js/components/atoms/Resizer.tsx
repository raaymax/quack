import { useCallback, useRef, useState } from "react";
import { cn } from "../../utils";
import styled from "styled-components";
import { observer } from "mobx-react-lite";

const MIN_SIZE = 150;
const MAX_SIZE = 500;

const Container = styled.div`
  position: relative;
  flex: 0 0 8px;
  cursor: ew-resize;
  touch-action: none;
  user-select: none;
  background-color: ${(props) => props.theme.Channel.Background};
  border-right: 0;
  &:hover {
    border-right: 1px solid ${(props) => props.theme.PrimaryButton.Background};
  }
  &.dragging {
    border-right: 3px solid ${(props) => props.theme.PrimaryButton.Background};
  }
`;

export const Resizer = observer(
  ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
    const [dragging, setDragging] = useState<boolean>(false);
    const start = useRef<{ x: number; size: number } | null>(null);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { x: e.clientX, size: value };
      setDragging(true);
    }, [value]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
      if (!start.current) return;
      const newSize = Math.max(
        MIN_SIZE,
        Math.min(MAX_SIZE, start.current.size + e.clientX - start.current.x),
      );
      onChange(newSize);
    }, [onChange]);

    const onPointerUp = useCallback((e: React.PointerEvent) => {
      if (!start.current) return;
      start.current = null;
      setDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      localStorage.setItem("sidebar-size", `${value}`);
    }, [value]);

    return (
      <Container
        className={cn("resizer", { dragging })}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    );
  },
);
