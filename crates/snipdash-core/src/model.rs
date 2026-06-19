//! Domain model for Snipdash.
//!
//! The serde representation is the on-disk / IPC format and is kept in lockstep
//! with the TypeScript types in `@snipdash/sdk`. Field names are camelCase to
//! match the JavaScript side; enum tags are lowercase.

use serde::{Deserialize, Serialize};

/// The schema version this build understands and writes.
pub const CURRENT_SCHEMA_VERSION: u32 = 1;

/// Root of all persisted data. Serialized to a single `workspace.json`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub schema_version: u32,
    pub settings: Settings,
    pub boards: Vec<Board>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub theme: Theme,
    pub always_on_top: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub global_hotkey: Option<String>,
    pub active_board_id: String,
    pub locale: Locale,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Theme {
    Light,
    Dark,
    System,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Locale {
    Ja,
    En,
}

/// A single tab: a grid plus its cards.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Board {
    pub id: String,
    pub name: String,
    pub order: u32,
    pub grid: GridConfig,
    pub cards: Vec<Card>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GridConfig {
    pub cols: u32,
    pub row_height: u32,
    pub gap: u32,
}

impl Default for GridConfig {
    fn default() -> Self {
        Self {
            cols: 12,
            row_height: 40,
            gap: 8,
        }
    }
}

/// Position and size in grid-cell units.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct CardLayout {
    pub x: u32,
    pub y: u32,
    pub w: u32,
    pub h: u32,
}

/// A tile on the grid. The `type` tag selects the payload shape.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum Card {
    Text(TextCard),
    Launcher(LauncherCard),
    Rich(RichCard),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextCard {
    pub id: String,
    pub layout: CardLayout,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_tag: Option<String>,
    pub payload: TextPayload,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextPayload {
    pub body: String,
    pub copy_format: CopyFormat,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CopyFormat {
    Plain,
    Rich,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherCard {
    pub id: String,
    pub layout: CardLayout,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_tag: Option<String>,
    pub payload: LauncherPayload,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LauncherPayload {
    pub kind: LauncherKind,
    pub target: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LauncherKind {
    Url,
    File,
    Folder,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RichCard {
    pub id: String,
    pub layout: CardLayout,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_tag: Option<String>,
    pub payload: RichPayload,
}

/// Rich-card sub-modes. Internally tagged on `mode`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "mode", rename_all = "lowercase")]
pub enum RichPayload {
    Markdown {
        source: String,
    },
    Code {
        language: String,
        source: String,
    },
    Todo {
        items: Vec<TodoItem>,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TodoItem {
    pub id: String,
    pub text: String,
    pub done: bool,
}

impl Card {
    pub fn id(&self) -> &str {
        match self {
            Card::Text(c) => &c.id,
            Card::Launcher(c) => &c.id,
            Card::Rich(c) => &c.id,
        }
    }

    pub fn layout(&self) -> &CardLayout {
        match self {
            Card::Text(c) => &c.layout,
            Card::Launcher(c) => &c.layout,
            Card::Rich(c) => &c.layout,
        }
    }

    pub fn type_name(&self) -> &'static str {
        match self {
            Card::Text(_) => "text",
            Card::Launcher(_) => "launcher",
            Card::Rich(_) => "rich",
        }
    }
}
