import type { Card } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { TextCard } from "./TextCard";
import { LauncherCard } from "./LauncherCard";
import { RichCard } from "./RichCard";

const COLORS = ["", "red", "orange", "green", "blue", "purple"] as const;

function CardBody({ card, edit }: { card: Card; edit: boolean }) {
  switch (card.type) {
    case "text":
      return <TextCard card={card} edit={edit} />;
    case "launcher":
      return <LauncherCard card={card} edit={edit} />;
    case "rich":
      return <RichCard card={card} edit={edit} />;
  }
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="color-picker">
      {COLORS.map((c) => (
        <button
          key={c || "none"}
          type="button"
          className={`swatch swatch-${c || "none"}${value === c ? " selected" : ""}`}
          title={c || "なし"}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}

export function CardFrame({ card, edit }: { card: Card; edit: boolean }) {
  const updateCard = useStore((s) => s.updateCard);
  const removeCard = useStore((s) => s.removeCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);

  const setLabel = (label: string) => updateCard({ ...card, label: label || undefined });
  const setColor = (colorTag: string) => updateCard({ ...card, colorTag: colorTag || undefined });

  return (
    <div className={`card${card.colorTag ? " tag-" + card.colorTag : ""}`}>
      <header className={`card-header${edit ? " card-drag-handle" : ""}`}>
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
