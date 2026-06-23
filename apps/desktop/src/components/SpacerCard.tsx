import type { SpacerCard as SpacerCardType } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { Icon } from "./Icon";

/**
 * Body-only card with no title chrome. Empty text is an invisible layout spacer;
 * non-empty text renders as a centered heading/caption. In edit mode it gains a
 * dashed outline plus a corner grip (the drag handle) and a delete button so it
 * stays movable/removable without a header.
 */
export function SpacerCard({ card, edit }: { card: SpacerCardType; edit: boolean }) {
  const updateCard = useStore((s) => s.updateCard);
  const removeCard = useStore((s) => s.removeCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);

  const text = card.payload.text;
  const setText = (next: string) => updateCard({ ...card, payload: { text: next } });

  if (!edit) {
    // Use mode: empty → nothing (pure spacer); filled → centered heading.
    return (
      <div className="spacer-card">
        {text.trim() !== "" && <div className="spacer-text">{text}</div>}
      </div>
    );
  }

  return (
    <div className={`spacer-card editing${text.trim() !== "" ? " filled" : ""}`}>
      <span className="card-drag-handle spacer-grip" title={t("card.drag")}>
        <Icon name="grip-vertical" size={14} />
      </span>
      <button
        type="button"
        className="rgl-cancel spacer-delete"
        title={t("card.delete")}
        aria-label={t("card.delete")}
        onClick={() => removeCard(card.id)}
      >
        <Icon name="x" size={14} />
      </button>
      <textarea
        className="rgl-cancel spacer-input"
        value={text}
        placeholder={t("spacer.placeholder")}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
