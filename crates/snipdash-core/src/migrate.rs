//! Schema migration and the canonical load/save (de)serialization path.
//!
//! Loading always goes through [`load_from_value`]: read `schemaVersion`, run
//! any stepwise migrations up to [`CURRENT_SCHEMA_VERSION`], deserialize, then
//! validate. Unknown fields are ignored (forward compatible).

use serde_json::Value;

use crate::error::{CoreError, CoreResult};
use crate::model::{Workspace, CURRENT_SCHEMA_VERSION};
use crate::validate::validate_workspace;

/// Migrate a raw JSON value up to the current schema version, applying one
/// stepwise transform per version. Operating on the raw `Value` (before
/// deserialization) lets a step reshape data that no longer matches the current
/// model — e.g. the v1→v2 step rewrites removed `launcher` cards.
pub fn migrate_value(mut value: Value) -> CoreResult<Value> {
    let mut version = value
        .get("schemaVersion")
        .and_then(Value::as_u64)
        .ok_or_else(|| CoreError::Migration("missing or invalid schemaVersion".into()))?
        as u32;

    if version > CURRENT_SCHEMA_VERSION {
        return Err(CoreError::UnsupportedSchemaVersion {
            found: version,
            supported: CURRENT_SCHEMA_VERSION,
        });
    }

    while version < CURRENT_SCHEMA_VERSION {
        match version {
            1 => migrate_v1_to_v2(&mut value),
            other => {
                return Err(CoreError::Migration(format!(
                    "no migration step defined from schemaVersion {other}"
                )))
            }
        }
        version += 1;
    }

    if let Some(obj) = value.as_object_mut() {
        obj.insert("schemaVersion".into(), Value::from(CURRENT_SCHEMA_VERSION));
    }
    Ok(value)
}

/// v1→v2: the standalone `launcher` card was removed. Convert each one into a
/// markdown card whose body is an inline link (URLs) or the path as code
/// (files/folders, which cannot be opened as inline links).
fn migrate_v1_to_v2(value: &mut Value) {
    let Some(boards) = value.get_mut("boards").and_then(Value::as_array_mut) else {
        return;
    };
    for board in boards {
        let Some(cards) = board.get_mut("cards").and_then(Value::as_array_mut) else {
            continue;
        };
        for card in cards {
            if card.get("type").and_then(Value::as_str) == Some("launcher") {
                convert_launcher_card(card);
            }
        }
    }
}

fn convert_launcher_card(card: &mut Value) {
    let label = card
        .get("label")
        .and_then(Value::as_str)
        .map(str::to_string);
    let payload = card.get("payload");
    let target = payload
        .and_then(|p| p.get("target"))
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let kind = payload
        .and_then(|p| p.get("kind"))
        .and_then(Value::as_str)
        .unwrap_or("url");

    let display = label
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| target.clone());
    let is_url = kind == "url"
        || target.starts_with("http://")
        || target.starts_with("https://")
        || target.starts_with("mailto:");

    let source = if target.is_empty() {
        display
    } else if is_url {
        format!("[{display}]({target})")
    } else {
        format!("{display}\n\n`{target}`")
    };

    if let Some(obj) = card.as_object_mut() {
        obj.insert("type".into(), Value::from("rich"));
        obj.insert(
            "payload".into(),
            serde_json::json!({ "mode": "markdown", "source": source }),
        );
    }
}

/// Migrate, deserialize and validate a JSON value into a [`Workspace`].
pub fn load_from_value(value: Value) -> CoreResult<Workspace> {
    let migrated = migrate_value(value)?;
    let ws: Workspace = serde_json::from_value(migrated)
        .map_err(|e| CoreError::Migration(format!("deserialize failed: {e}")))?;
    validate_workspace(&ws)?;
    Ok(ws)
}

/// Parse a JSON string into a validated [`Workspace`].
pub fn load_from_str(s: &str) -> CoreResult<Workspace> {
    let value: Value =
        serde_json::from_str(s).map_err(|e| CoreError::Migration(format!("invalid json: {e}")))?;
    load_from_value(value)
}

/// Serialize a workspace to pretty JSON (the on-disk form).
pub fn to_pretty_json(ws: &Workspace) -> CoreResult<String> {
    serde_json::to_string_pretty(ws)
        .map_err(|e| CoreError::Migration(format!("serialize failed: {e}")))
}
