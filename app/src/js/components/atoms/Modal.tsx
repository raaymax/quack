import styled from "styled-components";
import { Icon } from "./Icon";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  @media (max-width: 540px) {
    align-items: flex-end;
  }
`;

export const ModalContainer = styled.div`
  background-color: ${({ theme }) => theme.Chatbox.Background};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.Strokes};
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);

  @media (max-width: 540px) {
    max-width: 100%;
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
    padding: 20px 16px;
    padding-bottom: calc(20px + env(safe-area-inset-bottom));
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  h2 {
    color: ${({ theme }) => theme.Text};
    font-size: 24px;
    font-weight: 600;
    line-height: 32px;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  @media (max-width: 540px) {
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
      line-height: 28px;
      gap: 8px;
    }
  }
`;

const CloseButtonStyled = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  color: ${({ theme }) => theme.Labels};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: ${({ theme }) => theme.Channel.Hover};
    color: ${({ theme }) => theme.Text};
  }
`;

type ModalCloseButtonProps = {
  onClick?: () => void;
};

export const ModalCloseButton = ({ onClick }: ModalCloseButtonProps) => (
  <CloseButtonStyled onClick={onClick} type="button">
    <Icon icon="xmark" size={20} />
  </CloseButtonStyled>
);
