# QAレポート — コマンドパレット（Ctrl+K）

> フェーズ: コードレビュー＋テスト (qa) ／ 判定: **PASS** ／ feature slug: `command-palette`

## コードレビュー（要点）
- スキーマ変更なし＝lockstep 非抵触（読むだけ）。検索/スコアは SDK 純粋関数 `fuzzyScore`/`searchWorkspace` に分離＋単体テスト。
- アプリ操作コマンドは AppShell が state/store を閉じ込めて props 注入（パレットは UI 状態を知らない＝疎結合）。
- card/board の実行はパレット内で store＋`copyResolved` を利用。コピーは変数展開込み。
- i18n は ja/en 追加（`palette.*` / `cmd.*`）。アイコンは lucide（search/file-text/list-todo/layout-grid/corner-down-left 追加取得）。
- 新規 spacer カード種にも `searchWorkspace` が対応（linter同期済み）。
- 非Tauriデモパスでも動作。

## 実行結果
| チェック | 結果 |
|---|---|
| `pnpm --filter @snipdash/sdk test`（`search.test.ts` 含む） | 15 passed ✅ |
| `pnpm typecheck` | OK ✅ |
| `pnpm --filter @snipdash/desktop build:vite` | OK ✅ |

## 実機検証（Playwright, 実操作）
| 受け入れ基準 | 結果 |
|---|---|
| Ctrl+K で開く（空時はコマンド＋全カード） | items 14・セクション「コマンド」「カード・盤面」 ✅ |
| label/本文で絞り込み | 「署名」→ 署名カードが先頭 ✅ |
| Enter でカードをコピー（変数展開） | クリップボードに「お世話になっております。…」 ✅ |
| 盤面 hit を Enter でジャンプ | 「開発」→ アクティブ盤面が開発に ✅ |
| コマンド実行 | 「今日」→「今日を開く」→ Today パネルが開く ✅ |
| Esc で閉じる | 閉じる ✅ |
| コンソールエラー | 0件 ✅ |

**判定: PASS。** 受け入れ基準を満たし実機確認済み。
備考(任意チューニング): サブシーケンス一致が緩めで弱いノイズ候補が下位に出ることがある（閾値を上げれば抑制可能）。
