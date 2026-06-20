# docs/work — フェーズ間ハンドオフ成果物

各機能ごとに `docs/work/<feature-slug>/` フォルダを作り、フェーズが進むごとに以下を追加していく。サブエージェントは独立コンテキストのため、**この成果物だけが唯一の引き継ぎ手段**。

```
docs/work/<feature-slug>/
├─ requirements.md   # pm        要件・受け入れ基準(DoD)・制約・人間への質問
├─ design.md         # designer  画面/状態/操作/配色/lucideアイコン名/ja-en/a11y
├─ tech-design.md    # tech-lead 変更ファイル/スキーマ影響/コマンド・権限/テスト計画/リスク
├─ review.md         # qa        設計・コードレビューの verdict と指摘
└─ test-report.md    # qa        テスト実行結果・実機検証・verdict
```

- `<feature-slug>` は英小文字ハイフン区切り（例: `tab-shortcuts`, `todo-reminders`）。
- 差し戻し（NG）時は同じファイルを更新し、「何を直したか」を追記する（履歴は git に任せる）。
- プロセス全体は [`../ai-process.md`](../ai-process.md) を参照。
