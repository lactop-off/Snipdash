# 要件定義 — クイックキャプチャ＋グローバルホットキー

> フェーズ: 要件定義 (pm) ／ 状態: **人間承認待ち** ／ feature slug: `quick-capture`

## ゴール & ユーザー価値
他アプリで作業中でも、**グローバルホットキー一発**で Snipdash を前面に出し、**思いついたタスク/メモを即キャプチャ**して「Inbox」に溜める。フローを止めずに頭の中を吐き出す入口。

## スコープ
**In scope**
- OS グローバルショートカット登録（`tauri-plugin-global-shortcut`）。設定で変更可（既存 `Settings.globalHotkey` を活用）。
- ホットキー押下でウィンドウを**表示＋前面化＋フォーカス**し、クイックキャプチャ入力を開く（挙動は Q1）。
- クイックキャプチャ: 1行入力 → Enter で **Inbox** に投入。連続投入できる。Escで閉じる。
- **Inbox 盤面**: 投入先（初回に自動生成 or 既定盤面、Q2/扱いは下記）。
- 設定にホットキー変更 UI（無効化も可）。

**Out of scope（今回）**
- リッチな入力（添付・画像）。
- OS 通知からの直接操作。
- 複数ホットキー。

## Tauri 側の前提（実装注意）
- `tauri-plugin-global-shortcut` を `src-tauri/src/lib.rs` に登録、`capabilities/default.json` に権限付与。
- ウィンドウ表示/隠す/前面化は Tauri window API（`show`/`set_focus`/`hide`）。`register_global_hotkey` コマンドのスタブが既にある（要・実装差し替え）。
- **検証の制約**: グローバルホットキー＆ウィンドウ制御は **Tauri 実機ビルドでのみ動作**。ブラウザデモでは「クイックキャプチャ UI」と「Inbox 投入」までしか検証できない（ホットキー/ウィンドウは cargo check ＋ 手動確認）。

## 機能要件 (FR)
- **FR-1** 起動時に `settings.globalHotkey`（未設定なら既定）でグローバルショートカットを登録。設定変更時に再登録。OSに既に取られている等で失敗したら、保存はするがトーストで通知。
- **FR-2** ホットキー押下時の挙動（Q1）。最低限「ウィンドウ表示＋フォーカス＋キャプチャ入力にフォーカス」。
- **FR-3** クイックキャプチャ: テキスト入力＋Enterで投入、連続入力可、Escで閉じる。空入力は無視。
- **FR-4** 投入先と形式（Q2）。Inbox に蓄積。
- **FR-5** Inbox 盤面が無ければ自動生成（既定名「Inbox」、先頭付近）。既存があれば再利用（判定は名前 or 専用フラグ）。
- **FR-6** 設定でホットキー文字列を編集・無効化できる（例: `CmdOrCtrl+Shift+Space`）。
- **FR-7** ja/en 両対応。
- **FR-8** 非Tauri時はホットキー登録をスキップ（クイックキャプチャUI自体はアプリ内ボタンからも開けるようにし、デモでも確認可能にする）。

## 受け入れ基準 / DoD
- `pnpm typecheck` / SDK・core テスト / `build:vite` / `cargo check -p snipdash-desktop` が通る。
- （Tauri実機）登録したホットキーでウィンドウが前面化しキャプチャが開く。投入で Inbox に追加される。再押下で隠れる（Q1次第）。
- （ブラウザ/デモ）アプリ内トリガーからキャプチャを開き、投入で Inbox 盤面にカード/項目が増える。Escで閉じる。
- 設定でホットキー変更が保存され、再登録される（実機）。
- ja/en 表示。デモパスを壊さない。

## 制約
- Inbox 判定のためのデータ拡張が要るか要検討（例: `Board` に optional な `kind:"inbox"` や既存 `colorTag` 流用 vs 名前一致）。**optional 追加ならスキーマbump不要**（lockstep: TS＋Rust 同時、`#[serde(default)]`）。tech-lead が判断。
- 最小権限：global-shortcut プラグインの権限のみ追加。
- 投入ロジックは store アクションに集約（Inbox 解決＋カード/項目追加）。

## 人間（オーナー）への Open Questions
1. **ホットキーの挙動**: 「表示＋クイックキャプチャを開く」/「表示・非表示のトグルだけ」/「隠れていてもキャプチャだけ前面」。
2. **投入先と形式**: 「Inbox 盤面の ToDo に項目追加」/「Inbox 盤面にテキストカード追加」/「投入時にタスク/メモを切替」。
3. **既定ホットキー**: `Ctrl+Shift+Space` / `Ctrl+Alt+S` / `Ctrl+Shift+K`（いずれも設定で変更可）。
4. （確認）Inbox は**自動生成の専用盤面**でよいか（既定名「Inbox」）。

---
**次フェーズ**: 承認 → designer（キャプチャUI・Inbox表現）→ tech-lead（プラグイン/capability/Inbox判定の詳細設計）。
