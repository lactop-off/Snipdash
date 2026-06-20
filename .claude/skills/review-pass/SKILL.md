---
name: review-pass
description: Sequential quality pass over the current Snipdash changes — (1) code review, (2) linters/type-checks (report only), (3) propose new in-app keyboard shortcuts worth registering. Use before committing or opening a PR, or when the user asks to "review pass", "review + lint", or "suggest shortcuts" for recent changes.
---

# Review pass

Run the three stages **in order** over the current changeset. This is a *reporting* pass: **do not modify, fix, or commit anything** unless the user explicitly asks afterward. Run each stage, print its findings, then move to the next. If a stage cannot run (e.g. a tool is missing), say so and continue.

If an argument is given, treat it as the scope: a git ref to diff against (e.g. `main`) or a path glob to restrict to. With no argument, use the working changes, falling back to the branch's commits.

## 0. Determine the changeset

```bash
git status --short
git diff            # unstaged working changes
git diff --staged   # staged changes
```

If the working tree is clean, diff the branch against its base instead. Confirm the base branch with `git branch` first (this repo's main branch is currently `claude/blissful-johnson-77m441`; it may differ):

```bash
base=claude/blissful-johnson-77m441   # adjust to the repo's actual main branch
git diff "$(git merge-base HEAD "$base")...HEAD"
```

List the changed files and bucket them: **TS/React** (`apps/desktop/**`, `packages/snipdash-sdk/**`) vs **Rust** (`crates/**`, `apps/desktop/src-tauri/**`). The buckets decide which stage-2 checks run and which stage-3 surfaces matter.

## Stage 1 — Code review (report only)

Prefer the built-in `/code-review` skill if it is available; pass the same scope argument. Otherwise review manually. Either way, report findings as `path:line — issue (severity)` and keep them concrete.

Weight the review toward this repo's load-bearing invariants (see `CLAUDE.md`):

- **Rust ⇄ TS lockstep.** Any domain-type change must touch *both* `crates/snipdash-core/src/model.rs` and `packages/snipdash-sdk/src/types.ts` with identical JSON shape (camelCase fields, lowercase enum tags), plus the constructors in `defaults.rs` and `factory.ts`. Flag a change that edits one side only. A *breaking* shape change also needs a `schemaVersion` bump in both files + a `migrate_vN_to_vN+1` step + tests.
- **Trust boundary.** The webview must not touch OS resources directly — new side effects go through a Tauri command in `src-tauri/src/commands.rs`, are re-validated via `snipdash-core`, and any new plugin is registered in `lib.rs` *and* granted in `capabilities/default.json`.
- **Demo-mode path.** Store/actions/commands changes must keep the non-Tauri fallback working (`tauri: false`, debounced save skipped).
- **i18n parity.** New user-facing strings need *both* `ja` and `en` entries in `apps/desktop/src/i18n.ts` (the `en` dict currently lags — flag any key present in one locale but not the other).

## Stage 2 — Lint & type-check (run, report only)

Run only the checks for the buckets that changed. **Report results; do not apply formatter or `--fix` output** — the user reviews first. The `target/` and `apps/desktop/dist/` dirs may be root-owned (Docker dev env), so redirect cargo's target dir to dodge `EACCES`.

**TS/React changed** (rebuild the SDK first if `packages/snipdash-sdk/**` changed, since the app imports its built `dist/`):

```bash
pnpm build:sdk     # only if the SDK source changed
pnpm typecheck     # tsc --noEmit across SDK + desktop
```

**Rust changed:**

```bash
CARGO_TARGET_DIR=/tmp/sd-review cargo clippy --workspace --all-targets -- -D warnings
CARGO_TARGET_DIR=/tmp/sd-review cargo fmt --all -- --check
```

If `cargo clippy` reports the component is missing, note `rustup component add clippy` and skip rather than installing silently. Summarize each tool as pass / fail with the offending `path:line` lines quoted.

## Stage 3 — Suggest registrable keyboard shortcuts (report only)

Snipdash has an in-app keyboard-shortcut subsystem. Scan the diff for **new user-facing actions** (new store actions in `store.ts`, new toolbar/menu buttons, new card operations) that a power user would want bound to a key — then *propose* bindings. Do not implement them unless asked.

The existing registry (the source of truth for conflict-checking) is the `SHORTCUTS` array in `apps/desktop/src/components/SettingsMenu.tsx`:

| Action | Binding |
|---|---|
| prev / next tab | `Ctrl`+`PageUp` / `PageDown` |
| nth tab | `Ctrl`+`1…9` |
| toggle edit/use mode | `Ctrl`+`E` |
| new tab | `Ctrl`+`T` |
| delete tab | `Ctrl`+`W` |
| open/close settings | `Ctrl`+`,` |
| rename tab | `F2` |
| close menu | `Esc` |

For each suggestion, give: the action, a proposed binding, and **whether it conflicts** with the table above (and with common browser/OS combos). Prefer free `Ctrl`+letter / `Ctrl`+`Shift`+letter slots.

For any suggestion the user accepts, registering it means editing **all four** sites consistently:

1. **Handler** — add a case to the global `keydown` listener in `apps/desktop/src/components/AppShell.tsx`. Match the existing pattern: guard `(e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey`, switch on `e.code` (e.g. `"KeyR"`, `"Comma"`), call `e.preventDefault()`, then the store action. (Component-local keys like `F2` live in their own component, e.g. `BoardTabs.tsx`.)
2. **Action** — a store action in `apps/desktop/src/store.ts` if one doesn't already exist.
3. **Help registry** — a new entry in the `SHORTCUTS` array in `SettingsMenu.tsx` (`{ label: "shortcuts.<key>", keys: [...] }`).
4. **Labels** — a `shortcuts.<key>` string in **both** `ja` and `en` dicts in `apps/desktop/src/i18n.ts`.

## Final output

A single consolidated summary: Stage 1 findings (by severity), Stage 2 pass/fail per tool, Stage 3 shortcut proposals with conflict notes. End by reminding the user that nothing was changed, and ask whether to act on any specific finding or register any proposed shortcut.
