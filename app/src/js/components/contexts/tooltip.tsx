import React, { createContext, useCallback, useState } from "react";
import styled from "styled-components";

export type TooltipContextType = {
  show: (
    pos: [number, number] | [number, number, "top" | "bottom"],
    content: React.ReactNode,
    parent: React.ReactNode | HTMLElement,
  ) => void;
  hide: (p: any) => void;
};

export const TooltipContext = createContext<TooltipContextType | undefined>(
  undefined,
);

type TooltipContextProps = {
  children: React.ReactNode;
};

const StyledTooltip = styled.div`
  position: fixed;
  z-index: 101;
  left: 50%;
  transform: translateX(-50%);
  background-color: black;
  width: max-content;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  pointer-events: none;
  animation: fadein 0.5s;
  text-align: center;
  @keyframes fadein {
    0% {
      opacity: 0;
    }
    99% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`;

export const TooltipProvider = ({ children }: TooltipContextProps) => {
  const [pos, setPos] = useState<
    [number, number] | [number, number, "top" | "bottom"]
  >([0, 0]);
  const [content, setContent] = useState<React.ReactNode>(<>Tooltip</>);
  const [parent, setParent] = useState<React.ReactNode | HTMLElement | null>(
    null,
  );

  const show = useCallback(
    (
      pos: [number, number] | [number, number, "top" | "bottom"],
      content: React.ReactNode,
      parent: React.ReactNode | HTMLElement,
    ) => {
      setContent(content);
      setPos(pos);
      setParent(parent);
    },
    [setContent, setPos, setParent],
  );

  const hide = useCallback((p: any) => {
    if (parent === p) {
      setParent(null);
    }
  }, [setParent, parent]);

  return (
    <TooltipContext.Provider value={{ show, hide }}>
      {children}
      <StyledTooltip
        id="tooltip"
        style={{
          transform: pos.length === 3
            ? `translateX(-50%) translateY(${pos[2] === "top" ? "-" : ""}100%)`
            : "translateX(-50%)",
          display: parent ? "block" : "none",
          top: `${pos[1]}px`,
          left: `${pos[0]}px`,
        }}
      >
        {content}
      </StyledTooltip>
    </TooltipContext.Provider>
  );
};
