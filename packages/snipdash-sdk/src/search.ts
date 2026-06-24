/**
 * Lightweight fuzzy search across the workspace for the command palette.
 * Pure and IO-free; no external dependencies.
 */
import type { Card, Workspace } from "./types";
import { copyableText } from "./factory";

export type Hit =
  | {
      kind: "card";
      id: string;
      boardId: string;
      boardName: string;
      cardType: "text" | "markdown" | "code" | "todo" | "spacer" | "table";
      title: string;
      copyable: boolean;
      copyText: string;
      score: number;
    }
  | { kind: "board"; id: string; boardName: string; title: string; score: number };

/**
 * Case-insensitive match score. A substring match (earlier position scores
 * higher) beats a loose subsequence match (with a contiguous-run bonus).
 * Returns `null` when there is no match; an empty query scores 0 (matches all).
 */
export function fuzzyScore(text: string, query: string): number | null {
  if (!query) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = t.indexOf(q);
  if (idx >= 0) return 1000 - Math.min(idx, 900);
  let ti = 0;
  let score = 0;
  let prev = -2;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return null;
    score += found === prev + 1 ? 3 : 1;
    prev = found;
    ti = found + 1;
  }
  return score;
}

function cardType(card: Card): "text" | "markdown" | "code" | "todo" | "spacer" | "table" {
  if (card.type === "text") return "text";
  if (card.type === "spacer") return "spacer";
  if (card.type === "table") return "table";
  return card.payload.mode;
}

function cardBody(card: Card): string {
  if (card.type === "text") return card.payload.body;
  if (card.type === "spacer") return card.payload.text;
  if (card.type === "table") {
    return [card.payload.headers, ...card.payload.rows].map((r) => r.join("\t")).join("\n");
  }
  switch (card.payload.mode) {
    case "markdown":
    case "code":
      return card.payload.source;
    case "todo":
      return card.payload.items.map((i) => i.text).join("\n");
  }
}

function cardTitle(card: Card): string {
  if (card.label && card.label.trim()) return card.label.trim();
  const body = cardBody(card).trim();
  if (body) return body.split("\n")[0]!.slice(0, 60);
  return cardType(card);
}

/** Rank cards (by label + body) and boards (by name) against `query`. */
export function searchWorkspace(ws: Workspace, query: string, limit = 50): Hit[] {
  const q = query.trim();
  const hits: Hit[] = [];
  for (const board of ws.boards) {
    const bScore = fuzzyScore(board.name, q);
    if (bScore !== null) {
      hits.push({ kind: "board", id: board.id, boardName: board.name, title: board.name, score: bScore });
    }
    for (const card of board.cards) {
      const cScore = fuzzyScore(`${card.label ?? ""}\n${cardBody(card)}`, q);
      if (cScore === null) continue;
      const copy = copyableText(card) ?? "";
      hits.push({
        kind: "card",
        id: card.id,
        boardId: board.id,
        boardName: board.name,
        cardType: cardType(card),
        title: cardTitle(card),
        copyable: copy.trim().length > 0,
        copyText: copy,
        score: cScore,
      });
    }
  }
  if (q) hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
