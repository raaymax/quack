import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useInput } from "../contexts/useInput";
import { observer } from "mobx-react-lite";

export const Menu = styled.div<{ top: number; left: number; height: number }>`
  position: absolute;
  margin-top: ${(props) => -props.height * 30 - 40}px;
  width: 300px;
  height: ${(props) => props.height * 30 + 20}px;
  background-color: var(--primary_background);
  bottom: 70px;
  left: 20px;
  font-size: 1.2em;
  padding: 10px 0;
  border-radius: 10px;
  border: 1px solid var(--primary_border_color);
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;

  &.hidden {
    display: none;
  }

  & ul {
    padding: 0;
    margin: 0;
    display: flex;
    list-style-type: none;
    flex-direction: column-reverse;
  }

  & ul li {
    height: 30px;
    display: flex;
    flex-direction: row;
    cursor: pointer;

    img {
      width: 1.5em;
      height: 1.5em;
      display: inline-block;
      vertical-align: bottom;
    }
  }
  & ul li:hover {
    background-color: var(--primary_active_mask);
  }

  & ul li.selected {
    background-color: var(--primary_active_mask);
  }

  & ul li span:first-child {
    height: 30px;
    width: 30px;
  }
  & ul li span {
    line-height: 30px;
    vertical-align: middle;
    text-align: center;
  }
`;

type TextMenuProps = {
  className?: string;
  options: {
    label?: string;
    name: string;
    icon?: string;
    url?: string;
  }[];
  open?: boolean;
  onSelect: (idx: number, e: React.MouseEvent) => void;
  selected: number;
  setSelected: (idx: number) => void;
};

export const TextMenu = observer(({
  className,
  options,
  open = false,
  onSelect,
  selected = 0,
  setSelected,
}: TextMenuProps) => {
  const [coords, setCoords] = useState([0, 0]);
  const { input, getRange } = useInput();

  const getXPos = useCallback(() => {
    if (!input.current) return 0;
    const width = parseInt(
      window.getComputedStyle(input.current).width.replace("px", ""),
      10,
    );
    if (coords[1] + 300 > width) {
      return width - 300;
    }
    return coords[1];
  }, [input, coords]);

  const getYPos = () => coords[0];

  useEffect(() => {
    const inputEl = input.current;
    const range = getRange();
    if (!inputEl || !range) return;
    const box = range.getBoundingClientRect();
    const inBox = inputEl.getBoundingClientRect();
    setCoords([box.bottom - inBox.top, box.left - inBox.left]);
  }, [input, getRange]);

  const ctrl = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      setSelected(
        selected + 1 > options.length - 1 ? options.length - 1 : selected + 1,
      );
      e.preventDefault();
      e.stopPropagation();
    }
    if (e.key === "ArrowDown") {
      setSelected(selected - 1 < 0 ? 0 : selected - 1);
      e.preventDefault();
      e.stopPropagation();
    }
  }, [selected, setSelected, options]);

  useEffect(() => {
    const { current } = input;
    if (!current) return;
    current.addEventListener("keydown", ctrl);
    return () => {
      current.removeEventListener("keydown", ctrl);
    };
  }, [input, ctrl]);

  return open && (
    <Menu
      className={className}
      top={getYPos()}
      left={getXPos()}
      height={options.length}
    >
      <ul>
        {options.map((e, idx) => (
          <li
            key={idx}
            onClick={(ev) => onSelect(idx, ev)}
            className={idx === selected ? "selected" : ""}
          >
            {e.icon && (
              <span>
                <i className={e.icon} />
              </span>
            )}
            {e.url && (
              <span>
                <img src={e.url} alt="img" />
              </span>
            )}
            {!e.icon && !e.url && <span>{e.label || ""}</span>}
            <span>{e.name}</span>
          </li>
        ))}
      </ul>
    </Menu>
  );
});
