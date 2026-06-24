import type { CSSProperties } from "react";
import { type Card, copyableText, dueUrgency } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { copyResolved } from "../actions";
import { ColorPicker, colorValue } from "./ColorPicker";
import { Icon } from "./Icon";
import { TextCard } from "./TextCard";
import { RichCard } from "./RichCard";
import { TableCard } from "./TableCard";

function CardBody({ card, edit }: { card: Card; edit: boolean }) {
  switch (card.type) {
    case "text":
      return <TextCard card={card} edit={edit} />;
    case "rich":
      return <RichCard card={card} edit={edit} />;
    case "table":
      return <TableCard card={card} edit={edit} />;
    case "spacer":
      // Spacer cards are rendered outside CardFrame (see GridCanvas); this arm
      // only keeps the switch exhaustive.
      return null;
  }
}

export function CardFrame({ card, edit }: { card: Card; edit: boolean }) {
  const updateCard = useStore((s) => s.updateCard);
  const removeCard = useStore((s) => s.removeCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);

  const setLabel = (label: string) => updateCard({ ...card, label: label || undefined });
  const setColor = (colorTag: string) => updateCard({ ...card, colorTag: colorTag || undefined });

  const accent = colorValue(card.colorTag);

  // Todo-only header control: show/hide completed items (works in use mode too).
  const todoPayload = card.type === "rich" && card.payload.mode === "todo" ? card.payload : null;
  const doneCount = todoPayload ? todoPayload.items.filter((it) => it.done).length : 0;
  // Reminder badge: count of active (not done) items that are overdue / due soon.
  const dueAlert = (() => {
    if (!todoPayload) return null;
    const now = Date.now();
    let overdue = 0;
    let soon = 0;
    for (const it of todoPayload.items) {
      if (it.done) continue;
      const u = dueUrgency(it, now);
      if (u === "overdue") overdue++;
      else if (u === "soon") soon++;
    }
    const count = overdue + soon;
    return count > 0 ? { count, urgency: overdue > 0 ? "overdue" : "soon" } : null;
  })();
  // Default to hiding completed items when the flag has never been set.
  const todoHideDone = todoPayload ? todoPayload.hideCompleted ?? true : false;
  const toggleHideDone = () => {
    if (card.type === "rich" && card.payload.mode === "todo") {
      const current = card.payload.hideCompleted ?? true;
      updateCard({ ...card, payload: { ...card.payload, hideCompleted: !current } });
    }
  };

  // Copy action lives in the header (use mode), next to where the todo toggle is.
  const copyText = copyableText(card) ?? "";
  const canCopy = !edit && copyText.trim().length > 0;

  return (
    <div
      className={`card${accent ? " has-color" : ""}`}
      style={accent ? ({ "--card-accent": accent } as CSSProperties) : undefined}
    >
      <header className={`card-header${edit ? " card-drag-handle" : ""}`}>
        {edit && (
          <span className="card-grip card-drag-handle" title={t("card.drag")}>
            <Icon name="grip-vertical" size={16} />
          </span>
        )}
        {edit ? (
          <input
            className="rgl-cancel card-label-input"
            value={card.label ?? ""}
            placeholder={t("card.label")}
            onChange={(e) => setLabel(e.target.value)}
          />
        ) : (
          <span className="card-label">{card.label ?? " "}</span>
        )}
        {dueAlert && (
          <span className="card-due-badge" data-urgency={dueAlert.urgency} title={t("todo.due")}>
            <Icon name="bell" size={13} /> {dueAlert.count}
          </span>
        )}
        {todoPayload && (
          <button
            type="button"
            className="rgl-cancel card-action"
            title={todoHideDone ? t("todo.showDone") : t("todo.hideDone")}
            aria-label={todoHideDone ? t("todo.showDone") : t("todo.hideDone")}
            onClick={toggleHideDone}
          >
            <Icon name={todoHideDone ? "eye" : "eye-off"} size={15} />
            {doneCount > 0 && <span className="card-action-count">{doneCount}</span>}
          </button>
        )}
        {canCopy && (
          <button
            type="button"
            className="rgl-cancel card-action is-copy"
            title={t("card.copy")}
            onClick={() => void copyResolved(copyText, locale)}
          >
            <Icon name="copy" size={15} />
            <span className="card-action-label">{t("card.copy")}</span>
          </button>
        )}
        {edit && (
          <div className="card-header-actions rgl-cancel">
            <ColorPicker value={card.colorTag ?? ""} onChange={setColor} />
            <button
              type="button"
              className="btn-ghost btn-small"
              title={t("card.delete")}
              aria-label={t("card.delete")}
              onClick={() => removeCard(card.id)}
            >
              <Icon name="trash-2" size={15} />
            </button>
          </div>
        )}
      </header>
      <CardBody card={card} edit={edit} />
    </div>
  );
}
