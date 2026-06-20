# 詳細設計 — 「今日」横断タスクビュー

> フェーズ: 詳細設計 (tech-lead) ／ feature slug: `today-view` ／ 実現性: **OK**

## スキーマ影響
**なし**。既存の `due` / `done` 等を**読むだけ**の派生集計。`CURRENT_SCHEMA_VERSION` 据え置き、Rust 変更なし、migrate 不要。→ Rust⇄TS lockstep に触れない。

## 変更/新規ファイル
1. **`packages/snipdash-sdk/src/today.ts`（新規・純粋関数, テスト付き）**
   - `export interface DueEntry { item: TodoItem; cardId: string; cardLabel?: string; boardId: string; boardName: string; bucket: "overdue" | "today" | "soon"; }`
   - `export function collectDueItems(ws: Workspace, now: number, soonWindowMs = 3_600_000): { overdue: DueEntry[]; today: DueEntry[]; soon: DueEntry[] }`
   - 走査: 全 boards → `card.type==="rich" && payload.mode==="todo"` → `items` で `!done && due`。`Date.parse(due)` を `t` とし分類:
     - `t <= now` → overdue
     - `t - now <= soonWindowMs` → soon
     - `t <= endOfToday(now)`（ローカル当日 23:59:59.999）→ today
     - それ以外（明日以降）→ 除外
   - 各 bucket を `due` 昇順ソート。`endOfToday` はローカルタイムで算出。
   - `index.ts` から re-export。
2. **`packages/snipdash-sdk/src/today.test.ts`（新規 vitest）**: 境界（過去/今ちょうど/soon内外/今日終端/明日）と done/期限なし除外を検証。
3. **`apps/desktop/src/store.ts`**: `AppState` に追加
   - `flashCardId: string | null` ＋ `flashCard(id: string): void`（`set` 後 setTimeout 1500ms で解除）
   - `toggleTodoItem(cardId: string, itemId: string): void`（全 boards 探索して該当 item の `done` を反転、`commit` 経由で保存）
4. **`apps/desktop/src/components/TodayPanel.tsx`（新規）**: `collectDueItems(workspace, Date.now())` を購読表示。行チェック→`toggleTodoItem`、行クリック→`setActiveBoard(boardId)`＋`flashCard(cardId)`。`open`/`onClose` を props で受ける。
5. **`apps/desktop/src/components/AppShell.tsx`**: `const [todayOpen,setTodayOpen]=useState(false)`、ツールバーにトグルボタン（`calendar-check`＋件数バッジ=overdue+today+soon件数）、`<TodayPanel open={todayOpen} onClose={...} />`。Esc ハンドラに `setTodayOpen(false)` 追加。
6. **`apps/desktop/src/components/GridCanvas.tsx`**: `flashCardId` を購読し、一致する `grid-item` に `flash` クラス付与（CSS パルス）。
7. **`apps/desktop/src/styles.css`**: `.today-panel`（右ドロワー/slide-in）, セクション, 行, 期限pill流用, `.grid-item.flash` パルス。
8. **`apps/desktop/src/i18n.ts`**: `today.*` キー（ja/en）。
9. **icons**: `calendar-check` を Iconify から取得して `assets/icons/` に追加。

## テスト計画
- 単体: `today.test.ts`（分類境界）。
- QA(実機/Playwright): 期限付き todo を複数盤面に用意 → トグルでパネル開 → 3分類と件数 → チェックで行が消える → 行クリックで盤面が切替＋カードflash → 0件で空状態 → Esc で閉じる。
- 既定の緑化: `pnpm typecheck` / SDK vitest / `build:vite`。

## リスク/留意
- パネルは canvas に**重ねる**（`position: fixed/absolute` 右寄せ）ので grid の幅計算（`GridCanvas` の整数セル化）に影響させない。
- `flashCard` の setTimeout は store 内で完結（解除時に同一idのみクリア）。
- デモパス: `toggleTodoItem` は `commit`→保存 skip(tauri:false) でも UI 上は反映される。
