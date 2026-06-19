use serde::Serialize;
use snipdash_core::CoreError;

/// Errors returned across the IPC boundary. Serialized as
/// `{ "code": "...", "message": "..." }` so the frontend can branch on `code`
/// and show `message` in a toast.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppError {
    pub code: ErrorCode,
    pub message: String,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ErrorCode {
    Io,
    Validation,
    Migration,
    NotFound,
    InvalidTarget,
    Clipboard,
    Open,
    Unsupported,
    Internal,
}

impl AppError {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::NotFound, message)
    }

    pub fn invalid_target(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::InvalidTarget, message)
    }

    pub fn unsupported(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::Unsupported, message)
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::Internal, message)
    }
}

impl From<CoreError> for AppError {
    fn from(e: CoreError) -> Self {
        let code = match e {
            CoreError::Validation(_) => ErrorCode::Validation,
            CoreError::UnsupportedSchemaVersion { .. } | CoreError::Migration(_) => {
                ErrorCode::Migration
            }
        };
        AppError::new(code, e.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::new(ErrorCode::Io, e.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
