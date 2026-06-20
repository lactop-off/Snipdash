# 要件定義 — ポモドーロ/フォーカスタイマー

> フェーズ: 要件定義 (pm) ／ 状態: **人間承認待ち** ／ feature slug: `pomodoro`

## ゴール & ユーザー価値
作業の集中とリズムを作る。Snipdash 内に**ポモドーロ・タイマー**（集中＝Work／休憩＝Break）を持ち、開始・一時停止・リセットでき、フェーズ終了を**通知**して切り替える。作業ボードに常駐する「集中の心拍」。

## スコープ
**In scope**
- Work / Break（＋必要なら Long break）のカウントダウン。Start / Pause / Reset。
- 残り時間の常時表示と、フェーズ（集中/休憩）・完了ポモドーロ数の表示。
- フェーズ終了時の通知（Tauri 通知＋アプリ内トースト）。
- 時間設定（Q1）と UI 配置（Q2）と終了時挙動（Q3）。
- ja/en 対応。

**Out of scope（今回）**
- 統計/履歴の永続集計、サウンド素材の同梱。
- 自動でアプリを最前面化（タイマーは画面内表示で十分）。
- タスク単位の累積計測（タスク連携は最小限／Q4）。

## 機能要件 (FR)
- **FR-1** Work→Break→…と進むカウントダウン。既定はクラシック（Work 25分 / Break 5分 / 4回ごとに Long break 15分）。
- **FR-2** Start / Pause(再開) / Reset(現フェーズを頭出し) / Skip(次フェーズへ) を操作できる。
- **FR-3** 残り時間（mm:ss）と現フェーズ・完了ポモドーロ数を表示。
- **FR-4** フェーズ終了で通知：Tauri 通知（実機）＋トースト（常時）。終了時の挙動は Q3。
- **FR-5** 時間設定（Q1）。設定可能にする場合は Work/Break/Long break 分＋Long break 間隔を保存。
- **FR-6** タイマーの**実行状態は揮発**（再起動で復元しない＝ephemeral）。設定（時間）は永続（Q1次第）。
- **FR-7** UI 配置（Q2）。最低限ツールバーから到達でき、コマンドパレットからも開始/停止できると良い。
- **FR-8** ja/en、デモパス維持、非Tauri時は通知をトーストのみにフォールバック。

## 受け入れ基準 / DoD
- `pnpm typecheck` / SDK・core テスト / `build:vite`（設定永続でスキーマ変更時は `cargo test -p snipdash-core`）が通る。
- Start で減り始め、Pause で止まり、Reset で頭出し、Skip で次フェーズへ。フェーズ終了でトースト＆（実機）通知。
- 完了ポモドーロ数がカウントされる。表示が ja/en で正しい。
- **実機検証（QA/Playwright）**：Start→残り時間が減る、Pause で停止、Reset/Skip、（短縮設定 or モックで）フェーズ遷移とトーストを観察。
- デモパスでも動作（通知はトースト）。

## 制約 / 設計メモ
- タイマー駆動は `setInterval`（1秒）。実行状態は zustand の非永続スライス or 専用フック（`workspace.json` には書かない）。
- 時間設定を永続化する場合：`Settings` に **optional** な `pomodoro?: { workMin, breakMin, longBreakMin, longBreakEvery }` を追加（`#[serde(default, skip_serializing_if)]`／TS は `?`）。**optional なのでスキーマbump不要**だが Rust＋TS＋defaults を同時更新（lockstep）。tech-lead 判断。
- 通知は既存 `tauri-plugin-notification` を流用（capability 既許可）。

## 人間（オーナー）への Open Questions
1. **時間設定**: 「設定で変更可能（Work/Break/Long break）」/「クラシック固定（25/5/15）」。
2. **UI 配置**: 「ツールバー常駐ウィジェット（mm:ss＋再生/一時停止）」/「専用パネルやモーダル」/「コマンドパレットから開始のみ（最小）」。
3. **フェーズ終了時**: 「通知して自動で次フェーズ開始」/「通知して停止（手動で次へ）」。
4. （任意）**タスク連携**: 標準は単体タイマー。今は紐付けなしでよいか（将来「このタスクに集中」を追加可）。

---
**次フェーズ**: 承認 → designer（タイマーUI）→ tech-lead（駆動方式・設定永続の要否）→ 実装 → QA。
