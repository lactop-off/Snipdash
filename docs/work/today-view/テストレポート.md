# QAレポート — 「今日」横断タスクビュー

> フェーズ: コードレビュー＋テスト (qa) ／ 判定: **PASS** ／ feature slug: `today-view`

## コードレビュー（要点）
- スキーマ変更なし＝Rust⇄TS lockstep に非抵触（既存 `due/done` を読むだけ）。
- 集計ロジックは SDK の純粋関数 `collectDueItems`（IO無し）に分離＋単体テスト有り。
- i18n は ja/en 両方追加（`today.*`）。アイコンは lucide（`calendar-check` 追加取得）。
- パネルは canvas に重ねる配置（`.app-body` 相対、`.today-panel` 絶対）でグリッド幅計算に非干渉。
- 非Tauriデモパスでも動作（`toggleTodoItem` は保存skip時もUI反映）。

## 実行結果
| チェック | 結果 |
|---|---|
| `pnpm --filter @snipdash/sdk test`（`today.test.ts` 含む） | 13 passed ✅ |
| `pnpm typecheck` | OK ✅ |
| `pnpm --filter @snipdash/desktop build:vite` | OK ✅ |

## 実機検証（Playwright, 実操作）
| 受け入れ基準 | 結果 |
|---|---|
| ツールバーに未消化件数バッジ | **3** 表示 ✅ |
| 3分類が出る（期限切れ/今日/まもなく） | 期限切れ=メールの返信 / 今日=日報の作成 / まもなく=見積りレビュー ✅ |
| 期限なし・完了は出ない | ミーティング(完了)・期限なしは非表示 ✅ |
| 行クリックで該当盤面へジャンプ | リンク集→クリック→業務定型に切替＋カードflash ✅ |
| チェックで完了→ビューから消える | 3→2件 ✅ |
| Esc で閉じる | 閉じる ✅ |
| コンソールエラー | 0件 ✅ |

**判定: PASS。** 受け入れ基準をすべて満たし、実機で観察確認済み。残課題なし。
