# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Snipdash is a local-first, grid-based "snippet dashboard" desktop app (Tauri + React + Rust). Cards (text / rich markdown / code / todo) are arranged on a 12-column grid across tab-switchable boards, copied or launched in one click. All data is a single local `workspace.json`; there is no backend or network.

## Commands

Dev requires the Tauri prerequisites and a working WebView/GUI. The logic layers (`snipdash-core`, `@snipdash/sdk`) are testable headlessly without them.

```bash
pnpm install                       # bootstrap the pnpm workspace
pnpm dev                           # run the desktop app (tauri dev)
pnpm build                         # build the SDK then the frontend
pnpm tauri build                   # build distributable installers
pnpm typecheck                     # tsc --noEmit across SDK + desktop

# Tests
pnpm test                          # all JS/TS tests (recursive)
pnpm test:core                     # cargo test -p snipdash-core
pnpm --filter @snipdash/sdk test   # SDK (vitest) only
cargo test -p snipdash-core roundtrip_serialization_is_stable   # a single Rust test
pnpm --filter @snipdash/sdk test -- -t "unknown variables"      # a single vitest by name
```

- **After editing `packages/snipdash-sdk/src/**`, run `pnpm build:sdk`.** The desktop app imports the SDK's built `dist/`, not its source, so source edits are invisible until rebuilt. SDK tests/typecheck run against source and don't need this.
- **Build-dir permission gotcha:** `target/` and `apps/desktop/dist/` may be owned by `root` (left by the Docker dev env), causing `cargo`/`vite` to fail with `EACCES`/`Permission denied`. Either `sudo chown -R "$USER" target apps/desktop/dist`, or redirect: `CARGO_TARGET_DIR=/tmp/sd-target cargo …` and `vite build --outDir /tmp/sd-dist --emptyOutDir`. Typechecks and `cargo check` (with a redirected target) are unaffected.

## Architecture

Three-layer monorepo: two reusable, IO-free "parts" (`snipdash-core`, `@snipdash/sdk`) wrapped by one app (`apps/desktop`). Rust workspace members are in the root `Cargo.toml`; JS packages are globbed by `pnpm-workspace.yaml` (`apps/*`, `packages/*`).

### The Rust ⇄ TS lockstep contract (most important)

The domain model is defined **twice** and the two must stay byte-identical in their JSON shape, because that serde JSON **is** both the on-disk format and the IPC payload:

- `crates/snipdash-core/src/model.rs` — Rust structs/enums (camelCase via `serde(rename_all)`, lowercase enum tags, internally-tagged unions like `Card`/`RichPayload`).
- `packages/snipdash-sdk/src/types.ts` — the mirror TypeScript types.

When changing a domain type, **edit both files plus their constructors** (`crates/snipdash-core/src/defaults.rs` and `packages/snipdash-sdk/src/factory.ts`). Adding an *optional* field (`#[serde(default, skip_serializing_if = …)]` on the Rust side, `?` on the TS side) is backward-compatible and does **not** require a schema bump — old `workspace.json` files still load.

### Schema versioning & persistence

`CURRENT_SCHEMA_VERSION` lives in both `model.rs` and `types.ts`. Loading always flows through `migrate.rs::load_from_value`: read `schemaVersion` → run stepwise migrations on the **raw `serde_json::Value`** (before deserialization, so a step can reshape data that no longer matches the current model — e.g. the v1→v2 step rewrote the removed `launcher` card into a markdown card) → deserialize → `validate.rs::validate_workspace`. Unknown fields are ignored (forward-compatible). A breaking shape change needs: bump the version in both files, add a `migrate_vN_to_vN+1` step, and add tests.

`apps/desktop/src-tauri/src/persistence.rs` owns IO: writes are atomic (temp → rename) with a 3-generation `.bak` rotation; a corrupt file is restored from backup or quarantined to `.json.corrupt` while a fresh workspace is seeded. Data path is the OS app-data dir under `Snipdash/`.

### Trust boundary

The webview never touches OS resources directly. Every side effect (file IO, clipboard, opening URLs/paths, always-on-top, notifications) goes through a Tauri command in `apps/desktop/src-tauri/src/commands.rs`, typed on the TS side by `packages/snipdash-sdk/src/commands.ts`. Security-relevant input (launch targets) is **re-validated** server-side via `snipdash-core` regardless of what the frontend sent. The webview's capability is least-privilege (`apps/desktop/src-tauri/capabilities/default.json`) — there is no fs plugin exposed; adding a new plugin means registering it in `src-tauri/src/lib.rs` **and** granting its permission in `default.json`.

### Frontend state

A single Zustand store (`apps/desktop/src/store.ts`) holds the entire `Workspace`. All mutations go through a `commit()` helper that `structuredClone`s the workspace, applies the change, and schedules a **debounced (400ms) save** via the SDK. Outside Tauri (browser/demo, or when `loadWorkspace` throws) the store falls back to an in-memory `sampleWorkspace()` with `tauri: false`, and saves are skipped — keep this demo path working when touching store/actions/commands.

Cards render through `CardFrame` → `TextCard`/`RichCard` (→ `MarkdownView`/`CodeView`/`TodoView`). The grid is `react-grid-layout` in `GridCanvas`; interactive controls inside cards need the `rgl-cancel` class to avoid starting a drag.

### Template variables

`packages/snipdash-sdk/src/template.ts` (`resolveTemplate`) expands `{{TODAY}}`, `{{NOW}}`, `{{UUID}}`, etc. **at copy time only** (see `apps/desktop/src/actions.ts`); stored card bodies always keep the raw tokens so they stay reusable. `\{{` escapes; unknown variables are left intact and surfaced to the user.

## Conventions

- Logic-layer changes (`snipdash-core` / `@snipdash/sdk`) must come with tests; data-format changes must come with a migration + tests.
- Comments and identifiers are in English; user-facing strings are bilingual via `apps/desktop/src/i18n.ts` (`ja`/`en` dicts + `translator`). Add both locales for any new UI string.
- The detailed product spec is `docs/spec.md`; Docker dev workflow is `docs/docker.md`.
- Icons come from Iconify (lucide): SVGs are downloaded into `apps/desktop/src/assets/icons/` and inlined via `apps/desktop/src/components/Icon.tsx` (they use `currentColor`). Don't hand-author icon SVGs or pull icons at runtime.

## Branch / PR workflow

Full rules in `CONTRIBUTING.md`. Key points (agents must follow these too):
- Trunk is **`main`**. Work on a short-lived branch cut from `main`; merge **only via PR** (never push to `main` directly).
- Branch names: `feat|fix|chore|docs|ci/<slug>`. For feature work, the slug **matches `docs/work/<slug>/`**, one feature per branch.
- **Merge is squash-only.** The PR title becomes the squash commit subject, so write **PR titles in Conventional Commits** form (`feat: …`). `main` stays "1 PR = 1 commit = buildable".
- Before merging, confirm typecheck / tests / build are green (OS-dependent behavior — global hotkey, window control — verified on a real Tauri build, not the headless container).

## AI engineering team (subagents)

This repo defines a 5-role AI team in `.claude/agents/` — `pm`, `designer`, `tech-lead`, `coder`, `qa` — driven through the phased process in `docs/ai-process.md`:

要件定義(pm) → [human approval] → 基本設計(designer) → 設計レビュー(qa+tech-lead) → 詳細設計(tech-lead) → 実装(coder) → コードレビュー(qa) → テスト(qa, executed) → [human acceptance]

Key rules: QA is an independent gate that **verifies by execution** (typecheck/tests/build + Playwright), NG sends work back to the prior phase (max 3 iterations, then escalate to the human), and every phase hands off via a file under `docs/work/<feature>/` (subagents don't share context). All agents read this `CLAUDE.md` for conventions first.

