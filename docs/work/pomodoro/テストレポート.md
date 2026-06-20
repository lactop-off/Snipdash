# QAレポート — ポモドーロ/フォーカスタイマー

> フェーズ: コードレビュー＋テスト (qa) ／ 判定: **PASS** ／ feature slug: `pomodoro`

## コードレビュー（要点）
- 時間設定は `Settings.pomodoro`（optional）に永続。lockstep を TS（`PomodoroConfig`/`DEFAULT_POMODORO`）＋ Rust（`PomodoroConfig`/`Option`）＋ defaults＋core test で同時更新。スキーマ bump なし。
- 実行状態は揮発（`pomodoro.ts` の zustand ストア、`workspace.json` に書かない）。設定はストアへ同期（AppShell の effect）。
- フェーズ遷移は純ロジック（`nextPhase`/`secondsOf`）。tick=0 で自動継続＋通知。通知は `notify.ts` を汎用化（OS通知＋トースト）、`notifyReminder` は委譲。
- ウィジェットは running に同期した単一 interval。i18n ja/en、アイコンは lucide。

## 実行結果
| チェック | 結果 |
|---|---|
| `cargo test -p snipdash-core`（`pomodoro_config_roundtrips` 追加） | 13 passed ✅ |
| `pnpm typecheck` | OK ✅ |
| `pnpm --filter @snipdash/sdk test` | 19 passed ✅ |
| `pnpm --filter @snipdash/desktop build:vite` | OK ✅ |

## 実機検証（Playwright, 実操作）
| 受け入れ基準 | 結果 |
|---|---|
| ツールバーに常駐表示（mm:ss＋再生） | 25:00・集中フェーズ ✅ |
| Start で減り始める | 24:59・running ✅ |
| Pause で停止 | running=false・残り不変 ✅ |
| Reset で頭出し | 1500秒（25:00） ✅ |
| Skip で次フェーズ＋完了数 | 集中→休憩・完了1 ✅ |
| 残り0で自動遷移＋通知 | 集中→休憩・残り300・トースト「集中終了…」 ✅ |
| コンソールエラー | 0件 ✅ |

備考: フェーズ遷移/通知の検証は dev 限定で公開した `window.__pomo`（`import.meta.env.DEV` ガード、本番ビルドには出ない）で 0 秒まで進めて確認。OS ネイティブ通知自体は実機（トーストは常時）。

**判定: PASS。** 受け入れ基準を満たし実機（ブラウザ）確認済み。
