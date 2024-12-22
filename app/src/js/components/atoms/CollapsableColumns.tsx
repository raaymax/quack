import { useCallback, useEffect, useRef, useState } from "react";
import { ClassNames, cn } from "../../utils";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: row;

`;

type CollapsableColumnsProps = {
  className?: ClassNames;
  minSize: number;
  columns: [React.ReactNode, React.ReactNode?];
};
export const CollapsableColumns = ({ className, columns, minSize }: CollapsableColumnsProps) => {
  const container = useRef<HTMLDivElement>(null);
  const [oneColumn, setOneColumn] = useState(false);

  const onResize = useCallback(() => {
    const width = container.current?.offsetWidth ?? (3*minSize);
    setOneColumn(width < 2*minSize);
  }, [setOneColumn]);

  useEffect(() => {
    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [onResize]);

  const [Column1, Column2] = columns;

  return (
    <Container className={cn(className, {collapsed: oneColumn})} ref={container}>
      {(!Column2 || !oneColumn) && Column1}
      {Column2}
    </Container>
  );
}
