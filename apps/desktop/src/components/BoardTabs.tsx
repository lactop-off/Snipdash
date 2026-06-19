import { useState } from "react";
import { useStore } from "../store";
import { translator } from "../i18n";

export function BoardTabs({ edit }: { edit: boolean }) {
  const boards = useStore((s) => s.workspace?.boards ?? []);
  const activeId = useStore((s) => s.workspace?.settings.activeBoardId);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);
  const setActiveBoard = useStore((s) => s.setActiveBoard);
  const addBoard = useStore((s) => s.addBoard);
  const renameBoard = useStore((s) => s.renameBoard);
  const deleteBoard = useStore((s) => s.deleteBoard);
  const reorderBoards = useStore((s) => s.reorderBoards);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const ordered = [...boards].sort((a, b) => a.order - b.order);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const ids = ordered.map((b) => b.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    const [moved] = ids.splice(from, 1);
    if (moved) ids.splice(to, 0, moved);
    reorderBoards(ids);
    setDragId(null);
  };

  return (
    <div className="board-tabs">
      {ordered.map((b) => (
        <div
          key={b.id}
          className={`tab${b.id === activeId ? " active" : ""}`}
          draggable={edit && editingId !== b.id}
          onDragStart={() => setDragId(b.id)}
          onDragOver={(e) => edit && e.preventDefault()}
          onDrop={() => handleDrop(b.id)}
          onClick={() => setActiveBoard(b.id)}
          onDoubleClick={() => edit && setEditingId(b.id)}
        >
          {editingId === b.id ? (
            <input
              autoFocus
              className="tab-input"
              value={b.name}
              onChange={(e) => renameBoard(b.id, e.target.value)}
              onBlur={() => setEditingId(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setEditingId(null);
              }}
            />
          ) : (
            <span className="tab-name">{b.name}</span>
          )}
          {edit && editingId !== b.id && (
            <button
              type="button"
              className="tab-close"
              title={t("board.delete")}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(t("board.deleteConfirm"))) deleteBoard(b.id);
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button type="button" className="tab-add" title={t("board.add")} onClick={() => addBoard()}>
        ＋
      </button>
    </div>
  );
}
