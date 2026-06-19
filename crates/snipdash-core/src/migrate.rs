//! Schema migration and the canonical load/save (de)serialization path.
//!
//! Loading always goes through [`load_from_value`]: read `schemaVersion`, run
//! any stepwise migrations up to [`CURRENT_SCHEMA_VERSION`], deserialize, then
//! validate. Unknown fields are ignored (forward compatible).

use serde_json::Value;

use crate::error::{CoreError, CoreResult};
use crate::model::{Workspace, CURRENT_SCHEMA_VERSION};
use crate::validate::validate_workspace;

/// Migrate a raw JSON value up to the current schema version.
///
/// For v1 there are no prior versions, so this only guards against data from a
/// newer build. Future versions add `match` arms that transform `value`
/// in place and bump its `schemaVersion`.
pub fn migrate_value(value: Value) -> CoreResult<Value> {
    let version = value
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

    // Stepwise migrations would run here, e.g.:
    //   while current < CURRENT_SCHEMA_VERSION { value = migrate_step(current, value)?; current += 1; }
    // No steps are needed yet because v1 is the first version.

    Ok(value)
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
