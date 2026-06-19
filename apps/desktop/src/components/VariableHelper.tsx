import { useState } from "react";
import { TEMPLATE_VARIABLES } from "@snipdash/sdk";
import type { T } from "../i18n";

/** Editor helper (FR-20): a dropdown that inserts a template token. */
export function VariableHelper({ onInsert, t }: { onInsert: (token: string) => void; t: T }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="var-helper">
      <button
        type="button"
        className="rgl-cancel btn-ghost btn-small"
        onClick={() => setOpen((o) => !o)}
        title={t("variables.insert")}
      >
        {"{ }"} {t("variables.insert")}
      </button>
      {open && (
        <ul className="var-menu rgl-cancel">
          {TEMPLATE_VARIABLES.map((v) => (
            <li key={v.token}>
              <button
                type="button"
                className="rgl-cancel var-item"
                onClick={() => {
                  onInsert(v.token);
                  setOpen(false);
                }}
              >
                <code>{v.token}</code>
                <span className="muted">{v.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
