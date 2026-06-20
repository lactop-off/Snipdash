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
  type TextCard,
  type TodoItem,
  DEFAULT_GRID,
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
      return { ...base, payload: { mode: "todo", items: [createTodoItem()] } };
  }
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
  }
}
