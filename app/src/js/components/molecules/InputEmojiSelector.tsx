import { useCallback, useEffect, useMemo, useState } from "react";
import { TextMenu } from "./TextMenu";
import { useInput } from "../contexts/useInput";
import { buildEmojiNode } from "../../utils";
import { EmojiDescriptor } from "../../types";
import { observer } from "mobx-react-lite";
import { useApp } from "../contexts/appState";
import { client } from "../../core";

const SCOPE = "emoji";

type MenuOption = {
  label?: string;
  url?: string;
  name: string;
  action?: string;
  item?: EmojiDescriptor;
};

export const EmojiSelector = observer(() => {
  const [selected, setSelected] = useState(0);
  const app = useApp();
  const {
    input,
    currentText,
    scope,
    insert,
    scopeContainer,
    replace,
  } = useInput();
  const emojis = app.emojis.getAll();
  const fuse = app.emojis.getFuse();

  const options = useMemo(() => {
    let em = fuse.search(currentText || "").slice(0, 5).map(({ item }) => item);
    em = em.length ? em : emojis.slice(0, 5);
    const opts: MenuOption[] = [
      ...em.map((item) => {
        if (item.empty) return item;
        return ({
          empty: false,
          label: item.unicode &&
            String.fromCodePoint(parseInt(item.unicode, 16)),
          url: item.fileId && client.api.getUrl(item.fileId),
          name: item.shortname,
          item,
        });
      }).filter((e) => !e.empty) as MenuOption[],
      { label: "❌", name: "no emoji", action: "close" },
    ];
    return opts;
  }, [fuse, emojis, currentText]);

  const create = useCallback((event: Event) => {
    event.preventDefault();
    const span = document.createElement("span");
    span.className = "emoji-selector";
    const text = document.createTextNode(":");
    span.appendChild(text);
    span.setAttribute("data-scope", SCOPE);
    insert(span);
    const r = document.createRange();
    r.setStart(text, 1);
    r.setEnd(text, 1);
    const sel = document.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
    return span;
  }, [insert]);

  type SubmitProps = { s?: number; shortName?: string; exact?: boolean };
  const submit = useCallback(
    (event: Event, { s, shortName, exact = true }: SubmitProps = {}) => {
      if (!scopeContainer) return;
      let container = scopeContainer;
      if (scope !== SCOPE) {
        container = create(event);
      }
      const name = shortName || `${container.textContent}:`;
      const emoji = exact
        ? emojis.find((e) => e.shortname === name)
        : options[s ?? selected].item;
      const node = emoji
        ? buildEmojiNode(emoji, client.api.getUrl)
        : document.createTextNode(name);
      const fresh = document.createTextNode("\u00A0");
      const r = document.createRange();
      r.setEndAfter(container);
      r.setStartAfter(container);
      r.insertNode(fresh);
      r.setStart(fresh, 1);
      r.setEnd(fresh, 1);
      const sel = document.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
      container.replaceWith(node);
      event.preventDefault();
      event.stopPropagation();
    },
    [options, selected, scopeContainer, emojis, create, scope],
  );

  const remove = useCallback((event: Event) => {
    if (!scopeContainer) return;
    if (scopeContainer.textContent?.length === 1) {
      scopeContainer.remove();
      event.preventDefault();
      event.stopPropagation();
    }
  }, [scopeContainer]);

  const close = useCallback((e: Event) => {
    if (!scopeContainer) return;
    const text = scopeContainer.textContent ?? "";
    const node = document.createTextNode(text);
    scopeContainer.replaceWith(node);
    const r = document.createRange();
    r.setEnd(node, text.length);
    r.setStart(node, text.length);
    const sel = document.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
    e.preventDefault();
    e.stopPropagation();
  }, [scopeContainer]);

  const ctrl = useCallback((e: KeyboardEvent) => {
    if (scope === "root" && currentText.match(/(^|\s)<$/) && e.key === "3") {
      replace(/<$/, "");
      submit(e, { shortName: ":heart:" });
    }
    if (scope === "root" && currentText.match(/(^|\s);$/) && e.key === ")") {
      replace(/;$/, "");
      submit(e, { shortName: ":wink:" });
    }
    if (scope === "root" && currentText.match(/(^|\s)$/) && e.key === ":") {
      create(e);
    }
    if (scope === SCOPE) {
      if (
        e.key === " " || e.key === "Space" || e.keyCode === 32 ||
        e.key === "Enter"
      ) {
        if (options[selected].action === "close") {
          close(e);
        } else {
          submit(e, { exact: false });
        }
      }
      if (e.key === ":") {
        submit(e);
      }
      if (currentText.match(/^:$/) && e.key === "*") {
        submit(e, { shortName: ":kissing_heart:" });
      }
      if (currentText.match(/^:$/) && e.key === "/") {
        submit(e, { shortName: ":confused:" });
      }
      if (currentText.match(/^:$/) && e.key === ")") {
        submit(e, { shortName: ":slight_smile:" });
      }
      if (currentText.match(/^:$/) && e.key === "D") {
        submit(e, { shortName: ":smiley:" });
      }
      if (currentText.match(/^:$/) && e.key === "(") {
        submit(e, { shortName: ":disappointed:" });
      }
      if (currentText.match(/^:'$/) && e.key === "(") {
        submit(e, { shortName: ":cry:" });
      }
      if (currentText.match(/^:$/) && e.key === "O") {
        submit(e, { shortName: ":open_mouth:" });
      }
      if (currentText.match(/^:$/) && e.key === "P") {
        submit(e, { shortName: ":stuck_out_tongue:" });
      }
      if (currentText.match(/^:$/) && e.key === "S") {
        submit(e, { shortName: ":confounded:" });
      }
      if (currentText.match(/^:$/) && e.key === "X") {
        submit(e, { shortName: ":mask:" });
      }
      if (currentText.match(/^:$/) && e.key === "Z") {
        submit(e, { shortName: ":sleeping:" });
      }

      if (e.key === "Backspace") {
        remove(e);
      }
    }
  }, [
    currentText,
    scope,
    create,
    remove,
    submit,
    replace,
    options,
    selected,
    close,
  ]);

  const onSelect = useCallback((idx: number, e: Event) => {
    submit(e, { exact: false, s: idx });
  }, [submit]);

  useEffect(() => {
    const { current } = input;
    if (!current) return;
    current.addEventListener("keydown", ctrl);
    return () => {
      current.removeEventListener("keydown", ctrl);
    };
  }, [input, ctrl]);

  if (scope !== SCOPE) return null;

  return (
    <TextMenu
      open
      options={options}
      onSelect={(idx, ev) => onSelect(idx, ev.nativeEvent)}
      selected={selected}
      setSelected={setSelected}
    />
  );
});
