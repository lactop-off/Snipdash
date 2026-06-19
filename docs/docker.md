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

## 1. ビルドと起動

```bash
docker compose build        # または: pnpm docker:build
docker compose up -d         # コンテナを起動（バックグラウンド）
docker compose exec dev bash # コンテナ内のシェルへ
```

> ルートの package.json に `pnpm docker:build` / `docker:up` / `docker:sh` / `docker:down` のショートカットを用意しています。

## 2. 初回セットアップ（コンテナ内）

```bash
pnpm install
```

`node_modules` と `target`、Cargo レジストリは名前付きボリュームに保存され、ホストを汚さず再起動後も再利用されます。

## 3. テスト・型チェック

```bash
cargo test -p snipdash-core          # Rust core（ドメイン型・検証・マイグレーション）
pnpm --filter @snipdash/sdk test     # TS SDK（resolveTemplate ほか）
pnpm typecheck                       # 型チェック（SDK + フロント）
cargo check -p snipdash-desktop      # Tauri バックエンドのコンパイル確認
```

## 4. ブラウザで UI 開発（推奨）

コンテナ内で Vite を起動します（`vite.config.ts` で `host:true` 設定済みなので、そのままホストに公開されます）:

```bash
pnpm --filter @snipdash/desktop dev:vite
```

ホスト側のブラウザで **http://localhost:1420** を開きます。Tauri 外なので「ローカルデモモード」で動作し、サンプル盤面が表示されます（コピー/起動はブラウザのフォールバック、保存はされません）。React コンポーネント・グリッド・テーマ等の開発はこれで完結します。

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
