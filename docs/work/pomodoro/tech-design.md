# 詳細設計 — ポモドーロ/フォーカスタイマー

> フェーズ: 詳細設計 (tech-lead) ／ feature slug: `pomodoro` ／ 実現性: **OK**

## スキーマ影響
**optional 追加（bump 不要）**だが lockstep（Rust＋TS＋defaults）。時間設定のみ永続、実行状態は揮発。

### SDK / Rust（lockstep）
1. **`packages/snipdash-sdk/src/types.ts`**:
   - `export interface PomodoroConfig { workMin: number; breakMin: number; longBreakMin: number; longBreakEvery: number }`
   - `Settings` に `pomodoro?: PomodoroConfig`
   - `export const DEFAULT_POMODORO: PomodoroConfig = { workMin: 25, breakMin: 5, longBreakMin: 15, longBreakEvery: 4 }`
2. **`crates/snipdash-core/src/model.rs`**: `PomodoroConfig`（`#[serde(rename_all="camelCase")]`, `u32`×4）＋ `Settings` に `#[serde(default, skip_serializing_if="Option::is_none")] pub pomodoro: Option<PomodoroConfig>`。
3. **`crates/snipdash-core/src/defaults.rs`**: `pomodoro: None`。
4. **`crates/snipdash-core/src/lib.rs`（tests）**: workspace に `pomodoro` を設定→`to_pretty_json`→`load_from_str` で round-trip 保持を検証（optional・camelCase 確認）。

## フロントエンド
5. **`apps/desktop/src/pomodoro.ts`（新規・zustand 揮発ストア）**:
   - state: `phase: "work"|"break"|"longBreak"`, `remaining: number`(秒), `running: boolean`, `completed: number`, `config: PomodoroConfig`
   - actions: `start/pause/reset/skip/tick/setConfig`。`durationOf(phase)` = config 分×60。
   - `advance()`: work 終了で `completed++`、`completed % longBreakEvery === 0 ? longBreak : break`、break/long 終了→work。`remaining=duration(next)`。
   - `tick()`: `remaining-1`; 0 到達で `advance()`＋`notify(phaseEndTitle, body)`（自動継続のため running 維持）。
   - `setConfig(c)`: config 更新。停止中なら現フェーズ remaining を再計算。
   - dev のみ `(window as any).__pomo = usePomodoro`（QA 用、`import.meta.env.DEV` ガード）。
6. **`apps/desktop/src/notify.ts`**: 汎用 `export async function notify(title, body?)` を追加し、`notifyReminder` はそれに委譲。
7. **`apps/desktop/src/components/PomodoroWidget.tsx`（新規）**: ツールバー表示。`running` の間 `useEffect`＋`setInterval(tick,1000)`。クリックでポップオーバー（開始/一時停止・リセット・スキップ・フェーズ・完了数）。
8. **`apps/desktop/src/components/AppShell.tsx`**: ツールバーに `<PomodoroWidget/>`。`useEffect` で `settings.pomodoro ?? DEFAULT_POMODORO` を `setConfig` 同期。
9. **`apps/desktop/src/components/SettingsMenu.tsx`**: ポモドーロ時間入力（work/break/longBreak/every）→ `updateSettings({ pomodoro })`。
10. **`apps/desktop/src/i18n.ts`**: `pomo.*` / `settings.pomodoro*`（ja/en）。
11. icons: `play`/`pause`/`rotate-ccw`/`skip-forward`/`coffee`（取得済み）。

## テスト計画
- `cargo test -p snipdash-core`（pomodoro round-trip 追加）。
- typecheck / SDK vitest / build:vite。
- Playwright: Start→減少、Pause→停止、Reset→頭出し、Skip→`work`→`break`＋completed、`__pomo` で remaining=1→tick→自動遷移＋トースト。OS通知は実機。

## リスク/留意
- 実行状態を永続しない（再起動でリセット）。設定変更は停止中のみ remaining に反映（実行中は次フェーズから反映）。
- interval はウィジェット側で running に同期（多重起動しない）。
