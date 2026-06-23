/**
 * Factory helpers for creating new domain objects in the UI. Centralizes id
 * generation and sensible defaults so the frontend store stays thin.
 */

import {
  type Board,
  type Card,
  type CardLayout,
  type RichCard,
  type RichMode,
  type Settings,
  type SpacerCard,
  type TextCard,
  type TodoItem,
  DEFAULT_GRID,
  DEFAULT_REMIND_BEFORE,
} from "./types";

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Default block sizes for newly added cards, in 12-column grid cells. These are
// the "predetermined sizes" a fresh card snaps to before the user resizes it.
const DEFAULT_LAYOUT: CardLayout = { x: 0, y: 0, w: 3, h: 3 };

export function createTextCard(layout: Partial<CardLayout> = {}): TextCard {
  return {
    id: newId(),
    type: "text",
    layout: { ...DEFAULT_LAYOUT, ...layout },
    payload: { body: "", copyFormat: "plain" },
  };
}

export function createTodoItem(text = ""): TodoItem {
  return { id: newId(), text, done: false };
}

type ReminderSettings = Pick<Settings, "defaultRemindBefore">;

/** Effective reminder lead time (minutes) for an item: its own override, else
 * the workspace default, else the built-in {@link DEFAULT_REMIND_BEFORE}. */
export function resolveRemindBefore(item: TodoItem, settings?: ReminderSettings): number {
  return item.remindBefore ?? settings?.defaultRemindBefore ?? DEFAULT_REMIND_BEFORE;
}

/** Epoch-ms instant at which an item's reminder should fire (due − lead time),
 * or `null` when the item has no usable due date. */
export function reminderInstant(item: TodoItem, settings?: ReminderSettings): number | null {
  if (!item.due) return null;
  const due = Date.parse(item.due);
  if (Number.isNaN(due)) return null;
  return due - resolveRemindBefore(item, settings) * 60_000;
}

export type DueUrgency = "overdue" | "soon" | "upcoming";

/** Classify how pressing an item's due date is relative to `now` (epoch ms).
 * `soon` means due within `soonWindowMs` (default 1h). Returns `null` when there
 * is no due date; callers are expected to skip done items themselves. */
export function dueUrgency(item: TodoItem, now: number, soonWindowMs = 3_600_000): DueUrgency | null {
  if (!item.due) return null;
  const due = Date.parse(item.due);
  if (Number.isNaN(due)) return null;
  if (due <= now) return "overdue";
  if (due - now <= soonWindowMs) return "soon";
  return "upcoming";
}

export function createRichCard(mode: RichMode = "markdown", layout: Partial<CardLayout> = {}): RichCard {
  const base = {
    id: newId(),
    type: "rich" as const,
    layout: { ...DEFAULT_LAYOUT, w: 4, h: 4, ...layout },
  };
  switch (mode) {
    case "markdown":
      return { ...base, payload: { mode: "markdown", source: "" } };
    case "code":
      return { ...base, payload: { mode: "code", language: "text", source: "" } };
    case "todo":
      return { ...base, payload: { mode: "todo", items: [createTodoItem()], hideCompleted: true } };
  }
}

/** A body-only spacer/heading card. Defaults to a wide, short banner; starts
 * empty (a pure layout spacer) until the user types a heading into it. */
export function createSpacerCard(layout: Partial<CardLayout> = {}): SpacerCard {
  return {
    id: newId(),
    type: "spacer",
    layout: { ...DEFAULT_LAYOUT, w: 4, h: 2, ...layout },
    payload: { text: "" },
  };
}

export function createBoard(name: string, order: number): Board {
  return {
    id: newId(),
    name,
    order,
    grid: { ...DEFAULT_GRID },
    cards: [],
  };
}

/** Whether a card's body/source participates in template-variable expansion. */
export function supportsTemplateVariables(card: Card): boolean {
  if (card.type === "text") return true;
  if (card.type === "rich") return card.payload.mode === "markdown" || card.payload.mode === "code";
  return false;
}

/** Extract the copyable raw text of a card (pre template-expansion), if any. */
export function copyableText(card: Card): string | null {
  switch (card.type) {
    case "text":
      return card.payload.body;
    case "rich":
      if (card.payload.mode === "markdown" || card.payload.mode === "code") {
        return card.payload.source;
      }
      return null;
    case "spacer":
      // A spacer/heading is decorative, not a snippet to copy.
      return null;
  }
}
