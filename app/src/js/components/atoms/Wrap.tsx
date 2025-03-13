import styled from "styled-components";

export const Wrap = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  gap: 8px;
  & > * {
    flex: 0 0;
  }
`;
