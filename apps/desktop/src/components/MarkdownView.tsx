import { useMemo, useRef } from "react";
import MarkdownIt from "markdown-it";
import type { RichCard } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { copyResolved } from "../actions";
import { VariableHelper } from "./VariableHelper";
import { insertAtCursor } from "./insertAtCursor";

// html:false keeps raw HTML out, so rendering via innerHTML is safe.
const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

export function MarkdownView({ card, source, edit }: { card: RichCard; source: string; edit: boolean }) {
  const updateCard = useStore((s) => s.updateCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);
  const ref = useRef<HTMLTextAreaElement>(null);
  const html = useMemo(() => md.render(source), [source]);

  const setSource = (next: string) =>
    updateCard({ ...card, payload: { mode: "markdown", source: next } });

  if (edit) {
    return (
      <div className="card-content markdown-card">
        <textarea
          ref={ref}
          className="rgl-cancel text-editor"
          value={source}
          spellCheck={false}
          onChange={(e) => setSource(e.target.value)}
          placeholder="# Markdown…"
        />
        <div className="card-toolbar">
          <VariableHelper t={t} onInsert={(token) => setSource(insertAtCursor(ref, source, token))} />
        </div>
      </div>
    );
  }

  const empty = source.trim().length === 0;
  return (
    <div className="card-content markdown-card">
      <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="card-toolbar">
        <button
          type="button"
          className="rgl-cancel btn-primary"
          disabled={empty}
          onClick={() => copyResolved(source, locale)}
        >
          {t("card.copy")}
        </button>
      </div>
    </div>
  );
}
