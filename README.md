# Snipdash

> **自分で育てる、よく使う断片の作業ダッシュボード。**
> テキスト断片・リンク・ファイル起動などの「よく使うもの」をグリッド上のカードとして並べ、**ワンクリックでコピー／起動**できる軽量・ローカル保存のデスクトップアプリ。

Snipdash は、メモ帳の軽さと Notion のブロック表現の中間に位置するツールです。クリップボード履歴ツールのように「自動で溜める」のではなく、**自分で能動的にキュレーションした盤面**を育てていく発想です。

- 🗂 **複数盤面をタブで切替** — 用途別に盤面を作って整理
- 🧩 **グリッドにスナップ配置** — カードを追加・移動・リサイズ
- 📋 **3種のカード** — テキストスニペット / リンク・ファイル起動 / リッチ（Markdown・コード・ToDo）
- ✨ **テンプレート変数** — `{{TODAY}}` などをコピー時に展開
- 🔒 **完全ローカル・軽量** — Tauri 製。データはプレーンな JSON。テレメトリ無し
- 🌓 **ライト/ダークテーマ**・日本語/英語

> ステータス: **v1 開発中**。詳細仕様は [`docs/spec.md`](docs/spec.md) を参照してください。

---

## スクリーンショット

> （リリース時に追加予定）

---

## リポジトリ構成（モノレポ）

「完成アプリ」と「再利用可能な部品」を両立させるモノレポ構成です。

```
snipdash/
├─ apps/
│  └─ desktop/            # Tauri アプリ（配布物）
│     ├─ src/             # React + TypeScript フロント
│     └─ src-tauri/       # Rust（commands, services）
├─ crates/
│  └─ snipdash-core/      # ★再利用可能な Rust クレート（ドメイン型・検証・直列化・マイグレーション）
├─ packages/
│  └─ snipdash-sdk/       # ★TS SDK（型定義・invoke ラッパ・resolveTemplate）
├─ docs/spec.md           # 仕様書（要件定義 → 詳細設計）
├─ LICENSE                # MIT
└─ README.md
```

- **`snipdash-core`**（Rust クレート）と **`@snipdash/sdk`**（TS パッケージ）は独立して再利用できる「部品」として設計しています。

---

## 開発

### 必要なもの

- [Node.js](https://nodejs.org/) 20+ と [pnpm](https://pnpm.io/) 10+
- [Rust](https://www.rust-lang.org/) 1.77+（`cargo`）
- 各 OS の Tauri 前提条件 — [Tauri prerequisites](https://tauri.app/start/prerequisites/) を参照
  - Windows: Microsoft C++ Build Tools, WebView2
  - macOS: Xcode Command Line Tools
  - Linux: `webkit2gtk-4.1`, `libgtk-3-dev` ほか（開発用）

### セットアップ

```bash
pnpm install
```

> 🐳 **Docker で開発したい場合** は [`docs/docker.md`](docs/docker.md) を参照してください。テスト・型チェック・ブラウザでの UI 開発・Linux 配布物ビルドをコンテナ内で完結できます（`pnpm docker:build && pnpm docker:up && pnpm docker:sh`）。

### よく使うコマンド

| コマンド | 内容 |
|---|---|
| `pnpm dev` | デスクトップアプリを開発モードで起動（Tauri dev） |
| `pnpm build` | SDK とフロントをビルド |
| `pnpm tauri build` | 配布物（インストーラ）をビルド |
| `pnpm test` | TS のテスト（SDK ほか） |
| `pnpm test:core` | Rust core のテスト（`cargo test`） |
| `pnpm typecheck` | TypeScript 型チェック |

### テストだけを回す（GUI 不要）

WebView/GUI のシステム依存が無い環境でも、ロジック層のテストは実行できます。

```bash
cargo test -p snipdash-core   # Rust: ドメイン型・検証・マイグレーション
pnpm --filter @snipdash/sdk test   # TS: resolveTemplate ほか
```

---

## データの保存場所

| OS | パス |
|---|---|
| Windows | `%APPDATA%\Snipdash\workspace.json` |
| macOS | `~/Library/Application Support/Snipdash/workspace.json` |
| Linux | `~/.config/Snipdash/workspace.json` |

- 単一の JSON ファイルに永続化します。任意で Dropbox/iCloud 等の同期フォルダに置けます（公式同期は v1 非対応）。
- 保存はアトミック（temp → rename）で、`workspace.json.bak` を直近3世代ローテーションします。

---

## テンプレート変数

テキスト/リッチ（Markdown・コード）カードの本文に `{{...}}` を埋め込むと、**使用モードでコピーした瞬間に展開**されます。保存される本文はトークンのまま（再利用可能）。

| 変数 | 展開結果 | 例 |
|---|---|---|
| `{{TODAY}}` | 当日の日付（既定 `YYYY-MM-DD`） | `{{TODAY:YYYY/MM/DD}}` |
| `{{NOW}}` | 現在日時（既定 `YYYY-MM-DD HH:mm`） | `{{NOW:HH:mm:ss}}` |
| `{{TIME}}` | 現在時刻（既定 `HH:mm`） | |
| `{{YEAR}}` `{{MONTH}}` `{{DAY}}` | 年/月/日 | |
| `{{UUID}}` | ランダムな UUIDv4 | |

`\{{` でエスケープできます。未知の変数はそのまま残ります。

---

## ライセンス

[MIT](LICENSE) © 2026 Snipdash contributors

貢献方法は [CONTRIBUTING.md](CONTRIBUTING.md) を参照してください。
