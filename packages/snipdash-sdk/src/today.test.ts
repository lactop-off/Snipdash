import { describe, expect, it } from "vitest";
import type { TodoItem, Workspace } from "./types";
import { collectDueItems, dueCount } from "./today";

// Fixed local midday so end-of-today is well clear of the offsets below.
const NOW = new Date(2026, 5, 20, 9, 0, 0).getTime();
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

function todoCard(id: string, label: string, items: TodoItem[]) {
  return {
    id,
    type: "rich" as const,
    layout: { x: 0, y: 0, w: 4, h: 4 },
    label,
    payload: { mode: "todo" as const, items },
  };
}

function ws(boards: Workspace["boards"]): Workspace {
  return {
    schemaVersion: 2,
    settings: { theme: "system", alwaysOnTop: false, activeBoardId: boards[0]?.id ?? "", locale: "ja" },
    boards,
  };
}

const grid = { cols: 12, rowHeight: 40, gap: 8 };

describe("collectDueItems", () => {
  it("buckets overdue / soon / today and excludes future, done, and undated", () => {
    const items: TodoItem[] = [
      { id: "overdue", text: "過去", done: false, due: iso(-60 * 60_000) },
      { id: "soon", text: "30分後", done: false, due: iso(30 * 60_000) },
      { id: "today", text: "5時間後", done: false, due: iso(5 * 60 * 60_000) },
      { id: "tomorrow", text: "明日", done: false, due: iso(30 * 60 * 60_000) },
      { id: "done", text: "完了", done: true, due: iso(-2 * 60 * 60_000) },
      { id: "nodue", text: "期限なし", done: false },
    ];
    const w = ws([{ id: "b1", name: "営業", order: 0, grid, cards: [todoCard("c1", "TODO", items)] }]);
    const r = collectDueItems(w, NOW);

    expect(r.overdue.map((e) => e.item.id)).toEqual(["overdue"]);
    expect(r.soon.map((e) => e.item.id)).toEqual(["soon"]);
    expect(r.today.map((e) => e.item.id)).toEqual(["today"]);
    expect(dueCount(r)).toBe(3);
    // carries source board/card
    expect(r.overdue[0]!.boardName).toBe("営業");
    expect(r.overdue[0]!.cardLabel).toBe("TODO");
  });

  it("aggregates across boards and sorts each bucket by due ascending", () => {
    const w = ws([
      {
        id: "b1",
        name: "A",
        order: 0,
        grid,
        cards: [
          todoCard("c1", "t1", [{ id: "late", text: "late", done: false, due: iso(-10 * 60_000) }]),
        ],
      },
      {
        id: "b2",
        name: "B",
        order: 1,
        grid,
        cards: [
          todoCard("c2", "t2", [{ id: "older", text: "older", done: false, due: iso(-90 * 60_000) }]),
        ],
      },
    ]);
    const r = collectDueItems(w, NOW);
    expect(r.overdue.map((e) => e.item.id)).toEqual(["older", "late"]); // earlier due first
    expect(r.overdue.map((e) => e.boardName)).toEqual(["B", "A"]);
  });
});
