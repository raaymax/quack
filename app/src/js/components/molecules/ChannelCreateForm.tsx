import { useCallback, useState } from "react";
import styled from "styled-components";
import { Icon } from "../atoms/Icon";
import { ModalOverlay, ModalContainer, ModalHeader, ModalCloseButton } from "../atoms/Modal";
import { FormInput, FormTextArea, FormLabel, FormGroup, FormHelpText } from "../atoms/FormInput";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ChannelTypeSelector = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 540px) {
    flex-direction: column;
  }
`;

const ChannelTypeOption = styled.button<{ $isSelected: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid
    ${({ theme, $isSelected }) =>
      $isSelected ? theme.PrimaryButton.Background : theme.Strokes};
  background-color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.Channel.Active : theme.Input.Background};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme, $isSelected }) =>
      $isSelected ? theme.PrimaryButton.Background : theme.Labels};
    background-color: ${({ theme }) => theme.Channel.Hover};
  }

  .icon-container {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background-color: ${({ theme, $isSelected }) =>
      $isSelected ? theme.PrimaryButton.Background : theme.Strokes};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme, $isSelected }) =>
      $isSelected ? theme.PrimaryButton.Text : theme.Text};
  }

  .text {
    text-align: left;

    .title {
      color: ${({ theme }) => theme.Text};
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      display: block;
    }

    .description {
      color: ${({ theme }) => theme.Labels};
      font-size: 12px;
      line-height: 16px;
      display: block;
    }
  }

  @media (max-width: 540px) {
    padding: 12px;

    .icon-container {
      width: 36px;
      height: 36px;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;

  @media (max-width: 540px) {
    flex-direction: column-reverse;
    gap: 8px;
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ theme, $variant }) =>
    $variant === "primary"
      ? `
    background-color: ${theme.PrimaryButton.Background};
    color: ${theme.PrimaryButton.Text};
    border: none;

    &:hover {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `
      : `
    background-color: transparent;
    color: ${theme.Text};
    border: 1px solid ${theme.SecondaryButton.Default};

    &:hover {
      border-color: ${theme.SecondaryButton.Hover};
      background-color: ${theme.Channel.Hover};
    }
  `}

  @media (max-width: 540px) {
    width: 100%;
    padding: 14px 24px;
  }
`;

const NamePrefix = styled.span`
  color: ${({ theme }) => theme.Labels};
  font-size: 18px;
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
`;

const NameInputWrapper = styled.div`
  position: relative;

  input {
    padding-left: 32px;
  }
`;

/**
 * Normalizes a channel name to be lowercase with only alphanumeric characters and hyphens.
 * Multiple consecutive hyphens are collapsed into a single hyphen.
 */
export const normalizeChannelName = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
};

type ChannelType = "public" | "private";

type ChannelCreateFormProps = {
  onSubmit?: (data: { name: string; description: string; type: ChannelType }) => void;
  onCancel?: () => void;
  isOpen?: boolean;
};

export const ChannelCreateForm = ({
  onSubmit,
  onCancel,
  isOpen = true,
}: ChannelCreateFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channelType, setChannelType] = useState<ChannelType>("public");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      onSubmit?.({ name: name.trim(), description: description.trim(), type: channelType });
      setName("");
      setDescription("");
      setChannelType("public");
    },
    [name, description, channelType, onSubmit]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onCancel?.();
      }
    },
    [onCancel]
  );

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <h2>
            <Icon icon="hash" size={24} />
            Create a channel
          </h2>
          <ModalCloseButton onClick={onCancel} />
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <FormLabel>Channel type</FormLabel>
            <ChannelTypeSelector>
              <ChannelTypeOption
                type="button"
                $isSelected={channelType === "public"}
                onClick={() => setChannelType("public")}
              >
                <div className="icon-container">
                  <Icon icon="hash" size={20} />
                </div>
                <div className="text">
                  <span className="title">Public</span>
                  <span className="description">Anyone can join</span>
                </div>
              </ChannelTypeOption>

              <ChannelTypeOption
                type="button"
                $isSelected={channelType === "private"}
                onClick={() => setChannelType("private")}
              >
                <div className="icon-container">
                  <Icon icon="lock" size={20} />
                </div>
                <div className="text">
                  <span className="title">Private</span>
                  <span className="description">Invite only</span>
                </div>
              </ChannelTypeOption>
            </ChannelTypeSelector>
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="channel-name">Name</FormLabel>
            <NameInputWrapper>
              <NamePrefix>#</NamePrefix>
              <FormInput
                id="channel-name"
                type="text"
                value={name}
                onChange={(e) => setName(normalizeChannelName(e.target.value))}
                placeholder="e.g. marketing"
                autoFocus
              />
            </NameInputWrapper>
            <FormHelpText>
              Names must be lowercase, without spaces or periods.
            </FormHelpText>
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="channel-description">
              Description <span style={{ fontWeight: 400 }}>(optional)</span>
            </FormLabel>
            <FormTextArea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
            />
            <FormHelpText>Let people know what this channel is for.</FormHelpText>
          </FormGroup>

          <ButtonGroup>
            <Button type="button" $variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" $variant="primary" disabled={!name.trim()}>
              Create Channel
            </Button>
          </ButtonGroup>
        </Form>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ChannelCreateForm;
