# 基本設計 — クイックキャプチャ＋グローバルホットキー

> フェーズ: 基本設計 (designer) ／ feature slug: `quick-capture`

## 決定事項（承認済み）
- ホットキー挙動: **表示＋クイックキャプチャを開く**（ウィンドウ前面化＋入力にフォーカス）
- 投入: **Inbox 盤面の ToDo に項目追加**
- 既定ホットキー: **Ctrl+Shift+Space**（設定で変更可、`Settings.globalHotkey`）
- Inbox: **自動生成の専用盤面**（既定名「Inbox」）

## クイックキャプチャ UI（中央モーダル・小）
```
┌──────── overlay 中央上 (幅~480) ────────┐
│ ＋ [ タスクを入力して Enter…          ] │  ← 単一入力, オートフォーカス
│  Enter で Inbox に追加 / Esc で閉じる    │  ← フッタ・ヒント
│  ＋ 追加しました（連続投入のトースト風）  │  ← 直近追加の控えめ表示(任意)
└──────────────────────────────────────────┘
```
- Enter で投入→**入力をクリアして連続投入可**（モーダルは開いたまま）。Esc/背景クリックで閉じる。空入力は無視。
- 既存パレットと同系統の見た目（`.palette` を踏襲した軽量版）。アイコン: 入力左に `plus`、フッタに `corner-down-left`。

## 開く手段
1. **グローバルホットキー**（Tauri実機）: 押下→ウィンドウ show+focus→`quick-capture` イベント→モーダル表示。
2. **コマンドパレット**に「クイックキャプチャ」コマンド追加（`zap` か `plus`）。
3. （任意）ツールバーに小ボタン。
※ 2・3 によりブラウザデモでも開閉・投入を確認できる。

## Inbox 盤面
- 投入時、名前が「Inbox」の盤面を探し、無ければ自動生成（先頭付近）。その盤面の先頭 ToDo カードに項目追加（ToDo カードが無ければ生成）。
- アクティブ盤面は変えない（裏で溜める）。投入後トーストで「Inbox に追加」。

## 設定
- 設定メニューに「グローバルホットキー」入力（テキスト、例 `CmdOrCtrl+Shift+Space`、空で無効）。変更時に再登録（実機）。

## 文言（ja/en）
- `capture.placeholder`: タスクを入力して Enter… / Type a task, press Enter…
- `capture.added`: Inbox に追加しました / Added to Inbox
- `capture.hint`: Enter 追加 / Esc 閉じる …（フッタ）
- `cmd.quickCapture`: クイックキャプチャ / Quick capture
- `settings.globalHotkey`: グローバルホットキー / Global hotkey
- `inbox.name`: Inbox / Inbox（盤面名・既定）

## a11y / 検証メモ
- モーダル `role="dialog"`、入力オートフォーカス、Esc。
- **検証**: キャプチャUI＋Inbox投入＋Esc＝ブラウザ(Playwright)で確認。ホットキー/ウィンドウ前面化＝Tauri実機（`cargo check` でコンパイル確認）。
