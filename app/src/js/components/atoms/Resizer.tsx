import { useCallback, useState } from "react";
import { cn } from "../../utils";
import styled from "styled-components";
import { observer } from "mobx-react-lite";

const Container = styled.div`
  position: relative;
  flex: 0 0 8px;
  cursor: ew-resize;
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
    const [prevPos, setPrevPos] = useState<number | null>(null);
    const [dragging, setDragging] = useState<boolean>(false);
    const startDrag = useCallback((e: React.DragEvent) => {
      setDragging(true);
      const img = document.getElementById("void") as HTMLImageElement;
      e.dataTransfer.setDragImage(img, 0, 0);
    }, [setDragging]);
    const endDrag = useCallback(() => {
      console.log("end");
      setDragging(false);
      setPrevPos(null);
    }, [setDragging, setPrevPos]);
    const resize = useCallback((e: React.DragEvent) => {
      if (e.clientX === 0) return;
      if (prevPos === null) return setPrevPos(e.clientX);
      const deltaX = e.clientX - prevPos;
      const newSize = Math.max(150, Math.min(500, value + deltaX));
      onChange(newSize);
      localStorage.setItem("sidebar-size", `${newSize}`);
      setPrevPos(e.clientX);
    }, [value, onChange, prevPos, setPrevPos]);

    return (
      <Container
        className={cn("resizer", { dragging })}
        onDragStart={startDrag}
        onDragEnd={endDrag}
        onDrag={resize}
        draggable
      >
        <img
          src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAwAB/ckM3ZIAAAAASUVORK5CYII="
          id="void"
        />
      </Container>
    );
  },
);
