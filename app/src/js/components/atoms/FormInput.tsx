import styled from "styled-components";

export const FormInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.Strokes};
  background-color: ${({ theme }) => theme.Input.Background};
  color: ${({ theme }) => theme.Text};
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.Labels};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.PrimaryButton.Background};
  }
`;

export const FormTextArea = styled.textarea`
  min-height: 80px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.Strokes};
  background-color: ${({ theme }) => theme.Input.Background};
  color: ${({ theme }) => theme.Text};
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;

  &::placeholder {
    color: ${({ theme }) => theme.Labels};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.PrimaryButton.Background};
  }
`;

export const FormLabel = styled.label`
  color: ${({ theme }) => theme.Text};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  padding-left: 4px;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const FormHelpText = styled.span`
  color: ${({ theme }) => theme.Labels};
  font-size: 12px;
  line-height: 16px;
  padding-left: 4px;
`;
