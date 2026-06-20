//! Pure validation of a [`Workspace`] and its parts.
//!
//! The desktop backend re-runs the security-relevant checks here (URL scheme,
//! empty target) before performing any side effect, so the frontend is never
//! trusted. See §12.2 of the spec.

use std::collections::HashSet;

use crate::error::{CoreError, CoreResult};
use crate::model::*;

/// URL schemes the launcher is allowed to open. `javascript:` and friends are
/// rejected by omission.
pub const ALLOWED_URL_SCHEMES: &[&str] = &["http", "https", "mailto"];

/// Minimum card size in grid cells (spec §10.4).
pub const MIN_CARD_W: u32 = 2;
pub const MIN_CARD_H: u32 = 2;

fn err(msg: impl Into<String>) -> CoreError {
    CoreError::Validation(msg.into())
}

/// Validate the full workspace. Returns the first violation found.
pub fn validate_workspace(ws: &Workspace) -> CoreResult<()> {
    if ws.schema_version != CURRENT_SCHEMA_VERSION {
        return Err(err(format!(
            "schemaVersion {} is not the current version {}",
            ws.schema_version, CURRENT_SCHEMA_VERSION
        )));
    }

    let mut board_ids: HashSet<&str> = HashSet::new();
    for board in &ws.boards {
        validate_board(board)?;
        if !board_ids.insert(board.id.as_str()) {
            return Err(err(format!("duplicate board id: {}", board.id)));
        }
    }

    // activeBoardId must reference an existing board when boards exist.
    if !ws.boards.is_empty()
        && !ws
            .boards
            .iter()
            .any(|b| b.id == ws.settings.active_board_id)
    {
        return Err(err(format!(
            "activeBoardId '{}' does not reference an existing board",
            ws.settings.active_board_id
        )));
    }

    Ok(())
}

pub fn validate_board(board: &Board) -> CoreResult<()> {
    if board.id.trim().is_empty() {
        return Err(err("board id must not be empty"));
    }
    if board.name.trim().is_empty() {
        return Err(err(format!("board '{}' has an empty name", board.id)));
    }
    if board.grid.cols == 0 {
        return Err(err(format!("board '{}' grid.cols must be >= 1", board.id)));
    }
    if board.grid.row_height == 0 {
        return Err(err(format!(
            "board '{}' grid.rowHeight must be >= 1",
            board.id
        )));
    }

    let mut card_ids: HashSet<&str> = HashSet::new();
    for card in &board.cards {
        validate_card(card, &board.grid)?;
        if !card_ids.insert(card.id()) {
            return Err(err(format!(
                "duplicate card id '{}' in board '{}'",
                card.id(),
                board.id
            )));
        }
    }

    Ok(())
}

pub fn validate_card(card: &Card, grid: &GridConfig) -> CoreResult<()> {
    if card.id().trim().is_empty() {
        return Err(err("card id must not be empty"));
    }

    let layout = card.layout();
    if layout.w < MIN_CARD_W || layout.h < MIN_CARD_H {
        return Err(err(format!(
            "card '{}' is smaller than the minimum size {}x{}",
            card.id(),
            MIN_CARD_W,
            MIN_CARD_H
        )));
    }
    if layout.x + layout.w > grid.cols {
        return Err(err(format!(
            "card '{}' overflows the grid width (x={} w={} cols={})",
            card.id(),
            layout.x,
            layout.w,
            grid.cols
        )));
    }

    Ok(())
}

/// Validate a launcher payload: non-empty target and (for URLs) an allowed
/// scheme. This is the security-critical check re-run in the backend.
pub fn validate_launcher_payload(payload: &LauncherPayload) -> CoreResult<()> {
    let target = payload.target.trim();
    if target.is_empty() {
        return Err(err("launcher target must not be empty"));
    }
    if matches!(payload.kind, LauncherKind::Url) && !is_allowed_url(target) {
        return Err(err(format!(
            "url scheme is not allowed: '{}'",
            scheme_of(target).unwrap_or("<none>")
        )));
    }
    Ok(())
}

/// Extract the URI scheme (the part before the first `:`), lowercased view via
/// case-insensitive comparison at the call site.
pub fn scheme_of(target: &str) -> Option<&str> {
    let idx = target.find(':')?;
    let scheme = &target[..idx];
    if scheme.is_empty() || !scheme.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'+' || b == b'-' || b == b'.') {
        return None;
    }
    Some(scheme)
}

/// Whether `target` is a URL with an allowed scheme.
pub fn is_allowed_url(target: &str) -> bool {
    match scheme_of(target) {
        Some(scheme) => ALLOWED_URL_SCHEMES
            .iter()
            .any(|allowed| allowed.eq_ignore_ascii_case(scheme)),
        None => false,
    }
}
