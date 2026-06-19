import type { LauncherCard as LauncherCardType, LauncherKind } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { openLauncher } from "../actions";

const KINDS: LauncherKind[] = ["url", "file", "folder"];

/** Best-effort display name when no label is set: host for URLs, tail otherwise. */
function previewName(kind: LauncherKind, target: string): string {
  const trimmed = target.trim();
  if (!trimmed) return "—";
  if (kind === "url") {
    try {
      return new URL(trimmed).host || trimmed;
    } catch {
      return trimmed;
    }
  }
  const parts = trimmed.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] ?? trimmed;
}

export function LauncherCard({ card, edit }: { card: LauncherCardType; edit: boolean }) {
  const updateCard = useStore((s) => s.updateCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);

  const setKind = (kind: LauncherKind) =>
    updateCard({ ...card, payload: { ...card.payload, kind } });
  const setTarget = (target: string) =>
    updateCard({ ...card, payload: { ...card.payload, target } });

  if (edit) {
    return (
      <div className="card-content launcher-card">
        <label className="field">
          <span className="field-label">{t("card.add")}</span>
          <select
            className="rgl-cancel"
            value={card.payload.kind}
            onChange={(e) => setKind(e.target.value as LauncherKind)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {t(`launcher.kind.${k}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">{t("launcher.target")}</span>
          <input
            className="rgl-cancel"
            type="text"
            value={card.payload.target}
            placeholder={card.payload.kind === "url" ? "https://…" : "~/path/to/…"}
            onChange={(e) => setTarget(e.target.value)}
          />
        </label>
      </div>
    );
  }

  const empty = card.payload.target.trim().length === 0;
  return (
    <div className="card-content launcher-card">
      <div className="launcher-info">
        <span className={`badge badge-${card.payload.kind}`}>{t(`launcher.kind.${card.payload.kind}`)}</span>
        <span className="launcher-name" title={card.payload.target}>
          {card.label ?? previewName(card.payload.kind, card.payload.target)}
        </span>
      </div>
      <div className="card-toolbar">
        <button
          type="button"
          className="rgl-cancel btn-primary"
          disabled={empty}
          onClick={() => openLauncher(card.payload.kind, card.payload.target, locale)}
        >
          {t("card.open")}
        </button>
      </div>
    </div>
  );
}
