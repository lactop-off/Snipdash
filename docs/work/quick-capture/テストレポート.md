# QAレポート — クイックキャプチャ＋グローバルホットキー

> フェーズ: コードレビュー＋テスト (qa) ／ 判定: **PASS（フロント）／ 実機確認待ち（ホットキー）** ／ feature slug: `quick-capture`

## コードレビュー（要点）
- スキーマ変更なし（Inbox は名前一致＋自動生成）。lockstep 非抵触。
- 投入ロジックは `store.captureToInbox` に集約（Inbox 盤面・ToDo カードを必要時に生成、アクティブ盤面は変えない）。
- Tauri 配線は `#[cfg(desktop)]` で隔離。ウィンドウ show/focus＋`quick-capture` イベント emit、setup で設定キー（既定 `CmdOrCtrl+Shift+Space`）を register。`register_global_hotkey` は unregister_all→register に差し替え。
- 非Tauri時は listen/register をスキップ。capability 追加なし（自前コマンド＋Rust側ウィンドウ操作）。
- i18n ja/en 追加。アイコン `inbox` 取得。

## 実行結果
| チェック | 結果 |
|---|---|
| `pnpm typecheck` | OK ✅ |
| `pnpm --filter @snipdash/sdk test` | 19 passed ✅ |
| `pnpm --filter @snipdash/desktop build:vite` | OK ✅ |
| `cargo check -p snipdash-desktop`（global-shortcut 配線） | Finished・警告0 ✅ |

## 実機検証（Playwright, ブラウザで可能な範囲）
| 受け入れ基準 | 結果 |
|---|---|
| アプリ内トリガー（パレット「クイックキャプチャ」）で開く | 「キャプチャ」→ コマンド一致→ モーダル表示 ✅ |
| Enter で投入、連続入力可 | 2件投入（モーダル維持） ✅ |
| Inbox 盤面が自動生成 | タブに「Inbox」出現 ✅ |
| 投入が Inbox の ToDo に入る | 「返信メールを書く」「請求書を確認する」を確認 ✅ |
| トースト通知 | 「Inbox に追加しました」×2 ✅ |
| Esc で閉じる | 閉じる ✅ |
| コンソールエラー | 0件 ✅ |

## 実機（ユーザー）でのみ確認可能な項目（未検証）
- **グローバルホットキー**（他アプリ前面時に `Ctrl+Shift+Space` でウィンドウ前面化＋キャプチャ起動）。
- 設定でホットキー変更→再登録、OS既取得時の register 失敗ハンドリング。
> これらは Tauri ランタイムが必要で、コンテナ（ヘッドレス）では起動できないため `cargo check`（コンパイル/型）までを保証。`pnpm tauri dev`/`build` での手動確認をお願いします。

**判定: フロント＝PASS、Tauri 配線＝コンパイル確認済み（実機確認待ち）。**
