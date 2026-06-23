# 基本設計 — ポモドーロ/フォーカスタイマー

> フェーズ: 基本設計 (designer) ／ feature slug: `pomodoro`

## 決定事項（承認済み）
- 時間: **設定で変更可能**（Work / Break / Long break 分＋Long break 間隔）。永続。
- UI: **ツールバー常駐ウィジェット**（mm:ss＋再生/一時停止）。
- フェーズ終了: **通知して自動で次フェーズ開始**。
- タスク連携: なし（単体タイマー）。

## ツールバー・ウィジェット
```
[●25:00 ▶]   ← 集中=accentドット, mm:ss, 再生/一時停止トグル
   └ クリックでポップオーバー:
      集中 / 休憩 / 長い休憩  (現フェーズ強調)
      [▶/⏸ 開始/一時停止] [⟲ リセット] [⤳ スキップ]
      完了: ●●●○ (今サイクルのポモ数)
```
- 実行中は再生→一時停止アイコンに切替。フェーズで色を変える（Work=accent、Break/Long=緑系）。
- 残り0で**自動的に次フェーズへ**（通知＋トースト）。Reset=現フェーズ頭出し、Skip=次フェーズへ。

## 通知
- `notify.ts` を汎用化（`notify(title, body)`）し、フェーズ終了時に **OS通知（実機）＋トースト（常時）**。
  - 例: 「集中終了 — 休憩しましょう」/ 「休憩終了 — 集中を再開」。

## 設定（SettingsMenu）
- 「ポモドーロ」セクション: Work / Break / Long break（分）と Long break 間隔（回）の数値入力。`updateSettings({ pomodoro })` で保存。

## アイコン（lucide）
`play` / `pause`（再生・一時停止）、`rotate-ccw`（リセット）、`skip-forward`（スキップ）、`coffee`（休憩フェーズ）、`timer` は未使用（ドットで表現）。

## 文言（ja/en）
- `pomo.work` 集中 / Focus、`pomo.break` 休憩 / Break、`pomo.longBreak` 長い休憩 / Long break
- `pomo.start` 開始 / Start、`pomo.pause` 一時停止 / Pause、`pomo.reset` リセット / Reset、`pomo.skip` スキップ / Skip
- `pomo.completed` 完了 / Completed
- `pomo.notify.workEnd` 集中終了 — 休憩しましょう / Focus done — take a break
- `pomo.notify.breakEnd` 休憩終了 — 集中を再開 / Break over — back to focus
- 設定: `settings.pomodoro` ポモドーロ、`settings.pomodoro.work/break/longBreak/every`

## 検証メモ
- 駆動は `setInterval`(1s)。実行状態は**揮発**（workspace.json に書かない）。時間設定のみ永続。
- QA: Start で減る・Pause で停止・Reset 頭出し・Skip 遷移・残り0で自動遷移＋トースト（dev で store を露出して 0 まで進めて確認）。OS通知は実機。
