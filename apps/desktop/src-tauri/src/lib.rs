//! Snipdash desktop backend.
//!
//! Wires up plugins (clipboard, opener) and the command handler, then runs the
//! Tauri application. All domain logic lives in `snipdash-core`; this crate is
//! the thin OS-facing shell.

mod commands;
mod error;
mod persistence;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::load_workspace,
            commands::save_workspace,
            commands::copy_text,
            commands::copy_rich,
            commands::open_target,
            commands::set_always_on_top,
            commands::register_global_hotkey,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Snipdash");
}
