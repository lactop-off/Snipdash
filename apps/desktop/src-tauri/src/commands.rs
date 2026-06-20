//! Tauri command surface (the IPC contract with the frontend).
//!
//! Every side effect on OS resources goes through here. Security-relevant input
//! is re-validated against `snipdash-core` — the frontend is never trusted.

use snipdash_core::{validate_launcher_payload, LauncherKind, LauncherPayload, Workspace};
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_opener::OpenerExt;

use crate::error::{AppError, AppResult, ErrorCode};
use crate::persistence;

#[tauri::command]
pub fn load_workspace<R: Runtime>(app: AppHandle<R>) -> AppResult<Workspace> {
    persistence::load(&app)
}

#[tauri::command]
pub fn save_workspace<R: Runtime>(app: AppHandle<R>, workspace: Workspace) -> AppResult<()> {
    persistence::save(&app, &workspace)
}

#[tauri::command]
pub fn copy_text<R: Runtime>(app: AppHandle<R>, text: String) -> AppResult<()> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| AppError::new(ErrorCode::Clipboard, e.to_string()))
}

/// Copy with an optional HTML flavor. HTML clipboard support is a future
/// enhancement (FR-16 v2); for now we write the plain-text fallback so callers
/// can rely on the command today.
#[tauri::command]
pub fn copy_rich<R: Runtime>(
    app: AppHandle<R>,
    html: Option<String>,
    text: String,
) -> AppResult<()> {
    let _ = html;
    app.clipboard()
        .write_text(text)
        .map_err(|e| AppError::new(ErrorCode::Clipboard, e.to_string()))
}

#[tauri::command]
pub fn open_target<R: Runtime>(
    app: AppHandle<R>,
    kind: LauncherKind,
    target: String,
) -> AppResult<()> {
    // Re-validate on the backend; never trust the frontend (spec §12.2).
    let payload = LauncherPayload {
        kind,
        target: target.clone(),
        icon: None,
    };
    validate_launcher_payload(&payload)?;

    match kind {
        LauncherKind::Url => app
            .opener()
            .open_url(target, None::<&str>)
            .map_err(|e| AppError::new(ErrorCode::Open, e.to_string())),
        LauncherKind::File | LauncherKind::Folder => {
            let path = expand_tilde(&app, target.trim());
            // Existence is the only gate: the OS opens a folder in the file
            // manager and a file with its default app (opening an executable
            // launches it). Inline links don't know file-vs-folder up front, so
            // we no longer require the kind to match the on-disk type.
            std::fs::metadata(&path)
                .map_err(|_| AppError::not_found(format!("対象が見つかりません: {path}")))?;
            app.opener()
                .open_path(path, None::<&str>)
                .map_err(|e| AppError::new(ErrorCode::Open, e.to_string()))
        }
    }
}

#[tauri::command]
pub fn set_always_on_top<R: Runtime>(app: AppHandle<R>, enabled: bool) -> AppResult<()> {
    let win = app
        .get_webview_window("main")
        .ok_or_else(|| AppError::internal("main window not found"))?;
    win.set_always_on_top(enabled)
        .map_err(|e| AppError::internal(e.to_string()))
}

/// (Re)register the global hotkey: clears any previous binding and registers
/// `accelerator` (e.g. "CmdOrCtrl+Shift+Space"). An empty string disables it.
/// Desktop-only; a no-op on platforms without global shortcuts.
#[tauri::command]
pub fn register_global_hotkey<R: Runtime>(app: AppHandle<R>, accelerator: String) -> AppResult<()> {
    #[cfg(desktop)]
    {
        use tauri_plugin_global_shortcut::GlobalShortcutExt;
        let gs = app.global_shortcut();
        let _ = gs.unregister_all();
        let accel = accelerator.trim();
        if !accel.is_empty() {
            gs.register(accel)
                .map_err(|e| AppError::new(ErrorCode::Internal, e.to_string()))?;
        }
        Ok(())
    }
    #[cfg(not(desktop))]
    {
        let _ = (app, accelerator);
        Err(AppError::unsupported("global shortcuts unavailable on this platform"))
    }
}

/// Expand a leading `~` to the user's home directory; OS openers do not do this.
fn expand_tilde<R: Runtime>(app: &AppHandle<R>, target: &str) -> String {
    if target == "~" {
        if let Ok(home) = app.path().home_dir() {
            return home.to_string_lossy().into_owned();
        }
    } else if let Some(rest) = target.strip_prefix("~/") {
        if let Ok(home) = app.path().home_dir() {
            return home.join(rest).to_string_lossy().into_owned();
        }
    }
    target.to_string()
}
