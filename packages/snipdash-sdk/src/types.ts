/**
 * Domain types for Snipdash, kept in lockstep with the Rust `snipdash-core`
 * crate. The shapes here are the canonical on-disk / IPC format.
 */

export const CURRENT_SCHEMA_VERSION = 2 as const;

export type Theme = "light" | "dark" | "system";
export type Locale = "ja" | "en";
export type CopyFormat = "plain" | "rich";
export type LauncherKind = "url" | "file" | "folder";
export type RichMode = "markdown" | "code" | "todo";

export interface CardLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GridConfig {
  cols: number;
  rowHeight: number;
  gap: number;
}

export interface TextPayload {
  body: string;
  copyFormat: CopyFormat;
}

/** Args for the `open_target` command (used by inline markdown links). The
 * standalone launcher card was removed in schema v2. */
export interface LauncherPayload {
  kind: LauncherKind;
  target: string;
  icon?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export type RichPayload =
  // `collapsed` holds index-path keys (e.g. "0/1") of folded toggle-list items.
  | { mode: "markdown"; source: string; collapsed?: string[] }
  | { mode: "code"; language: string; source: string }
  // `hideCompleted` hides done items in both use and edit mode (view preference).
  | { mode: "todo"; items: TodoItem[]; hideCompleted?: boolean };

interface CardBase {
  id: string;
  layout: CardLayout;
  label?: string;
  colorTag?: string;
}

export type TextCard = CardBase & { type: "text"; payload: TextPayload };
export type RichCard = CardBase & { type: "rich"; payload: RichPayload };

export type Card = TextCard | RichCard;
export type CardType = Card["type"];

export interface Board {
  id: string;
  name: string;
  order: number;
  /** Optional tab accent color (same palette as card `colorTag`). */
  colorTag?: string;
  grid: GridConfig;
  cards: Card[];
}

export interface Settings {
  theme: Theme;
  alwaysOnTop: boolean;
  globalHotkey?: string;
  activeBoardId: string;
  locale: Locale;
}

export interface Workspace {
  schemaVersion: number;
  settings: Settings;
  boards: Board[];
}

/** Error shape returned across the IPC boundary. */
export interface AppError {
  code: string;
  message: string;
}

// 12-column grid. Cards snap to these cells in edit mode and the frontend
// renders square cells (the row height follows the measured column width). The
// column count is kept in lockstep with the Rust `GridConfig::default()` in
// snipdash-core. `rowHeight` here is only a fallback until the grid is measured.
export const DEFAULT_GRID: GridConfig = { cols: 12, rowHeight: 40, gap: 8 };
