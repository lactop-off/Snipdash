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
  /** Optional due date/time as an ISO 8601 string (with timezone offset). */
  due?: string;
  /** Minutes before `due` to fire a reminder. Undefined falls back to
   * `Settings.defaultRemindBefore` (and then `DEFAULT_REMIND_BEFORE`). */
  remindBefore?: number;
  /** ISO timestamp of the last reminder fired, used to dedupe across restarts.
   * Cleared whenever `due` changes. */
  notifiedAt?: string;
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

/** Body-only card: empty `text` is a layout spacer, non-empty renders as a
 * centered heading/caption. It has no title/label chrome in the UI (the
 * optional `label`/`colorTag` from `CardBase` are kept only for a uniform card
 * shape and are never shown). */
export interface SpacerPayload {
  text: string;
}

export type TextCard = CardBase & { type: "text"; payload: TextPayload };
export type RichCard = CardBase & { type: "rich"; payload: RichPayload };
export type SpacerCard = CardBase & { type: "spacer"; payload: SpacerPayload };

export type Card = TextCard | RichCard | SpacerCard;
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
  /** Default reminder lead time (minutes) for todo items without their own
   * `remindBefore`. Undefined applies `DEFAULT_REMIND_BEFORE`. */
  defaultRemindBefore?: number;
  /** Pomodoro durations (minutes) + long-break interval. Undefined applies
   * `DEFAULT_POMODORO`. The running timer state is ephemeral and not stored. */
  pomodoro?: PomodoroConfig;
}

/** Pomodoro timer configuration (persisted). */
export interface PomodoroConfig {
  workMin: number;
  breakMin: number;
  longBreakMin: number;
  /** Take a long break after this many completed work intervals. */
  longBreakEvery: number;
}

/** Built-in fallback reminder lead time (minutes) when neither the item nor the
 * workspace settings specify one. Must be one of {@link REMIND_BEFORE_PRESETS}. */
export const DEFAULT_REMIND_BEFORE = 15;

/** Lead-time presets offered in the todo due-date picker, in minutes. */
export const REMIND_BEFORE_PRESETS = [0, 5, 15, 30, 60, 120, 1440] as const;

/** Classic Pomodoro defaults applied when `Settings.pomodoro` is unset. */
export const DEFAULT_POMODORO: PomodoroConfig = {
  workMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
};

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
