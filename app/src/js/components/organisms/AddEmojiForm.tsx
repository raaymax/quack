import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Icon } from "../atoms/Icon";
import { FormHelpText, FormInput } from "../atoms/FormInput";
import { Button } from "../molecules/Button";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

const cleanShortname = (s: string) =>
  s.trim().replace(/^:/, "").replace(/:$/, "");

const ERROR_COLOR = "#e5484d";
const WARNING_COLOR = "#e5a23d";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid ${(props) => props.theme.Strokes};
  padding: 12px;

  .add-emoji-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  .add-emoji-preview {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 48px;
    width: 48px;
    height: 48px;
    border-radius: 8px;
    border: 1px dashed ${(props) => props.theme.Strokes};
    overflow: hidden;
    cursor: pointer;
    color: ${(props) => props.theme.Labels};
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .add-emoji-shortname {
    flex: 1 1 auto;
    height: 40px;
  }

  .add-emoji-actions {
    display: flex;
    flex-direction: row;
    gap: 8px;

    button {
      flex: 1 1 0;
      padding: 11px 16px;
    }
  }

  .add-emoji-error {
    color: ${ERROR_COLOR};
  }

  .add-emoji-warning-panel {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid ${WARNING_COLOR};
    background-color: ${WARNING_COLOR}1a;
    color: ${(props) => props.theme.Text};
    font-size: 13px;
    line-height: 18px;

    .icon {
      color: ${WARNING_COLOR};
      flex: 0 0 auto;
    }
  }
`;

type AddEmojiFormProps = {
  onClose: () => void;
};

export const AddEmojiForm = observer(({ onClose }: AddEmojiFormProps) => {
  const [pendingReplace, setPendingReplace] = useState(false);
  const [shortname, setShortname] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const app = useApp();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    setPendingReplace(false);
  }, [shortname, file]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    if (picked && !picked.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    setError(null);
    setFile(picked);
  };

  const submit = async () => {
    const cleaned = cleanShortname(shortname);
    if (!/^[a-zA-Z0-9_+-]+$/.test(cleaned)) {
      setError("Invalid shortname. Use letters, numbers, _ + -");
      return;
    }
    if (!file) {
      setError("Please choose an image");
      return;
    }
    const sn = `:${cleaned}:`;
    const existing = app.emojis.get(sn);
    const isCustom = Boolean(existing?.fileId) && !existing?.unicode;
    if (isCustom && !pendingReplace) {
      setPendingReplace(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (isCustom) {
        await app.emojis.replace(sn, file);
      } else {
        await app.emojis.create(sn, file);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save emoji");
      setSubmitting(false);
    }
  };

  return (
    <Container className="cmp-add-emoji-form">
      {pendingReplace
        ? (
          <div className="add-emoji-warning-panel">
            <Icon icon="lock" size={16} />
            <span>
              {`:${cleanShortname(shortname)}: already exists. ` +
                "Replace it with the new image?"}
            </span>
          </div>
        )
        : (
          <>
            <div className="add-emoji-row">
              <div
                className="add-emoji-preview"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl
                  ? <img src={previewUrl} alt="emoji preview" />
                  : <Icon icon="icons" size={20} />}
              </div>
              <FormInput
                className="add-emoji-shortname"
                placeholder=":shortname:"
                value={shortname}
                autoFocus
                onChange={(e) => setShortname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={pickFile}
              />
            </div>
            {error && (
              <FormHelpText className="add-emoji-error">{error}</FormHelpText>
            )}
          </>
        )}
      <div className="add-emoji-actions">
        <Button
          type="secondary"
          onClick={() => pendingReplace ? setPendingReplace(false) : onClose()}
        >
          {pendingReplace ? "Back" : "Cancel"}
        </Button>
        <Button type="primary" onClick={submit} disabled={submitting}>
          {submitting ? "Saving…" : pendingReplace ? "Replace" : "Add"}
        </Button>
      </div>
    </Container>
  );
});
