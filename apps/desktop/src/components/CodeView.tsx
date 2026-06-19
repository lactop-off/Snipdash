import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import type { RichCard } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { copyResolved } from "../actions";
import { LANGUAGE_PRESETS, languageExtension } from "./languages";

export function CodeView({
  card,
  language,
  source,
  edit,
}: {
  card: RichCard;
  language: string;
  source: string;
  edit: boolean;
}) {
  const updateCard = useStore((s) => s.updateCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);

  const extensions = useMemo(
    () => [...languageExtension(language), EditorView.lineWrapping],
    [language],
  );

  const setSource = (next: string) =>
    updateCard({ ...card, payload: { mode: "code", language, source: next } });
  const setLanguage = (next: string) =>
    updateCard({ ...card, payload: { mode: "code", language: next, source } });

  return (
    <div className="card-content code-card">
      {edit && (
        <label className="field field-inline rgl-cancel">
          <span className="field-label">{t("code.language")}</span>
          <input
            className="rgl-cancel"
            list="snipdash-languages"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
          <datalist id="snipdash-languages">
            {LANGUAGE_PRESETS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </label>
      )}
      <div className="rgl-cancel code-editor">
        <CodeMirror
          value={source}
          editable={edit}
          readOnly={!edit}
          extensions={extensions}
          basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: edit }}
          onChange={(value) => edit && setSource(value)}
        />
      </div>
      <div className="card-toolbar">
        <button
          type="button"
          className="rgl-cancel btn-primary"
          disabled={source.trim().length === 0}
          onClick={() => copyResolved(source, locale)}
        >
          {t("card.copy")}
        </button>
      </div>
    </div>
  );
}
