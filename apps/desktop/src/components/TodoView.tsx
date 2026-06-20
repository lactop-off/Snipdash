import { useState } from "react";
import type { Locale, RichCard, TodoItem } from "@snipdash/sdk";
import { createTodoItem, dueUrgency, resolveRemindBefore, REMIND_BEFORE_PRESETS } from "@snipdash/sdk";
import { useStore } from "../store";
import { remindLabel, translator } from "../i18n";
import { Icon } from "./Icon";

/** Stored ISO (UTC) → the local `YYYY-MM-DDThh:mm` a datetime-local input wants. */
function toDatetimeLocal(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Local datetime-local value → stored ISO (UTC), or undefined when cleared. */
function fromDatetimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Compact due label: time-only when due today, else "M/D HH:mm". */
function formatDueShort(iso: string, now: number, locale: Locale): string {
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return "";
  const tag = locale === "ja" ? "ja-JP" : "en-US";
  const time = due.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
  if (new Date(now).toDateString() === due.toDateString()) return time;
  const date = due.toLocaleDateString(tag, { month: "numeric", day: "numeric" });
  return `${date} ${time}`;
}

export function TodoView({
  card,
  items,
  hideCompleted,
  edit,
}: {
  card: RichCard;
  items: TodoItem[];
  hideCompleted: boolean;
  edit: boolean;
}) {
  const updateCard = useStore((s) => s.updateCard);
  const settings = useStore((s) => s.workspace?.settings);
  const locale = settings?.locale ?? "ja";
  const t = translator(locale);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const setItems = (next: TodoItem[]) =>
    updateCard({ ...card, payload: { mode: "todo", items: next, hideCompleted } });

  // Toggling a checkbox is allowed in both modes (state persists immediately).
  const toggle = (id: string) =>
    setItems(items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  const patch = (id: string, fields: Partial<TodoItem>) =>
    setItems(items.map((it) => (it.id === id ? { ...it, ...fields } : it)));
  const remove = (id: string) => setItems(items.filter((it) => it.id !== id));
  const add = () => setItems([...items, createTodoItem()]);

  // Editing the due date or lead time re-arms the item (clears `notifiedAt`).
  const setDue = (id: string, value: string) =>
    patch(id, { due: fromDatetimeLocal(value), notifiedAt: undefined });
  const setRemind = (id: string, minutes: number) =>
    patch(id, { remindBefore: minutes, notifiedAt: undefined });
  const clearDue = (id: string) =>
    patch(id, { due: undefined, remindBefore: undefined, notifiedAt: undefined });

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const now = Date.now();
  const shown = hideCompleted ? items.filter((it) => !it.done) : items;

  return (
    <div className="card-content todo-card">
      <ul className="todo-list">
        {shown.map((it) => {
          const urgency = it.due && !it.done ? dueUrgency(it, now) : null;
          const dueText = it.due
            ? urgency === "overdue"
              ? t("todo.overdue")
              : formatDueShort(it.due, now, locale)
            : null;
          return (
            <li key={it.id} className={it.done ? "todo-item done" : "todo-item"}>
              <label className="rgl-cancel todo-check">
                <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} />
              </label>
              <div className="todo-body">
                <div className="todo-row">
                  {edit ? (
                    <input
                      className="rgl-cancel todo-text-input"
                      value={it.text}
                      onChange={(e) => patch(it.id, { text: e.target.value })}
                    />
                  ) : (
                    <span className="todo-text">{it.text}</span>
                  )}
                  {!edit && it.due && (
                    <span className="todo-due-pill" data-urgency={urgency ?? ""}>
                      <Icon name="clock" size={12} /> {dueText}
                    </span>
                  )}
                  {edit && (
                    <button
                      type="button"
                      className={`rgl-cancel todo-due-pill${it.due ? " set" : ""}`}
                      data-urgency={urgency ?? ""}
                      title={t("todo.dueSet")}
                      onClick={() => toggleExpanded(it.id)}
                    >
                      <Icon name="clock" size={12} /> {it.due ? dueText : t("todo.due")}
                    </button>
                  )}
                  {edit && (
                    <button
                      type="button"
                      className="rgl-cancel btn-ghost btn-small"
                      aria-label="削除"
                      onClick={() => remove(it.id)}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  )}
                </div>
                {edit && expanded.has(it.id) && (
                  <div className="rgl-cancel todo-due-editor">
                    <input
                      type="datetime-local"
                      className="todo-due-input"
                      value={toDatetimeLocal(it.due)}
                      onChange={(e) => setDue(it.id, e.target.value)}
                    />
                    <label className="todo-remind" title={t("todo.remindBefore")}>
                      <Icon name="bell" size={12} />
                      <select
                        value={resolveRemindBefore(it, settings)}
                        onChange={(e) => setRemind(it.id, Number(e.target.value))}
                      >
                        {REMIND_BEFORE_PRESETS.map((m) => (
                          <option key={m} value={m}>
                            {remindLabel(m, t)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {it.due && (
                      <button
                        type="button"
                        className="btn-ghost btn-small"
                        onClick={() => clearDue(it.id)}
                      >
                        {t("todo.dueClear")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {edit && (
        <button type="button" className="rgl-cancel btn-ghost btn-small btn-icon" onClick={add}>
          <Icon name="plus" size={14} /> {t("todo.addItem")}
        </button>
      )}
    </div>
  );
}
