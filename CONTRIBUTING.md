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

## ワークフロー

1. Issue を立てる、または `good first issue` から選ぶ
2. ブランチを切る（例: `feat/launcher-card`）
3. 変更を加え、テストを追加/更新する
4. ローカルでテストを通す（下記）
5. Pull Request を送る

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

- コミットメッセージは簡潔かつ説明的に（日本語/英語どちらでも可）。
- 1 PR = 1 つの論理的な変更を心がけてください。
- セキュリティに関わる変更（起動対象の検証、Capability など）は、根拠を PR 説明に明記してください。

## ライセンス

貢献いただいたコードは [MIT ライセンス](LICENSE) の下で公開されることに同意したものとみなされます。
