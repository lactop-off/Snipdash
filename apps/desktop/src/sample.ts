import {
  type Workspace,
  createBoard,
  createTextCard,
  createRichCard,
  createTodoItem,
} from "@snipdash/sdk";

/**
 * A small in-memory workspace used only when the app runs outside Tauri
 * (browser demo / tests). In the real app the Rust backend seeds the default
 * workspace on first launch.
 */
export function sampleWorkspace(): Workspace {
  const biz = createBoard("業務定型", 0);
  biz.colorTag = "blue";
  const t1 = createTextCard({ x: 0, y: 0, w: 4, h: 4 });
  t1.label = "署名";
  t1.colorTag = "green";
  t1.payload.body =
    "お世話になっております。\n\n本日（{{TODAY}}）の件についてご連絡いたします。\n\n――\n氏名 / 部署";
  const todo = createRichCard("todo", { x: 4, y: 0, w: 4, h: 6 });
  todo.label = "本日のタスク";
  todo.colorTag = "#e11d48";
  if (todo.payload.mode === "todo") {
    todo.payload.items = [
      createTodoItem("メールの返信"),
      createTodoItem("日報の作成"),
      { ...createTodoItem("ミーティング"), done: true },
    ];
  }
  biz.cards = [t1, todo];

  const dev = createBoard("開発", 1);
  dev.colorTag = "green";
  const code = createRichCard("code", { x: 0, y: 0, w: 6, h: 6 });
  code.label = "サンプルコード";
  if (code.payload.mode === "code") {
    code.payload.language = "bash";
    code.payload.source = "git log --oneline -10\ngit switch -c feat/{{DAY}}-task";
  }
  dev.cards = [code];

  const links = createBoard("リンク集", 2);
  links.colorTag = "purple";
  const md = createRichCard("markdown", { x: 0, y: 0, w: 7, h: 8 });
  md.label = "ようこそ";
  if (md.payload.mode === "markdown") {
    md.payload.source = [
      "# Snipdash へようこそ 👋",
      "",
      "右上の **鍵アイコン** で編集モードに切り替えると、移動・編集ができます。",
      "",
      "## 文章内リンク",
      "- [GitHub](https://github.com) や https://example.com のように本文中にリンクを書けます。",
      "",
      "## 折りたたみ（ネスト箇条書き）",
      "- プロジェクト",
      "  - [main](https://github.com)",
      "  - [docs](https://developer.mozilla.org)",
      "- メモ",
      "  - 子項目 1",
      "  - 子項目 2",
      "",
      "## コピー要素",
      "クリックでコピー: [[git switch -c feat/{{DAY}}]]",
      "表示名つき: [[署名をコピー|お世話になっております。{{TODAY}}]]",
      "",
      "## 画像（サイズ指定）",
      "![サンプル|240x120](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==)",
      "",
      "## ファイル/フォルダを開く（デスクトップ版）",
      "`[プロジェクト](~/projects)` のようなパスのリンクで、フォルダや",
      "ファイル（アプリ含む）をOSの既定アプリで開けます。",
    ].join("\n");
  }
  links.cards = [md];

  return {
    schemaVersion: 2,
    settings: {
      theme: "system",
      alwaysOnTop: false,
      activeBoardId: biz.id,
      locale: "ja",
    },
    boards: [biz, dev, links],
  };
}
