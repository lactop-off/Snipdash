# Docker 開発環境

Snipdash の開発をコンテナ内のツールチェーン（Rust / Node 22 / pnpm / Tauri の Linux 依存）で完結させるための構成です。

## この環境で「できること / 向き不向き」

| 用途 | 可否 | 備考 |
|---|---|---|
| 依存のインストール・型チェック・テスト | ✅ 最適 | `cargo test` / `pnpm test` / `pnpm typecheck` |
| **ブラウザでの UI 開発**（ホットリロード） | ✅ 推奨 | Vite を `:1420` で公開、ホストのブラウザで開く（デモモード） |
| Linux 配布物（`.deb`）のビルド | ✅ 可 | `pnpm tauri build --bundles deb` |
| **ネイティブウィンドウの起動** | ⚠️ 限定的 | X11 共有が必要。WebKitGTK は GPU 描画の都合でコンテナだと不安定 |

> **方針**: Docker は「ツールチェーン・テスト・UI のブラウザ開発・Linux ビルド」に使い、最終的なネイティブ GUI の目視確認はホスト OS（macOS / Windows）で `pnpm dev` するのが最も確実です。

## 前提

- Docker Engine / Docker Desktop（Compose v2 同梱）

## 1. ビルドと起動（アプリは自動で立ち上がります）

```bash
cp .env.example .env         # 任意。無くても development で起動します
docker compose build         # または: pnpm docker:build
docker compose up -d         # コンテナ起動 → アプリが自動起動（既定: dev モード）
```

`docker compose up` でエントリポイント（`docker/entrypoint.sh`）が走り、初回は `pnpm install` を自動実行したうえで **Vite 開発サーバーを `:1420` で起動**します。ホストのブラウザで **http://localhost:1420** を開けばそのまま使えます。ログは `docker compose logs -f dev` で確認できます。

> `node_modules` と `target`、Cargo レジストリは名前付きボリュームに保存され、ホストを汚さず再起動後も再利用されます。シェルが必要なときは `docker compose exec dev bash`。ルートの package.json に `pnpm docker:build` / `docker:up` / `docker:sh` / `docker:down` のショートカットがあります。

## 2. モード切り替え（dev / 本番）

`.env` の `APP_MODE` で起動モードを管理します（`.env.example` 参照）:

| `APP_MODE`    | 起動内容 |
|---------------|----------|
| `development`（既定） | `vite`（ホットリロード付き dev サーバー）を `:1420` で起動 |
| `production`  | `vite build` 後、`vite preview` でビルド成果物を `:1420` で配信 |
| `manual`      | アプリを起動せずコンテナだけ維持（`docker compose exec dev bash` 用） |

変更後は再作成で反映します:

```bash
# .env を編集してから
docker compose up -d --force-recreate
```

> 本番モードはあくまで「フロントの本番ビルドを配信」する用途です。ネイティブ（Tauri）ウィンドウの確認は §6 / ホスト OS を参照。

## 3. テスト・型チェック

```bash
cargo test -p snipdash-core          # Rust core（ドメイン型・検証・マイグレーション）
pnpm --filter @snipdash/sdk test     # TS SDK（resolveTemplate ほか）
pnpm typecheck                       # 型チェック（SDK + フロント）
cargo check -p snipdash-desktop      # Tauri バックエンドのコンパイル確認
```

## 4. ブラウザで UI 開発（推奨）

development モードでは **§1 の `docker compose up` 時点で Vite が `:1420` で自動起動済み**です。ホスト側のブラウザで **http://localhost:1420** を開くだけで使えます。Tauri 外なので「ローカルデモモード」で動作し、サンプル盤面が表示されます（コピー/起動はブラウザのフォールバック、保存はされません）。React コンポーネント・グリッド・テーマ等の開発はこれで完結します。

`APP_MODE=manual` で起動した場合や、手動で立ち上げ直したい場合は次を実行します（`vite.config.ts` で `host:true` 設定済みなので、そのままホストに公開されます）:

```bash
pnpm --filter @snipdash/desktop dev:vite
```

## 5. Linux 配布物（.deb）をビルド

```bash
pnpm tauri build --bundles deb
# 出力: target/release/bundle/deb/Snipdash_0.1.0_amd64.deb
```

> Windows(MSI/NSIS)・macOS(dmg) は各 OS 上、または GitHub Actions のマトリクスでビルドします（生成済みの `.ico` / `.icns` がそこで使われます）。

## 6.（任意）ネイティブウィンドウを X11 で起動

**Linux ホスト**であれば、X11 ソケットを共有して実ウィンドウを起動できます。

1. `docker-compose.yml` の以下のコメントを外す:
   - `environment` の `DISPLAY` / `WEBKIT_DISABLE_COMPOSITING_MODE` / `LIBGL_ALWAYS_SOFTWARE`
   - `volumes` の `/tmp/.X11-unix:/tmp/.X11-unix:rw`
2. ホストで X11 接続を許可:
   ```bash
   xhost +local:docker
   ```
3. コンテナを再作成して起動:
   ```bash
   docker compose up -d --force-recreate
   docker compose exec dev pnpm dev
   ```

注意:
- **macOS / Windows ホスト**では XQuartz / VcXsrv 等の X サーバーが別途必要で、動作は環境依存です。
- WebKitGTK はコンテナ内のソフトウェア描画で画面が乱れる/真っ黒になることがあります（既知の制約）。安定した GUI 確認はホスト OS を推奨します。

## トラブルシューティング

- **`pnpm install` が遅い / 失敗する**: 一度 `docker compose down -v`（ボリューム削除）してから再実行。
- **ポート 1420 が開かない**: Vite を `dev:vite` で起動しているか、`docker compose ps` でポートマッピングを確認。
- **Rust ビルドが毎回フルコンパイル**: `cargo_target` ボリュームが効いているか確認（`docker volume ls`）。
