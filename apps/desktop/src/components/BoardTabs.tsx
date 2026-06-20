import { useState, type CSSProperties } from "react";
import { useStore } from "../store";
import { translator } from "../i18n";
import { ColorPicker, colorValue } from "./ColorPicker";

export function BoardTabs({ edit }: { edit: boolean }) {
  const boards = useStore((s) => s.workspace?.boards ?? []);
  const activeId = useStore((s) => s.workspace?.settings.activeBoardId);
  const locale = useStore((s) => s.workspace?.settings.locale ?? "ja");
  const t = translator(locale);
  const setActiveBoard = useStore((s) => s.setActiveBoard);
  const addBoard = useStore((s) => s.addBoard);
  const renameBoard = useStore((s) => s.renameBoard);
  const setBoardColor = useStore((s) => s.setBoardColor);
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
      {ordered.map((b) => {
        const editing = editingId === b.id;
        return (
          <div
            key={b.id}
            className={`tab${b.id === activeId ? " active" : ""}`}
            style={
              colorValue(b.colorTag)
                ? ({ "--tab-accent": colorValue(b.colorTag) } as CSSProperties)
                : undefined
            }
            draggable={edit && !editing}
            onDragStart={() => setDragId(b.id)}
            onDragOver={(e) => edit && e.preventDefault()}
            onDrop={() => handleDrop(b.id)}
            onClick={() => setActiveBoard(b.id)}
            onDoubleClick={() => edit && setEditingId(b.id)}
          >
            {editing ? (
              <div className="tab-edit rgl-cancel" onClick={(e) => e.stopPropagation()}>
                <input
                  autoFocus
                  className="tab-input"
                  value={b.name}
                  onChange={(e) => renameBoard(b.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape") setEditingId(null);
                  }}
                />
                <div className="tab-edit-popover">
                  <ColorPicker
                    value={b.colorTag ?? ""}
                    onChange={(c) => setBoardColor(b.id, c)}
                    keepFocus
                    allowCustom={false}
                  />
                </div>
              </div>
            ) : (
              <span className="tab-name">{b.name}</span>
            )}
            {edit && !editing && (
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
        );
      })}
      <button type="button" className="tab-add" title={t("board.add")} onClick={() => addBoard()}>
        ＋
      </button>
    </div>
  );
}
