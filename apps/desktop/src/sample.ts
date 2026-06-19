import {
  type Workspace,
  createBoard,
  createTextCard,
  createLauncherCard,
  createRichCard,
} from "@snipdash/sdk";

/**
 * A small in-memory workspace used only when the app runs outside Tauri
 * (browser demo / tests). In the real app the Rust backend seeds the default
 * workspace on first launch.
 */
export function sampleWorkspace(): Workspace {
  const biz = createBoard("業務定型", 0);
  const t1 = createTextCard({ x: 0, y: 0, w: 4, h: 4 });
  t1.label = "署名";
  t1.payload.body =
    "お世話になっております。\n\n本日（{{TODAY}}）の件についてご連絡いたします。\n\n――\n氏名 / 部署";
  const todo = createRichCard("todo", { x: 4, y: 0, w: 4, h: 6 });
  todo.label = "本日のタスク";
  biz.cards = [t1, todo];

  const dev = createBoard("開発", 1);
  const code = createRichCard("code", { x: 0, y: 0, w: 6, h: 6 });
  code.label = "サンプルコード";
  if (code.payload.mode === "code") {
    code.payload.language = "bash";
    code.payload.source = "git log --oneline -10\ngit switch -c feat/{{DAY}}-task";
  }
  dev.cards = [code];

  const links = createBoard("リンク集", 2);
  const gh = createLauncherCard("url", { x: 0, y: 0, w: 3, h: 2 });
  gh.label = "GitHub";
  gh.payload.target = "https://github.com";
  const md = createRichCard("markdown", { x: 3, y: 0, w: 6, h: 6 });
  md.label = "ようこそ";
  if (md.payload.mode === "markdown") {
    md.payload.source =
      "# Snipdash へようこそ 👋\n\n右上の **鍵アイコン** で編集モードに切り替えると、カードの移動・編集ができます。";
  }
  links.cards = [gh, md];

  return {
    schemaVersion: 1,
    settings: {
      theme: "system",
      alwaysOnTop: false,
      activeBoardId: biz.id,
      locale: "ja",
    },
    boards: [biz, dev, links],
  };
}
