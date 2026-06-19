import type { RichCard, TodoItem } from "@snipdash/sdk";
import { createTodoItem } from "@snipdash/sdk";
import { useStore } from "../store";
import { translator } from "../i18n";

export function TodoView({ card, items, edit }: { card: RichCard; items: TodoItem[]; edit: boolean }) {
  const updateCard = useStore((s) => s.updateCard);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);

  const setItems = (next: TodoItem[]) =>
    updateCard({ ...card, payload: { mode: "todo", items: next } });

  // Toggling a checkbox is allowed in both modes (state persists immediately).
  const toggle = (id: string) =>
    setItems(items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  const setText = (id: string, text: string) =>
    setItems(items.map((it) => (it.id === id ? { ...it, text } : it)));
  const remove = (id: string) => setItems(items.filter((it) => it.id !== id));
  const add = () => setItems([...items, createTodoItem()]);

  return (
    <div className="card-content todo-card">
      <ul className="todo-list">
        {items.map((it) => (
          <li key={it.id} className={it.done ? "todo-item done" : "todo-item"}>
            <label className="rgl-cancel todo-check">
              <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} />
            </label>
            {edit ? (
              <input
                className="rgl-cancel todo-text-input"
                value={it.text}
                onChange={(e) => setText(it.id, e.target.value)}
              />
            ) : (
              <span className="todo-text">{it.text}</span>
            )}
            {edit && (
              <button type="button" className="rgl-cancel btn-ghost btn-small" onClick={() => remove(it.id)}>
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
      {edit && (
        <button type="button" className="rgl-cancel btn-ghost btn-small" onClick={add}>
          ＋ {t("todo.addItem")}
        </button>
      )}
    </div>
  );
}
