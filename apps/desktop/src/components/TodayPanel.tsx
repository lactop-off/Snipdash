import { useMemo } from "react";
import { type DueEntry, type Locale, collectDueItems } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";
import { Icon } from "./Icon";

/** Time-only when due today, else "M/D HH:mm". */
function formatDue(iso: string, locale: Locale): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tag = locale === "ja" ? "ja-JP" : "en-US";
  const time = d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === new Date().toDateString()) return time;
  return `${d.toLocaleDateString(tag, { month: "numeric", day: "numeric" })} ${time}`;
}

export function TodayPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const workspace = useStore((s) => s.workspace);
  const setActiveBoard = useStore((s) => s.setActiveBoard);
  const toggleTodoItem = useStore((s) => s.toggleTodoItem);
  const flashCard = useStore((s) => s.flashCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);

  const buckets = useMemo(
    () => (workspace ? collectDueItems(workspace, Date.now()) : { overdue: [], today: [], soon: [] }),
    [workspace],
  );

  if (!open) return null;
  const total = buckets.overdue.length + buckets.today.length + buckets.soon.length;

  const jump = (e: DueEntry) => {
    setActiveBoard(e.boardId);
    flashCard(e.cardId);
  };

  const renderSection = (label: string, entries: DueEntry[], kind: string) =>
    entries.length === 0 ? null : (
      <div className="today-section" key={kind}>
        <div className={`today-section-title ${kind}`}>
          {label}
          <span className="today-section-count">{entries.length}</span>
        </div>
        <ul className="today-list">
          {entries.map((e) => (
            <li key={e.cardId + e.item.id} className={`today-item ${kind}`}>
              <label className="todo-check">
                <input
                  type="checkbox"
                  checked={e.item.done}
                  onChange={() => toggleTodoItem(e.cardId, e.item.id)}
                />
              </label>
              <button type="button" className="today-item-main" onClick={() => jump(e)}>
                <span className="today-item-text">{e.item.text || "—"}</span>
                <span className="today-item-source">
                  {(e.cardLabel ? e.cardLabel + " · " : "") + e.boardName}
                </span>
              </button>
              {e.item.due && (
                <span className="today-due">
                  <Icon name="clock" size={12} /> {formatDue(e.item.due, locale)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <aside className="today-panel" role="complementary" aria-label={t("today.title")}>
      <header className="today-header">
        <span className="today-title">
          <Icon name="calendar-check" size={16} /> {t("today.title")}
        </span>
        <button
          type="button"
          className="card-action"
          aria-label={t("common.close")}
          title={t("common.close")}
          onClick={onClose}
        >
          <Icon name="x" size={16} />
        </button>
      </header>
      <div className="today-body">
        {total === 0 ? (
          <div className="today-empty">{t("today.empty")}</div>
        ) : (
          <>
            {renderSection(t("today.section.overdue"), buckets.overdue, "overdue")}
            {renderSection(t("today.section.today"), buckets.today, "today")}
            {renderSection(t("today.section.soon"), buckets.soon, "soon")}
          </>
        )}
      </div>
    </aside>
  );
}
