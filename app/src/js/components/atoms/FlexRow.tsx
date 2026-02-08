import styled from "styled-components";

export const FlexRow = styled.div<{ $gap?: string; $align?: string }>`
  display: flex;
  flex-direction: row;
  gap: ${(props) => props.$gap ?? "8px"};
  align-items: ${(props) => props.$align ?? "center"};
`;
