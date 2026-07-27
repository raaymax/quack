import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { observer } from "mobx-react-lite";
import { Icon } from "../atoms/Icon";
import {
  ModalCloseButton,
  ModalContainer,
  ModalHeader,
  ModalOverlay,
} from "../atoms/Modal";
import {
  FormGroup,
  FormHelpText,
  FormInput,
  FormLabel,
} from "../atoms/FormInput";
import { ProfilePic } from "../atoms/ProfilePic";
import { Button } from "../molecules/Button";
import { useApp } from "../contexts/appState";
import { getFileUrl } from "../hooks/fileUrl";

const ERROR_COLOR = "#e5484d";

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const AvatarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  .avatar-edit {
    position: relative;
    cursor: pointer;
    flex: 0 0 auto;

    .overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      background-color: rgba(0, 0, 0, 0.45);
      color: #fff;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover .overlay {
      opacity: 1;
    }
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;

  button {
    flex: 1 1 0;
  }
`;

const ErrorText = styled(FormHelpText)`
  color: ${ERROR_COLOR};
`;

type ProfileSettingsProps = {
  onClose: () => void;
};

export const ProfileSettings = observer(({ onClose }: ProfileSettingsProps) => {
  const app = useApp();
  const profile = app.profile;

  const [name, setName] = useState(profile?.name ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!profile) return null;

  const avatarUrl = previewUrl ?? getFileUrl(profile.avatarFileId);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    if (picked && !picked.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    setError(null);
    setFile(picked);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name can't be empty");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (file) await app.uploadAvatar(file);
      if (trimmed !== profile.name) await app.updateProfile(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer className="cmp-profile-settings">
        <ModalHeader>
          <h2>
            <Icon icon="user" size={24} />
            Profile settings
          </h2>
          <ModalCloseButton onClick={onClose} />
        </ModalHeader>

        <Body>
          <AvatarRow>
            <div
              className="avatar-edit"
              onClick={() => fileInputRef.current?.click()}
            >
              <ProfilePic type="regular" avatarUrl={avatarUrl} />
              <div className="overlay">
                <Icon icon="edit" size={18} />
              </div>
            </div>
            <Button type="secondary" onClick={() => fileInputRef.current?.click()}>
              Change avatar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={pickFile}
            />
          </AvatarRow>

          <FormGroup>
            <FormLabel htmlFor="profile-name">Name</FormLabel>
            <FormInput
              id="profile-name"
              type="text"
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="profile-email">Email</FormLabel>
            <FormInput id="profile-email" type="text" value={profile.email} disabled />
            <FormHelpText>Email cannot be changed yet.</FormHelpText>
          </FormGroup>

          {error && <ErrorText>{error}</ErrorText>}

          <ActionRow>
            <Button type="secondary" onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={submit} disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </ActionRow>
        </Body>
      </ModalContainer>
    </ModalOverlay>
  );
});

export default ProfileSettings;
