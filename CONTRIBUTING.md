# Contributing to Snipdash

Snipdash への貢献に興味を持っていただきありがとうございます！ このドキュメントは開発の進め方をまとめたものです。

## 行動規範

すべての参加者は、礼儀正しく建設的なコミュニケーションを心がけてください。

## 開発環境

- Node.js 20+ / pnpm 10+
- Rust 1.77+
- 各 OS の [Tauri 前提条件](https://tauri.app/start/prerequisites/)

```bash
pnpm install
```

## プロジェクト構成

| パッケージ | 役割 |
|---|---|
| `crates/snipdash-core` | ドメイン型・検証・直列化・マイグレーション（Rust、UI/IO 非依存） |
| `packages/snipdash-sdk` | 型定義・`resolveTemplate()`・Tauri invoke ラッパ（TS） |
| `apps/desktop` | Tauri アプリ（`src` = React フロント、`src-tauri` = Rust バックエンド） |

**設計原則**: フロントは OS リソース（ファイル/クリップボード/起動）に**直接触れず**、必ず Tauri コマンド経由でアクセスします。ドメイン検証は `snipdash-core` に集約します。

## ブランチ運用 — GitHub Flow（トランクベース）

- **トランク = `main`**。常にビルド可能・リリース可能な状態を保つ。`main` への直接 push はせず、必ず PR 経由でマージする。
- 作業は **`main` から切った短命ブランチ**で行う。1つのまとまり（1機能／1修正）ごとに PR を出し、マージ後にブランチを削除する（マージ時に自動削除）。
- **ブランチ名**は `<type>/<slug>` 形式：`feat/` 新機能・`fix/` 修正・`chore/` 雑務・`docs/` ドキュメント・`ci/` CI。
- AI チームの機能開発では **slug を `docs/work/<slug>/` と一致**させる（例：`feat/today-view` ↔ `docs/work/today-view/`）。**1ブランチ＝1機能**を原則とし、複数機能を盛り合わせない。

### 手順

1. Issue を立てる、または `good first issue` から選ぶ
2. `main` から `feat/<slug>` などのブランチを切る
3. 変更を加え、テストを追加/更新する
4. ローカルでテスト・型チェック・ビルドを通す（下記）
5. Pull Request を送る（タイトルは Conventional Commits 形式）

## テスト

```bash
# Rust core
cargo test -p snipdash-core

# TS SDK
pnpm --filter @snipdash/sdk test

# 型チェック
pnpm typecheck
```

- ロジック層（`snipdash-core` / `@snipdash/sdk`）の変更には必ずテストを添えてください。
- データ形式（`schemaVersion`）に影響する変更は、マイグレーションとテストをセットで行ってください。

## コミット / PR

- **Conventional Commits**（`feat:` `fix:` `docs:` `chore:` `ci:` …）。本文は日本語/英語どちらでも可、識別子・コメントは英語（`CLAUDE.md` 準拠）。
- **マージは squash 専用**（merge commit / rebase merge は無効）。PR 内の WIP コミットは1つに圧縮され、`main` は常に「1 PR = 1 コミット = ビルド可能」を保つ。
- **squash コミットの件名 = PR タイトル**。したがって **PR タイトルを Conventional Commits 形式**にする。
- 1 PR = 1 つの論理的な変更に絞る。
- マージ条件: PR 必須・CI があれば緑。ソロ運用ではレビュー承認は任意（self-merge 可）。複数人になればレビュー必須化を検討。
- **OS 依存の挙動**（グローバルホットキー・ウィンドウ制御など）は **Tauri 実機**（`pnpm tauri dev`）で確認する（ヘッドレス環境では `cargo check -p snipdash-desktop` まで）。
- セキュリティに関わる変更（起動対象の検証、Capability など）は、根拠を PR 説明に明記してください。

## リリース（将来）

- `main` に `vX.Y.Z` タグを打ち、`pnpm tauri build` の成果物を GitHub Release に添付する。

## ライセンス

貢献いただいたコードは [MIT ライセンス](LICENSE) の下で公開されることに同意したものとみなされます。
