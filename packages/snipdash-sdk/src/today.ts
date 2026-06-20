/**
 * Cross-board aggregation for the "Today" view: collect not-done todo items
 * that have a due date and are due now-ish, classified into overdue / soon /
 * today. Pure and IO-free.
 */
import type { TodoItem, Workspace } from "./types";

export type DueBucket = "overdue" | "today" | "soon";

export interface DueEntry {
  item: TodoItem;
  cardId: string;
  cardLabel?: string;
  boardId: string;
  boardName: string;
  bucket: DueBucket;
}

export interface DueBuckets {
  overdue: DueEntry[];
  today: DueEntry[];
  soon: DueEntry[];
}

/** Local end-of-day (23:59:59.999) for the day containing `now`. */
function endOfToday(now: number): number {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Walk every board's todo cards and bucket each not-done, due-dated item:
 * - `overdue`: due at or before now
 * - `soon`: due within `soonWindowMs` (default 1h)
 * - `today`: due later today (≤ local 23:59)
 * Items due tomorrow+, done items, and items without a due date are excluded.
 * Each bucket is sorted by due ascending.
 */
export function collectDueItems(ws: Workspace, now: number, soonWindowMs = 3_600_000): DueBuckets {
  const out: DueBuckets = { overdue: [], today: [], soon: [] };
  const todayEnd = endOfToday(now);
  for (const board of ws.boards) {
    for (const card of board.cards) {
      if (card.type !== "rich" || card.payload.mode !== "todo") continue;
      for (const item of card.payload.items) {
        if (item.done || !item.due) continue;
        const t = Date.parse(item.due);
        if (Number.isNaN(t)) continue;
        let bucket: DueBucket;
        if (t <= now) bucket = "overdue";
        else if (t - now <= soonWindowMs) bucket = "soon";
        else if (t <= todayEnd) bucket = "today";
        else continue;
        out[bucket].push({
          item,
          cardId: card.id,
          cardLabel: card.label,
          boardId: board.id,
          boardName: board.name,
          bucket,
        });
      }
    }
  }
  const byDue = (a: DueEntry, b: DueEntry) => Date.parse(a.item.due!) - Date.parse(b.item.due!);
  out.overdue.sort(byDue);
  out.today.sort(byDue);
  out.soon.sort(byDue);
  return out;
}

/** Total due items across all buckets (for the toolbar badge). */
export function dueCount(b: DueBuckets): number {
  return b.overdue.length + b.today.length + b.soon.length;
}
