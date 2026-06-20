# 詳細設計 — コマンドパレット（Ctrl+K）

> フェーズ: 詳細設計 (tech-lead) ／ feature slug: `command-palette` ／ 実現性: **OK**

## スキーマ影響
**なし**（既存データを読むだけ）。Rust 変更なし、lockstep 非抵触。

## 変更/新規ファイル
1. **`packages/snipdash-sdk/src/search.ts`（新規・純粋, テスト付き）**
   - `export function fuzzyScore(text: string, query: string): number | null` — 大文字小文字無視。**部分一致**は高スコア（先頭ほど高）、なければ**サブシーケンス**一致（連続ボーナス）、不一致は `null`。空クエリは `0`。
   - `export type Hit = { kind:"card"; id; boardId; boardName; cardType:"text"|"markdown"|"code"|"todo"; title; copyable; copyText; score } | { kind:"board"; id; boardName; title; score }`
   - `export function searchWorkspace(ws: Workspace, query: string, limit = 50): Hit[]`
     - 各 board: 名前を `fuzzyScore` → board hit。各 card: `label + "\n" + 本文`（text=body / markdown=source / code=source / todo=items.text 連結）を `fuzzyScore` → card hit。`copyable/copyText` は既存 `copyableText` から。
     - クエリ有り: score 降順。空: 入力順（コマンド側で全件表示）。`limit` で打ち切り。
     - `index.ts` から re-export。
2. **`packages/snipdash-sdk/src/search.test.ts`（新規 vitest）**: `fuzzyScore`（部分/サブシーケンス/不一致/空）と `searchWorkspace`（label・本文ヒット、盤面ヒット、順位）。
3. **`apps/desktop/src/components/CommandPalette.tsx`（新規）**: props `{ open, onClose, commands: PaletteCommand[] }`。`searchWorkspace(workspace, query)` ＋ commands を統合・スコア順表示。Enter=既定（card: copyable なら `copyResolved` / 不可は `setActiveBoard`+`flashCard`、board: jump、command: run）、Alt+Enter=逆、↑↓選択、Esc/背景クリックで閉じる。card/board の実行は本コンポーネント内（store＋`copyResolved` を直接利用）。
4. **`apps/desktop/src/components/AppShell.tsx`**: `paletteOpen` state、グローバル keydown に `Ctrl/Cmd+K`→トグル、Esc に `setPaletteOpen(false)`。`commands` 配列（編集切替/今日/設定/各カード追加）を構築し `<CommandPalette open commands … />` を描画。
5. **`apps/desktop/src/i18n.ts`**: `palette.*` / `cmd.*`（ja/en）。
6. **icons**: `search` `file-text` `list-todo` `layout-grid` `corner-down-left`（取得済み）。
7. **`styles.css`**: `.palette-overlay` `.palette` `.palette-input` `.palette-list` `.palette-item`(+selected) `.palette-section` `.palette-hint` 等。

## テスト計画
- 単体: `search.test.ts`。
- QA(Playwright): Ctrl+K で開く → 入力で絞り込み（label・本文・盤面）→ Enter でカードのコピー（クリップボード確認）→ 盤面 hit を Enter でジャンプ（盤面切替）→ コマンド実行（例: 今日を開く）→ Esc。
- 緑化: typecheck / SDK vitest / build:vite。

## リスク/留意
- コマンドの run は AppShell が握る state/store を閉じ込めて props 注入（パレットは UI 状態を知らない）。
- 検索は O(カード数)。`limit` で表示は打ち切り。
- 日本語は部分一致中心で機能（サブシーケンスは補助）。
