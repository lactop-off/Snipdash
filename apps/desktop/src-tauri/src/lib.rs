//! Snipdash desktop backend.
//!
//! Wires up plugins (clipboard, opener, notification) and the command handler,
//! then runs the Tauri application. All domain logic lives in `snipdash-core`;
//! this crate is the thin OS-facing shell.

mod commands;
mod error;
mod persistence;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init());

    // Global hotkey is desktop-only: one handler fires for any registered
    // shortcut; we bring the window forward and tell the UI to open capture.
    #[cfg(desktop)]
    let builder = builder.plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(|app, _shortcut, event| {
                if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                    open_quick_capture(app);
                }
            })
            .build(),
    );

    builder
        .invoke_handler(tauri::generate_handler![
            commands::load_workspace,
            commands::save_workspace,
            commands::copy_text,
            commands::copy_rich,
            commands::open_target,
            commands::set_always_on_top,
            commands::register_global_hotkey,
        ])
        .setup(|app| {
            #[cfg(desktop)]
            register_configured_hotkey(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Snipdash");
}

/// Show + focus the main window and tell the frontend to open quick capture.
#[cfg(desktop)]
fn open_quick_capture<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    use tauri::{Emitter, Manager};
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
    }
    let _ = app.emit("quick-capture", ());
}

/// Register the user's configured global hotkey (or the default) at startup.
#[cfg(desktop)]
fn register_configured_hotkey<R: tauri::Runtime>(app: &tauri::AppHandle<R>) {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    let accel = persistence::load(app)
        .ok()
        .and_then(|ws| ws.settings.global_hotkey)
        .unwrap_or_else(|| "CmdOrCtrl+Shift+Space".to_string());
    if !accel.trim().is_empty() {
        let _ = app.global_shortcut().register(accel.as_str());
    }
}
