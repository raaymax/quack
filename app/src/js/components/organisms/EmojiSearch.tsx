import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { SearchBox } from "../atoms/SearchBox";
import { type Emoji as EmojiType, EmojiDescriptor } from "../../types";
import { Icon } from "../atoms/Icon";
import { ClassNames, cn } from "../../utils";
import { Emoji } from "../molecules/Emoji";
import { Button } from "../molecules/Button";
import { FormHelpText, FormInput } from "../atoms/FormInput";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";

export const Label = styled.div`
  width: 100%;
  color: ${(props) => props.theme.SecondaryButton.Default};
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 20px; /* 166.667% */
  padding: 0 4px;
`;

export const EmojiSearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 300px;
  height: 400px;
  padding: 0;
  border-radius: 8px;
  background-color: ${(props) => props.theme.Chatbox.Background};
  box-shadow: 0px 0px 8px 0px rgba(0, 0, 0, 0.20);

  user-select: none;
  * {
    user-select: none;
  }

  .emoji-search {
    flex: 0 0 56px;
    padding: 16px 8px 0 8px;

    .emoji-search-box {
      height: 40px;
      width: 100%;
    }
  }

  .emoji-scroll {
    flex: 1 1 auto;
    overflow-y: scroll;
    scrollbar-width: none;
    overflow-x: hidden;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .add-emoji {
    display: flex;
    flex-direction: row;
    border-top: 1px solid ${(props) => props.theme.Strokes};
    flex: 0 0 32px;
    padding: 8px 12px;
  }
`;

const AddEmojiForm = styled.div`
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
    color: ${(props) => props.theme.Error ?? "#e5484d"};
  }
`;

const EmojiCategory = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px;
`;

const EmojiBlock = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
`;

const EmojiContainer = styled.div`
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  font-size: 20px;
  align-content: center;
  vertical-align: middle;
  text-align: center;
  line-height: 30px;
  cursor: pointer;
  user-select: none;
  img {
    width: 28px;
    height: 28px;
  }
  body.mobile & {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    font-size: 30px;
    img {
      width: 38px;
      height: 38px;
    }
  }
  &:hover {
    border-radius: 5px;
    background-color: rgba(249, 249, 249, 0.05);
  }
`;

const CATEGORIES: Record<string, string> = {
  p: "People",
  c: "Custom",
  n: "Nature",
  d: "Food",
  a: "Activity",
  t: "Travel",
  o: "Objects",
  s: "Symbols",
  k: "Flags",
  f: "Font",
  x: "Other",
};

type EmojiSearchProps = {
  onSelect: (e: EmojiDescriptor) => void;
  className?: ClassNames;
};

export const EmojiSearch = observer(
  ({ className, onSelect }: EmojiSearchProps) => {
    const [name, setName] = useState("");
    const [results, setResults] = useState<Record<string, EmojiType[]>>({});
    const [order, setOrder] = useState<string[]>([]);
    const [adding, setAdding] = useState(false);
    const [shortname, setShortname] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const app = useApp();
    const emojis = app.emojis.getAll();
    const fuse = app.emojis.getFuse();

    useEffect(() => {
      if (!file) {
        setPreviewUrl(null);
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }, [file]);

    const resetForm = () => {
      setAdding(false);
      setShortname("");
      setFile(null);
      setError(null);
      setSubmitting(false);
    };

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
      const cleaned = shortname.trim().replace(/^:/, "").replace(/:$/, "");
      if (!/^[a-zA-Z0-9_+-]+$/.test(cleaned)) {
        setError("Invalid shortname. Use letters, numbers, _ + -");
        return;
      }
      if (!file) {
        setError("Please choose an image");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await app.emojis.create(`:${cleaned}:`, file);
        resetForm();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add emoji");
        setSubmitting(false);
      }
    };

    useEffect(() => {
      if (!name || !fuse) {
        const grouped = emojis.reduce<Record<string, EmojiType[]>>(
          (acc, emoji) => {
            const category = emoji.category || "x";
            (acc[category] = acc[category] || []).push(emoji);
            return acc;
          },
          {},
        );
        setResults(grouped);
        setOrder(Object.keys(CATEGORIES).filter((c) => grouped[c]));
        return;
      }

      const ret = fuse.search(name, { limit: 100 });
      const grouped: Record<string, EmojiType[]> = {};
      const bestScore: Record<string, number> = {};
      for (const r of ret) {
        const emoji = r.item as EmojiType;
        if (emoji.empty) continue;
        const category = emoji.category || "x";
        (grouped[category] = grouped[category] || []).push(emoji);
        const score = r.score ?? 1;
        if (bestScore[category] === undefined || score < bestScore[category]) {
          bestScore[category] = score;
        }
      }
      setResults(grouped);
      setOrder(
        Object.keys(grouped)
          .filter((c) => CATEGORIES[c])
          .sort((a, b) => bestScore[a] - bestScore[b]),
      );
    }, [name, fuse]);

    const renderEmoji = (result: EmojiType) => (
      <EmojiContainer
        key={result.shortname}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelect(result);
        }}
      >
        <Emoji shortname={result.shortname} size={24} />
      </EmojiContainer>
    );

    return (
      <EmojiSearchContainer className={cn("cmp-emoji-search", className)}>
        <div className="emoji-search">
          <SearchBox
            className="emoji-search-box"
            onChange={(e) => setName(e.target.value)}
            value={name}
          />
        </div>
        <div className="emoji-scroll">
          <div>
            {order.filter((c: string) => results[c]).map((
              category: string,
            ) => (
              <EmojiCategory key={category}>
                <Label>{CATEGORIES[category]}</Label>
                <EmojiBlock>
                  {(results[category] || []).map(renderEmoji)}
                </EmojiBlock>
              </EmojiCategory>
            ))}
          </div>
        </div>
        {adding
          ? (
            <AddEmojiForm className="cmp-add-emoji-form">
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
              <div className="add-emoji-actions">
                <Button type="secondary" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="primary" onClick={submit} disabled={submitting}>
                  {submitting ? "Adding…" : "Add"}
                </Button>
              </div>
            </AddEmojiForm>
          )
          : (
            <div className="add-emoji">
              <Button type="secondary" onClick={() => setAdding(true)}>
                ADD EMOJI
                <Icon icon="plus" size={16} />
              </Button>
            </div>
          )}
      </EmojiSearchContainer>
    );
  },
);
