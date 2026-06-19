/**
 * Typed wrappers around the Tauri command surface. The frontend never touches
 * OS resources directly — file IO, clipboard and launching all go through here.
 *
 * Command argument keys match the Rust parameter names (all single words, so
 * no snake/camel mismatch).
 */

import { invoke } from "@tauri-apps/api/core";
import type { LauncherKind, Workspace } from "./types";

/** Load the workspace, seeding a default one on first run. */
export function loadWorkspace(): Promise<Workspace> {
  return invoke<Workspace>("load_workspace");
}

/** Persist the workspace (validated + atomic write on the backend). */
export function saveWorkspace(workspace: Workspace): Promise<void> {
  return invoke<void>("save_workspace", { workspace });
}

/** Write plain text to the clipboard. */
export function copyText(text: string): Promise<void> {
  return invoke<void>("copy_text", { text });
}

/** Write rich text with a plain-text fallback (HTML flavor is a future feature). */
export function copyRich(text: string, html?: string): Promise<void> {
  return invoke<void>("copy_rich", { text, html });
}

/** Open a URL/file/folder with the OS default handler (re-validated server-side). */
export function openTarget(kind: LauncherKind, target: string): Promise<void> {
  return invoke<void>("open_target", { kind, target });
}

/** Toggle the window's always-on-top state (spec v1.1). */
export function setAlwaysOnTop(enabled: boolean): Promise<void> {
  return invoke<void>("set_always_on_top", { enabled });
}

/** Register a global show/hide hotkey (spec v1.1; currently unsupported). */
export function registerGlobalHotkey(accelerator: string): Promise<void> {
  return invoke<void>("register_global_hotkey", { accelerator });
}
