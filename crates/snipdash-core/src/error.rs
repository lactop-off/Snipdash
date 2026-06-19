use thiserror::Error;

/// Domain-level errors produced by validation and migration.
///
/// These are pure (no IO). IO/Tauri errors are mapped to the app error type
/// in the desktop backend.
#[derive(Debug, Error, PartialEq, Eq)]
pub enum CoreError {
    #[error("validation failed: {0}")]
    Validation(String),

    #[error("unsupported schema version: {found} (max supported {supported})")]
    UnsupportedSchemaVersion { found: u32, supported: u32 },

    #[error("migration failed: {0}")]
    Migration(String),
}

pub type CoreResult<T> = Result<T, CoreError>;
