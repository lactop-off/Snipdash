//! # snipdash-core
//!
//! The reusable heart of Snipdash: domain types, validation, (de)serialization
//! and schema migration. This crate is **UI- and IO-independent** — it performs
//! no file, clipboard or network access — so it can be embedded in the desktop
//! app or any other host.
//!
//! The serde representation is the canonical on-disk / IPC format and is kept in
//! lockstep with the TypeScript types in `@snipdash/sdk`.

pub mod defaults;
pub mod error;
pub mod migrate;
pub mod model;
pub mod validate;

pub use defaults::default_workspace;
pub use error::{CoreError, CoreResult};
pub use migrate::{load_from_str, load_from_value, migrate_value, to_pretty_json};
pub use model::*;
pub use validate::{
    is_allowed_url, scheme_of, validate_board, validate_card, validate_launcher_payload,
    validate_workspace, ALLOWED_URL_SCHEMES, MIN_CARD_H, MIN_CARD_W,
};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_workspace_is_valid() {
        let ws = default_workspace();
        validate_workspace(&ws).expect("default workspace must validate");
        assert_eq!(ws.schema_version, CURRENT_SCHEMA_VERSION);
        assert_eq!(ws.boards.len(), 3);
        assert_eq!(ws.boards[0].name, "業務定型");
        // active board references an existing board
        assert!(ws
            .boards
            .iter()
            .any(|b| b.id == ws.settings.active_board_id));
    }

    #[test]
    fn roundtrip_serialization_is_stable() {
        let ws = default_workspace();
        let json = to_pretty_json(&ws).unwrap();
        let back = load_from_str(&json).unwrap();
        assert_eq!(ws, back);
    }

    #[test]
    fn card_type_tag_serializes_lowercase() {
        let ws = default_workspace();
        let json = to_pretty_json(&ws).unwrap();
        assert!(json.contains("\"type\": \"text\""));
        assert!(json.contains("\"type\": \"rich\""));
        // rich sub-mode tag
        assert!(json.contains("\"mode\": \"markdown\""));
        assert!(json.contains("\"mode\": \"code\""));
        assert!(json.contains("\"mode\": \"todo\""));
        // camelCase field names
        assert!(json.contains("\"schemaVersion\""));
        assert!(json.contains("\"copyFormat\""));
        assert!(json.contains("\"activeBoardId\""));
    }

    #[test]
    fn unknown_fields_are_ignored_for_forward_compat() {
        let json = r#"{
            "schemaVersion": 1,
            "settings": { "theme": "dark", "alwaysOnTop": false, "activeBoardId": "b1", "locale": "ja", "futureField": 42 },
            "boards": [
                { "id": "b1", "name": "B", "order": 0,
                  "grid": { "cols": 12, "rowHeight": 40, "gap": 8 },
                  "cards": [] }
            ]
        }"#;
        let ws = load_from_str(json).expect("should ignore unknown fields");
        assert_eq!(ws.boards.len(), 1);
    }

    #[test]
    fn rejects_newer_schema_version() {
        let json = r#"{ "schemaVersion": 99, "settings": {}, "boards": [] }"#;
        let err = load_from_str(json).unwrap_err();
        assert!(matches!(
            err,
            CoreError::UnsupportedSchemaVersion { found: 99, .. }
        ));
    }

    #[test]
    fn rejects_dangling_active_board_id() {
        let json = r#"{
            "schemaVersion": 1,
            "settings": { "theme": "system", "alwaysOnTop": false, "activeBoardId": "missing", "locale": "en" },
            "boards": [
                { "id": "b1", "name": "B", "order": 0,
                  "grid": { "cols": 12, "rowHeight": 40, "gap": 8 }, "cards": [] }
            ]
        }"#;
        let err = load_from_str(json).unwrap_err();
        assert!(matches!(err, CoreError::Validation(_)));
    }

    #[test]
    fn rejects_empty_launcher_target() {
        let payload = LauncherPayload {
            kind: LauncherKind::Url,
            target: "   ".to_string(),
            icon: None,
        };
        assert!(validate_launcher_payload(&payload).is_err());
    }

    #[test]
    fn url_scheme_allowlist() {
        assert!(is_allowed_url("https://example.com"));
        assert!(is_allowed_url("HTTP://example.com"));
        assert!(is_allowed_url("mailto:a@b.com"));
        assert!(!is_allowed_url("javascript:alert(1)"));
        assert!(!is_allowed_url("file:///etc/passwd"));
        assert!(!is_allowed_url("ftp://example.com"));
        assert!(!is_allowed_url("not a url"));
    }

    #[test]
    fn rejects_card_below_min_size() {
        let grid = GridConfig::default();
        let card = Card::Text(TextCard {
            id: "c1".into(),
            layout: CardLayout { x: 0, y: 0, w: 1, h: 1 },
            label: None,
            color_tag: None,
            payload: TextPayload {
                body: "x".into(),
                copy_format: CopyFormat::Plain,
            },
        });
        assert!(validate_card(&card, &grid).is_err());
    }

    #[test]
    fn rejects_card_overflowing_grid_width() {
        let grid = GridConfig::default(); // cols: 12
        let card = Card::Text(TextCard {
            id: "c1".into(),
            layout: CardLayout { x: 10, y: 0, w: 4, h: 2 },
            label: None,
            color_tag: None,
            payload: TextPayload {
                body: "x".into(),
                copy_format: CopyFormat::Plain,
            },
        });
        assert!(validate_card(&card, &grid).is_err());
    }

    #[test]
    fn migrates_v1_launcher_to_markdown_link() {
        let json = r#"{
            "schemaVersion": 1,
            "settings": { "theme": "system", "alwaysOnTop": false, "activeBoardId": "b1", "locale": "ja" },
            "boards": [
                { "id": "b1", "name": "Links", "order": 0,
                  "grid": { "cols": 12, "rowHeight": 40, "gap": 8 },
                  "cards": [
                    { "type": "launcher", "id": "c1", "layout": {"x":0,"y":0,"w":3,"h":2},
                      "label": "GitHub", "payload": {"kind":"url","target":"https://github.com"} }
                  ] }
            ]
        }"#;
        let ws = load_from_str(json).expect("v1 launcher should migrate");
        assert_eq!(ws.schema_version, CURRENT_SCHEMA_VERSION);
        let card = &ws.boards[0].cards[0];
        match card {
            Card::Rich(rc) => match &rc.payload {
                RichPayload::Markdown { source, .. } => {
                    assert_eq!(source, "[GitHub](https://github.com)");
                }
                _ => panic!("expected markdown payload"),
            },
            _ => panic!("launcher should become a rich card"),
        }
    }
}
