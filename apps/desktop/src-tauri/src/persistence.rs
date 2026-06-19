//! Workspace persistence: atomic writes with backup rotation (spec §10.3, NFR).
//!
//! Data lives in the OS application-data directory under `Snipdash/`:
//!   - Windows: `%APPDATA%\Snipdash\workspace.json`
//!   - macOS:   `~/Library/Application Support/Snipdash/workspace.json`
//!   - Linux:   `~/.config/Snipdash/workspace.json`

use std::fs;
use std::path::{Path, PathBuf};

use snipdash_core::{default_workspace, load_from_str, to_pretty_json, validate_workspace, Workspace};
use tauri::{AppHandle, Manager, Runtime};

use crate::error::{AppError, AppResult, ErrorCode};

const APP_DIR_NAME: &str = "Snipdash";
const FILE_NAME: &str = "workspace.json";
/// Number of `.bak` generations to keep.
const BACKUP_GENERATIONS: usize = 3;

/// Resolve (and create) the application data directory.
pub fn app_dir<R: Runtime>(app: &AppHandle<R>) -> AppResult<PathBuf> {
    let base = app
        .path()
        .data_dir()
        .map_err(|e| AppError::new(ErrorCode::Io, format!("cannot resolve data dir: {e}")))?;
    let dir = base.join(APP_DIR_NAME);
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

pub fn workspace_file<R: Runtime>(app: &AppHandle<R>) -> AppResult<PathBuf> {
    Ok(app_dir(app)?.join(FILE_NAME))
}

fn backup_path(target: &Path, generation: usize) -> PathBuf {
    // generation 1 = newest. `.bak`, `.bak2`, `.bak3`.
    if generation <= 1 {
        target.with_extension("json.bak")
    } else {
        target.with_extension(format!("json.bak{generation}"))
    }
}

/// Load the workspace, seeding a default one on first run or after an
/// unrecoverable corruption (the broken file is set aside first).
pub fn load<R: Runtime>(app: &AppHandle<R>) -> AppResult<Workspace> {
    let file = workspace_file(app)?;
    if !file.exists() {
        let ws = default_workspace();
        save(app, &ws)?;
        return Ok(ws);
    }

    let text = fs::read_to_string(&file)?;
    match load_from_str(&text) {
        Ok(ws) => Ok(ws),
        Err(primary) => {
            // Try the most recent backup before giving up.
            if let Some(ws) = try_restore_from_backup(&file) {
                return Ok(ws);
            }
            // Quarantine the corrupt file and start fresh so the app stays usable.
            let quarantine = file.with_extension("json.corrupt");
            let _ = fs::rename(&file, &quarantine);
            let ws = default_workspace();
            save(app, &ws)?;
            Err(AppError::new(
                ErrorCode::Migration,
                format!(
                    "workspace was corrupt ({primary}); a fresh workspace was created and the old file kept at {}",
                    quarantine.display()
                ),
            ))
        }
    }
}

fn try_restore_from_backup(target: &Path) -> Option<Workspace> {
    for generation in 1..=BACKUP_GENERATIONS {
        let bak = backup_path(target, generation);
        if let Ok(text) = fs::read_to_string(&bak) {
            if let Ok(ws) = load_from_str(&text) {
                return Some(ws);
            }
        }
    }
    None
}

/// Atomically persist the workspace: validate, rotate backups, write to a temp
/// file, then rename into place.
pub fn save<R: Runtime>(app: &AppHandle<R>, ws: &Workspace) -> AppResult<()> {
    validate_workspace(ws)?;
    let file = workspace_file(app)?;
    let json = to_pretty_json(ws)?;

    rotate_backups(&file)?;

    let tmp = file.with_extension("json.tmp");
    fs::write(&tmp, json.as_bytes())?;
    replace_file(&tmp, &file)?;
    Ok(())
}

/// Shift `.bak` → `.bak2` → `.bak3`, dropping the oldest, and copy the current
/// file to `.bak`. No-op when there is nothing to back up yet.
fn rotate_backups(target: &Path) -> AppResult<()> {
    if !target.exists() {
        return Ok(());
    }
    // Drop the oldest, then shift each generation down by one.
    let oldest = backup_path(target, BACKUP_GENERATIONS);
    if oldest.exists() {
        fs::remove_file(&oldest)?;
    }
    for generation in (1..BACKUP_GENERATIONS).rev() {
        let from = backup_path(target, generation);
        let to = backup_path(target, generation + 1);
        if from.exists() {
            fs::rename(&from, &to)?;
        }
    }
    fs::copy(target, backup_path(target, 1))?;
    Ok(())
}

/// Cross-platform atomic-ish replace. `rename` replaces atomically on Unix; on
/// Windows it fails over an existing file, so we remove then rename.
fn replace_file(from: &Path, to: &Path) -> AppResult<()> {
    match fs::rename(from, to) {
        Ok(()) => Ok(()),
        Err(_) if to.exists() => {
            fs::remove_file(to)?;
            fs::rename(from, to)?;
            Ok(())
        }
        Err(e) => Err(e.into()),
    }
}
