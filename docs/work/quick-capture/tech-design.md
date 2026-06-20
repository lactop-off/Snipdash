# 詳細設計 — クイックキャプチャ＋グローバルホットキー

> フェーズ: 詳細設計 (tech-lead) ／ feature slug: `quick-capture` ／ 実現性: **OK（ホットキー部は実機検証前提）**

## スキーマ影響
**なし**。Inbox は**名前一致**で判定（既定名 `Inbox`）＋自動生成。`Board` への型追加はしない（lockstep churn と spacer 並行作業の競合回避）。将来 rename 耐性が欲しければ optional `kind` を追加可（その時に lockstep）。

## フロントエンド（ブラウザで検証可）
1. **`apps/desktop/src/store.ts`**: `captureToInbox(text: string): void` を追加。
   - `commit`: 名前 `Inbox` の board を探す→無ければ `createBoard("Inbox", 0)` 相当で生成し push（アクティブは変えない）。その board の最初の todo カードを探す→無ければ `createRichCard("todo")` を push（空items）。`createTodoItem(text)` を items に追加。`hideCompleted` は既存既定に従う。
2. **`apps/desktop/src/components/QuickCapture.tsx`（新規）**: `{ open, onClose }`。単一入力、Enter→`captureToInbox`＋入力クリア＋トースト、Esc/背景クリックで閉じる。`.palette` 系の軽量スタイル。
3. **`apps/desktop/src/components/AppShell.tsx`**: `captureOpen` state、Esc に追加、`<QuickCapture/>` 描画。パレット commands に「クイックキャプチャ」追加（run: open）。Tauri 実機では `@tauri-apps/api/event` の `listen("quick-capture", …)` で open（`tauri:true` 時のみ、`useEffect`）。
4. **`apps/desktop/src/components/SettingsMenu.tsx`**: グローバルホットキー入力。変更で `updateSettings({ globalHotkey })`＋（Tauri時）`registerGlobalHotkey(value)` 呼び出し。
5. **`apps/desktop/src/i18n.ts`**: `capture.*` / `cmd.quickCapture` / `settings.globalHotkey` / `inbox.name`。
6. icons: `zap`（任意, クイックキャプチャ）を取得 or `plus` 流用。

## Tauri 側（実機検証前提・cargo check で型確認）
7. **`src-tauri/Cargo.toml`**: `tauri-plugin-global-shortcut = "2"` 追加。
8. **`src-tauri/src/lib.rs`**: `#[cfg(desktop)]` でプラグイン登録。`with_handler` で `state==Pressed` 時に main window を `show()`＋`set_focus()`＋`emit("quick-capture", ())`。setup で `persistence::load` から `settings.global_hotkey`（無ければ既定 `CmdOrCtrl+Shift+Space`）を register。
9. **`src-tauri/src/commands.rs`**: `register_global_hotkey` の実装差し替え — `app.global_shortcut().unregister_all()`＋空でなければ `register(accelerator)`。失敗は `AppError`。
10. **capability**: 追加不要の想定（フロントはプラグインIPCを直接呼ばず、`register_global_hotkey` は自前コマンド／ウィンドウ操作は Rust 側）。`cargo check` で確認。
11. SDK `commands.ts` の `registerGlobalHotkey(accelerator)` は既存（`register_global_hotkey` を invoke）。

## テスト計画
- ブラウザ(Playwright): パレット「クイックキャプチャ」→入力→Enterで Inbox 盤面の ToDo に項目追加（盤面/件数で確認）→連続投入→Esc。Inbox 自動生成。
- `cargo check -p snipdash-desktop`（global-shortcut 配線のコンパイル確認）。
- typecheck / SDK・core test / build:vite。
- **実機（ユーザー）**: Ctrl+Shift+Space で前面化＋キャプチャ、設定でキー変更。

## リスク/留意
- ホットキー/ウィンドウ制御は実機のみ。OS既取得の組合せだと register 失敗→トースト通知（保存はする）。
- 非Tauri時は listen/register をスキップ（`useStore` の `tauri` フラグで分岐）。デモは UI＋Inbox のみ。
