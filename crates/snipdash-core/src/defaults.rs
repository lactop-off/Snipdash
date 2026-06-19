//! Initial workspace generation.
//!
//! On first launch (no `workspace.json`), the app seeds a welcoming workspace
//! with three sample boards — 業務定型 / 開発 / リンク集 (spec Q5).

use uuid::Uuid;

use crate::model::*;

fn uuid() -> String {
    Uuid::new_v4().to_string()
}

fn text_card(x: u32, y: u32, w: u32, h: u32, label: &str, body: &str) -> Card {
    Card::Text(TextCard {
        id: uuid(),
        layout: CardLayout { x, y, w, h },
        label: Some(label.to_string()),
        color_tag: None,
        payload: TextPayload {
            body: body.to_string(),
            copy_format: CopyFormat::Plain,
        },
    })
}

fn launcher_card(
    x: u32,
    y: u32,
    w: u32,
    h: u32,
    label: &str,
    kind: LauncherKind,
    target: &str,
) -> Card {
    Card::Launcher(LauncherCard {
        id: uuid(),
        layout: CardLayout { x, y, w, h },
        label: Some(label.to_string()),
        color_tag: None,
        payload: LauncherPayload {
            kind,
            target: target.to_string(),
            icon: None,
        },
    })
}

fn rich_card(x: u32, y: u32, w: u32, h: u32, label: &str, payload: RichPayload) -> Card {
    Card::Rich(RichCard {
        id: uuid(),
        layout: CardLayout { x, y, w, h },
        label: Some(label.to_string()),
        color_tag: None,
        payload,
    })
}

fn todo_item(text: &str, done: bool) -> TodoItem {
    TodoItem {
        id: uuid(),
        text: text.to_string(),
        done,
    }
}

/// Build the default workspace with three sample boards.
pub fn default_workspace() -> Workspace {
    let board_biz = Board {
        id: uuid(),
        name: "業務定型".to_string(),
        order: 0,
        grid: GridConfig::default(),
        cards: vec![
            text_card(
                0,
                0,
                4,
                4,
                "署名",
                "お世話になっております。\n\n本日（{{TODAY}}）の件についてご連絡いたします。\n\n――\n氏名 / 部署",
            ),
            text_card(
                4,
                0,
                4,
                4,
                "受付メール",
                "ご連絡ありがとうございます。\n受付番号: {{UUID}}\n受付日時: {{NOW}}\n\n担当者より追ってご連絡いたします。",
            ),
            rich_card(
                8,
                0,
                4,
                6,
                "本日のタスク",
                RichPayload::Todo {
                    items: vec![
                        todo_item("メールの返信", false),
                        todo_item("日報の作成", false),
                        todo_item("ミーティング", true),
                    ],
                },
            ),
        ],
    };

    let board_dev = Board {
        id: uuid(),
        name: "開発".to_string(),
        order: 1,
        grid: GridConfig::default(),
        cards: vec![
            rich_card(
                0,
                0,
                6,
                6,
                "サンプルコード",
                RichPayload::Code {
                    language: "bash".to_string(),
                    source: "# 直近のコミットを確認\ngit log --oneline -10\n\n# ブランチを切る\ngit switch -c feat/{{DAY}}-task".to_string(),
                },
            ),
            text_card(
                6,
                0,
                6,
                4,
                "接続文字列",
                "postgres://user:password@localhost:5432/mydb",
            ),
            launcher_card(
                6,
                4,
                6,
                2,
                "プロジェクトフォルダ",
                LauncherKind::Folder,
                "~/projects",
            ),
        ],
    };

    let board_links = Board {
        id: uuid(),
        name: "リンク集".to_string(),
        order: 2,
        grid: GridConfig::default(),
        cards: vec![
            rich_card(
                0,
                0,
                6,
                6,
                "ようこそ",
                RichPayload::Markdown {
                    source: "# Snipdash へようこそ 👋\n\nこれは **リンク集** 盤面です。\n\n- カードを **ワンクリックでコピー / 起動**できます\n- 右上の **鍵アイコン** で *編集モード* に切り替えると、移動・リサイズ・追加・編集ができます\n- 本文に `{{TODAY}}` などの変数を入れると、コピー時に展開されます\n\n自分専用の盤面を育てていきましょう。".to_string(),
                },
            ),
            launcher_card(6, 0, 3, 2, "GitHub", LauncherKind::Url, "https://github.com"),
            launcher_card(
                9,
                0,
                3,
                2,
                "MDN",
                LauncherKind::Url,
                "https://developer.mozilla.org",
            ),
        ],
    };

    let active_board_id = board_biz.id.clone();

    Workspace {
        schema_version: CURRENT_SCHEMA_VERSION,
        settings: Settings {
            theme: Theme::System,
            always_on_top: false,
            global_hotkey: None,
            active_board_id,
            locale: Locale::Ja,
        },
        boards: vec![board_biz, board_dev, board_links],
    }
}
