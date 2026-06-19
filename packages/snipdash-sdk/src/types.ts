/**
 * Domain types for Snipdash, kept in lockstep with the Rust `snipdash-core`
 * crate. The shapes here are the canonical on-disk / IPC format.
 */

export const CURRENT_SCHEMA_VERSION = 1 as const;

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
  | { mode: "markdown"; source: string }
  | { mode: "code"; language: string; source: string }
  | { mode: "todo"; items: TodoItem[] };

interface CardBase {
  id: string;
  layout: CardLayout;
  label?: string;
  colorTag?: string;
}

export type TextCard = CardBase & { type: "text"; payload: TextPayload };
export type LauncherCard = CardBase & { type: "launcher"; payload: LauncherPayload };
export type RichCard = CardBase & { type: "rich"; payload: RichPayload };

export type Card = TextCard | LauncherCard | RichCard;
export type CardType = Card["type"];

export interface Board {
  id: string;
  name: string;
  order: number;
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

export const DEFAULT_GRID: GridConfig = { cols: 12, rowHeight: 40, gap: 8 };
