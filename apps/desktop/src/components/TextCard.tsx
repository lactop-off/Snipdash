import { useRef } from "react";
import type { TextCard as TextCardType } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { copyResolved } from "../actions";
import { VariableHelper } from "./VariableHelper";
import { insertAtCursor } from "./insertAtCursor";

export function TextCard({ card, edit }: { card: TextCardType; edit: boolean }) {
  const updateCard = useStore((s) => s.updateCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);
  const ref = useRef<HTMLTextAreaElement>(null);

  const setBody = (body: string) =>
    updateCard({ ...card, payload: { ...card.payload, body } });

  if (edit) {
    return (
      <div className="card-content text-card">
        <textarea
          ref={ref}
          className="rgl-cancel text-editor"
          value={card.payload.body}
          spellCheck={false}
          onChange={(e) => setBody(e.target.value)}
          placeholder="本文を入力… {{TODAY}} などの変数が使えます"
        />
        <div className="card-toolbar">
          <VariableHelper t={t} onInsert={(token) => setBody(insertAtCursor(ref, card.payload.body, token))} />
        </div>
      </div>
    );
  }

  const empty = card.payload.body.trim().length === 0;
  return (
    <div className="card-content text-card">
      <pre className="text-body">
        {empty ? <span className="muted">{t("card.emptyBody")}</span> : card.payload.body}
      </pre>
      <div className="card-toolbar">
        <button
          type="button"
          className="rgl-cancel btn-primary"
          disabled={empty}
          onClick={() => copyResolved(card.payload.body, locale)}
        >
          {t("card.copy")}
        </button>
      </div>
    </div>
  );
}
