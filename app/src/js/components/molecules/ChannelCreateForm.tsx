import { useCallback, useState } from "react";
import styled from "styled-components";
import { Icon } from "../atoms/Icon";

const Overlay = styled.div`
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

const Modal = styled.div`
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

const Header = styled.div`
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

const CloseButton = styled.button`
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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: ${({ theme }) => theme.Text};
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  padding-left: 4px;
`;

const Input = styled.input`
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

const TextArea = styled.textarea`
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

const HelpText = styled.span`
  color: ${({ theme }) => theme.Labels};
  font-size: 12px;
  line-height: 16px;
  padding-left: 4px;
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
    <Overlay onClick={handleOverlayClick}>
      <Modal>
        <Header>
          <h2>
            <Icon icon="hash" size={24} />
            Create a channel
          </h2>
          <CloseButton onClick={onCancel} type="button">
            <Icon icon="xmark" size={20} />
          </CloseButton>
        </Header>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Channel type</Label>
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
            <Label htmlFor="channel-name">Name</Label>
            <NameInputWrapper>
              <NamePrefix>#</NamePrefix>
              <Input
                id="channel-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"))}
                placeholder="e.g. marketing"
                autoFocus
              />
            </NameInputWrapper>
            <HelpText>
              Names must be lowercase, without spaces or periods.
            </HelpText>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="channel-description">
              Description <span style={{ fontWeight: 400 }}>(optional)</span>
            </Label>
            <TextArea
              id="channel-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
            />
            <HelpText>Let people know what this channel is for.</HelpText>
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
      </Modal>
    </Overlay>
  );
};

export default ChannelCreateForm;
