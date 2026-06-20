import type { TextCard as TextCardType } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { copyResolved } from "../actions";
import { TemplateEditor } from "./TemplateEditor";

export function TextCard({ card, edit }: { card: TextCardType; edit: boolean }) {
  const updateCard = useStore((s) => s.updateCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);

  const setBody = (body: string) =>
    updateCard({ ...card, payload: { ...card.payload, body } });

  if (edit) {
    return (
      <div className="card-content text-card">
        <TemplateEditor
          value={card.payload.body}
          onChange={setBody}
          placeholder="本文を入力… {{TODAY}} などの変数が使えます"
        />
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
