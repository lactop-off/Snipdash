import type { CSSProperties } from "react";
import type { Card } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { ColorPicker, colorValue } from "./ColorPicker";
import { TextCard } from "./TextCard";
import { RichCard } from "./RichCard";

function CardBody({ card, edit }: { card: Card; edit: boolean }) {
  switch (card.type) {
    case "text":
      return <TextCard card={card} edit={edit} />;
    case "rich":
      return <RichCard card={card} edit={edit} />;
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
  const toggleHideDone = () => {
    if (card.type === "rich" && card.payload.mode === "todo") {
      updateCard({
        ...card,
        payload: { ...card.payload, hideCompleted: !card.payload.hideCompleted },
      });
    }
  };

  return (
    <div
      className={`card${accent ? " has-color" : ""}`}
      style={accent ? ({ "--card-accent": accent } as CSSProperties) : undefined}
    >
      <header className={`card-header${edit ? " card-drag-handle" : ""}`}>
        {edit && (
          <span className="card-grip card-drag-handle" title={t("card.drag")} aria-hidden="true">
            ⠿
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
        {todoPayload && (
          <button
            type="button"
            className="rgl-cancel todo-toggle"
            title={todoPayload.hideCompleted ? t("todo.showDone") : t("todo.hideDone")}
            onClick={toggleHideDone}
          >
            {todoPayload.hideCompleted ? "○" : "●"}{" "}
            {todoPayload.hideCompleted ? t("todo.showDone") : t("todo.hideDone")}
            {doneCount > 0 && <span className="todo-count">{doneCount}</span>}
          </button>
        )}
        {edit && (
          <div className="card-header-actions rgl-cancel">
            <ColorPicker value={card.colorTag ?? ""} onChange={setColor} />
            <button
              type="button"
              className="btn-ghost btn-small"
              title={t("card.delete")}
              onClick={() => removeCard(card.id)}
            >
              🗑
            </button>
          </div>
        )}
      </header>
      <CardBody card={card} edit={edit} />
    </div>
  );
}
