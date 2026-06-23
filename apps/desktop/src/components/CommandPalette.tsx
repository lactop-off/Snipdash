import { useEffect, useMemo, useRef, useState } from "react";
import { type Hit, fuzzyScore, searchWorkspace } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { copyResolved } from "../actions";
import { Icon } from "./Icon";

export interface PaletteCommand {
  id: string;
  title: string;
  icon: string;
  keywords?: string;
  run: () => void;
}

interface Item {
  key: string;
  icon: string;
  title: string;
  subtitle: string;
  hint: string;
  run: (alt: boolean) => void;
}

const CARD_ICON: Record<string, string> = {
  text: "file-text",
  markdown: "file-text",
  code: "code",
  todo: "list-todo",
};

export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
}) {
  const workspace = useStore((s) => s.workspace);
  const setActiveBoard = useStore((s) => s.setActiveBoard);
  const flashCard = useStore((s) => s.flashCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSel(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const { commandItems, resultItems } = useMemo(() => {
    const q = query.trim();
    const cmd: Item[] = commands
      .map((c) => ({ c, score: fuzzyScore(`${c.title} ${c.keywords ?? ""}`, q) }))
      .filter((x) => x.score !== null)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .map(({ c }) => ({
        key: "cmd:" + c.id,
        icon: c.icon,
        title: c.title,
        subtitle: "",
        hint: "",
        run: () => {
          c.run();
          onClose();
        },
      }));
    const hits = workspace ? searchWorkspace(workspace, q) : [];
    const res: Item[] = hits.map((h: Hit) =>
      h.kind === "board"
        ? {
            key: "board:" + h.id,
            icon: "layout-grid",
            title: h.title,
            subtitle: t("palette.boardSuffix"),
            hint: t("palette.hint.jump"),
            run: () => {
              setActiveBoard(h.id);
              onClose();
            },
          }
        : {
            key: "card:" + h.id,
            icon: CARD_ICON[h.cardType] ?? "file-text",
            title: h.title,
            subtitle: h.boardName,
            hint: h.copyable ? t("palette.hint.copy") : t("palette.hint.jump"),
            run: (alt: boolean) => {
              if (h.copyable && !alt) void copyResolved(h.copyText, locale);
              else {
                setActiveBoard(h.boardId);
                flashCard(h.id);
              }
              onClose();
            },
          },
    );
    return { commandItems: cmd, resultItems: res };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, workspace, commands, locale]);

  const items = useMemo(() => [...commandItems, ...resultItems], [commandItems, resultItems]);

  useEffect(() => {
    setSel((s) => Math.min(s, Math.max(0, items.length - 1)));
  }, [items.length]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[sel]?.run(e.altKey);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let pos = -1;
  const renderItem = (it: Item) => {
    pos += 1;
    const i = pos;
    return (
      <li key={it.key}>
        <button
          type="button"
          className={`palette-item${i === sel ? " selected" : ""}`}
          onMouseEnter={() => setSel(i)}
          onClick={(e) => it.run(e.altKey)}
        >
          <Icon name={it.icon} size={16} />
          <span className="palette-item-title">{it.title}</span>
          {it.subtitle && <span className="palette-item-sub">{it.subtitle}</span>}
          {it.hint && <span className="palette-item-hint">{it.hint}</span>}
        </button>
      </li>
    );
  };

  return (
    <div
      className="palette-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="palette" role="dialog" aria-modal="true" aria-label={t("palette.placeholder")}>
        <div className="palette-search">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            placeholder={t("palette.placeholder")}
            onChange={(e) => {
              setQuery(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
        <ul className="palette-list">
          {items.length === 0 ? (
            <li className="palette-empty">{t("palette.empty")}</li>
          ) : (
            <>
              {commandItems.length > 0 && (
                <li className="palette-section">{t("palette.section.commands")}</li>
              )}
              {commandItems.map(renderItem)}
              {resultItems.length > 0 && (
                <li className="palette-section">{t("palette.section.results")}</li>
              )}
              {resultItems.map(renderItem)}
            </>
          )}
        </ul>
        <div className="palette-footer">
          <span>
            <Icon name="corner-down-left" size={11} /> {t("palette.hint.run")}
          </span>
          <span>Alt+⏎ {t("palette.hint.alt")}</span>
          <span>Esc {t("common.close")}</span>
        </div>
      </div>
    </div>
  );
}
