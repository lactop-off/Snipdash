# 基本設計 — コマンドパレット（Ctrl+K）

> フェーズ: 基本設計 (designer) ／ feature slug: `command-palette`

## 決定事項（承認済み）
- 検索対象: **label＋本文**（text/markdown/code/todo項目）＋盤面名
- **アプリ操作コマンドも含める**
- 実行: **Enter＝既定**（コピー可ならコピー／不可はジャンプ）／**Alt+Enter＝逆**
- 空入力時＝コマンド＋全カード一覧、開くキー＝Ctrl+K（Cmd+K）のみ

## レイアウト（中央モーダル）
```
┌───────────── overlay (中央上, 幅~560) ─────────────┐
│ 🔍 [ 検索…                                       ] │  ← 入力(オートフォーカス)
│ ── コマンド ─────────────────────────────────────  │
│  ✏️ 編集モード切替                                  │
│  📅 今日を開く                                      │
│ ── カード・盤面 ────────────────────────────────── │
│  📄 署名            業務定型           ⏎ コピー      │  ← 種別/タイトル/所属/既定アクション
│  ▦ 開発(盤面)                          ⏎ 開く       │
└────────────────────────────────────────────────────┘
   背景は薄暗オーバーレイ。Esc / 背景クリックで閉じる。
```
- 行 = [種別アイコン｜タイトル｜所属(muted)｜右端に既定アクションのヒント]。選択行はハイライト。
- セクション見出し「コマンド」「カード・盤面」。空入力時もこの順で全件。
- 0件時は空状態（「該当なし」）。フッタに操作ヒント（�vert↑↓ 移動 / ⏎ 実行 / Alt+⏎ もう一方 / Esc 閉じる）。

## 種別アイコン（lucide）
- 入力: `search` / 戻り: `corner-down-left`（ヒント）
- カード: text→`file-text`, markdown→`file-text`, code→`code`, todo→`list-todo`
- 盤面: `layout-grid`
- コマンド: 各コマンド固有（`pencil`/`calendar-check`/`settings`/`plus`）

## 操作 / a11y
- オートフォーカス入力。↑↓で選択、Enter=既定、Alt+Enter=逆、Esc/背景クリックで閉じる、行クリックで実行。
- `role="dialog"` `aria-modal`。

## 文言（ja / en）
- `palette.placeholder`: コマンド・カードを検索… / Search commands & cards…
- `palette.empty`: 該当なし / No matches
- `palette.section.commands`: コマンド / Commands
- `palette.section.results`: カード・盤面 / Cards & boards
- `palette.hint.copy`: コピー / Copy, `palette.hint.jump`: 開く / Open
- コマンド名: `cmd.toggleEdit`/`cmd.openToday`/`cmd.openSettings`/`cmd.addText`/`cmd.addMarkdown`/`cmd.addCode`/`cmd.addTodo`

## レビュー観点
- 既存のモーダル/メニュー(`.menu`)とトーン一致、アイコンは実在の lucide 名。日本語の本文/盤面名でも検索が効くか（部分一致中心）。
