# 📘 セットアップガイド - トラック配送管理システム

このドキュメントでは、開発環境のセットアップから実際にシステムを動かすまでの手順を詳しく説明します。

## 📋 目次

1. [前提条件の確認](#前提条件の確認)
2. [データベースのセットアップ](#データベースのセットアップ)
3. [バックエンドのセットアップ](#バックエンドのセットアップ)
4. [フロントエンドのセットアップ](#フロントエンドのセットアップ)
5. [初回起動とテスト](#初回起動とテスト)
6. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件の確認

### 必要なソフトウェア

#### 1. Node.js（必須）

**バージョン**: 20.x 以上

```powershell
# インストール確認
node --version  # v20.0.0 以上

# インストールされていない場合
# https://nodejs.org/ からダウンロード
# または
winget install OpenJS.NodeJS.LTS
```

#### 2. PostgreSQL（必須）

**バージョン**: 16.x 推奨

```powershell
# インストール確認
psql --version  # PostgreSQL 16.x

# インストール方法
# 方法1: 公式サイトからダウンロード
# https://www.postgresql.org/download/windows/

# 方法2: Chocolatey使用
choco install postgresql

# 方法3: winget使用
winget install PostgreSQL.PostgreSQL
```

#### 3. Git（必須）

```powershell
# インストール確認
git --version

# インストール方法
winget install Git.Git
```

#### 4. Redis（オプション - 本番環境で推奨）

```powershell
# Windows用Redis
# https://github.com/microsoftarchive/redis/releases
# または Docker使用
docker run -d -p 6379:6379 redis:7-alpine
```

#### 5. 推奨ツール

- **Visual Studio Code**: https://code.visualstudio.com/
- **Postman**: API テスト用 https://www.postman.com/
- **pgAdmin**: PostgreSQL管理用 https://www.pgadmin.org/

---

## データベースのセットアップ

### 1. PostgreSQLの起動確認

```powershell
# PostgreSQLサービス起動確認（Windows）
Get-Service postgresql*

# 起動していない場合
Start-Service postgresql-x64-16
```

### 2. データベース作成

```powershell
# PostgreSQLに接続（パスワードを聞かれます）
psql -U postgres

# psqlプロンプトで以下を実行
CREATE DATABASE delivery_management;
CREATE USER delivery_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE delivery_management TO delivery_user;

# 確認
\l

# 接続テスト
\c delivery_management

# 終了
\q
```

### 3. 接続情報の確認

以下の情報を控えておきます：

```
ホスト: localhost
ポート: 5432
データベース名: delivery_management
ユーザー名: delivery_user
パスワード: your_password
```

---

## バックエンドのセットアップ

### 1. プロジェクトのクローン

```powershell
# GitHubからクローン
git clone https://github.com/okab130/new_trans.git
cd new_trans
```

### 2. バックエンドディレクトリへ移動

```powershell
cd backend
```

### 3. 依存関係のインストール

```powershell
# npm依存関係インストール
npm install

# インストール完了確認
npm list --depth=0
```

**予想される出力**:
```
backend@1.0.0
├── @prisma/client@5.x.x
├── express@4.x.x
├── typescript@5.x.x
└── ... その他の依存関係
```

### 4. 環境変数の設定

```powershell
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集
notepad .env
```

**.env ファイルの内容**:

```env
# データベース接続情報
DATABASE_URL="postgresql://delivery_user:your_password@localhost:5432/delivery_management?schema=public"

# アプリケーション設定
NODE_ENV=development
PORT=3000

# JWT設定（任意の秘密鍵）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Redis設定（オプション）
REDIS_URL=redis://localhost:6379

# ログ設定
LOG_LEVEL=debug
```

### 5. Prisma設定

```powershell
# Prismaクライアント生成
npx prisma generate

# データベースマイグレーション実行
npx prisma migrate dev --name init

# 実行結果の確認
npx prisma studio
```

**Prisma Studioが起動**:
- ブラウザで http://localhost:5555 が開きます
- データベーステーブルが表示されます

### 6. 初期データ投入（オプション）

サンプルデータを投入する場合：

```powershell
# seedスクリプト実行（今後実装予定）
npm run seed
```

### 7. バックエンド起動

```powershell
# 開発モードで起動
npm run dev
```

**成功時の出力**:
```
[INFO] Server is running on http://localhost:3000
[INFO] Database connected successfully
[INFO] Press CTRL+C to stop
```

### 8. 動作確認

別のターミナルで：

```powershell
# ヘルスチェック
curl http://localhost:3000/health

# 期待される出力
# {"status":"ok","timestamp":"2025-01-20T..."}
```

---

## フロントエンドのセットアップ

### 1. フロントエンドディレクトリへ移動

```powershell
# 新しいターミナルを開く
cd C:\Users\user\gh\new_trans\frontend
```

### 2. 依存関係のインストール

```powershell
# npm依存関係インストール
npm install

# インストール完了確認
npm list --depth=0
```

**予想される出力**:
```
frontend@0.0.0
├── react@18.x.x
├── @mui/material@5.x.x
├── @reduxjs/toolkit@2.x.x
└── ... その他の依存関係
```

### 3. 環境変数設定（オプション）

フロントエンドのAPIエンドポイントを設定：

```powershell
# .env.localファイル作成
notepad .env.local
```

**.env.local の内容**:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### 4. フロントエンド起動

```powershell
# 開発サーバー起動
npm run dev
```

**成功時の出力**:
```
  VITE v5.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 5. ブラウザでアクセス

ブラウザで以下を開く：
- **フロントエンド**: http://localhost:5173
- **ログイン画面が表示されます**

---

## 初回起動とテスト

### 1. システム全体の起動確認

以下のサービスが起動していることを確認：

| サービス | URL | 状態確認方法 |
|---------|-----|------------|
| PostgreSQL | localhost:5432 | `psql -U postgres -c "SELECT version();"` |
| バックエンド | http://localhost:3000 | `curl http://localhost:3000/health` |
| フロントエンド | http://localhost:5173 | ブラウザでアクセス |

### 2. APIテスト実行

```powershell
# バックエンドディレクトリで
cd backend
npm test
```

**期待される出力**:
```
 PASS  tests/api.test.ts
  ✓ Health check endpoint (50ms)
  ✓ GET /api/v1/delivery-orders (100ms)
  ✓ POST /api/v1/delivery-orders (150ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

### 3. フロントエンドの動作確認

ブラウザで http://localhost:5173 を開き：

1. **ログイン画面**が表示される
2. テストユーザーでログイン（今後実装）
3. **ダッシュボード**が表示される
4. **配送依頼一覧**をクリックして一覧表示

### 4. 画面モックアップの確認

HTMLモックアップを確認：

```powershell
# モックアップディレクトリ
cd C:\Users\user\gh\new_trans\mockups

# ブラウザで開く
start 01_login.html
start 02_dashboard.html
start 08_mobile_signature.html  # 電子サイン機能
```

---

## 開発ワークフロー

### 日常的な開発手順

```powershell
# 1. プロジェクトを開く
cd C:\Users\user\gh\new_trans

# 2. 最新コードを取得
git pull origin main

# 3. バックエンド起動（ターミナル1）
cd backend
npm run dev

# 4. フロントエンド起動（ターミナル2）
cd frontend
npm run dev

# 5. コード編集
# Visual Studio Codeなどで編集

# 6. テスト実行
npm test

# 7. コミット
git add .
git commit -m "feat: 新機能追加"
git push origin main
```

### ホットリロード

- **バックエンド**: ファイル保存時に自動再起動（nodemon使用）
- **フロントエンド**: ファイル保存時に自動リロード（Vite HMR）

---

## トラブルシューティング

### 問題1: PostgreSQLに接続できない

**エラー**: `Error: connect ECONNREFUSED`

**解決方法**:

```powershell
# PostgreSQLサービス確認
Get-Service postgresql*

# 起動していない場合
Start-Service postgresql-x64-16

# ポート確認
netstat -ano | findstr :5432

# .envファイルの確認
notepad backend\.env
# DATABASE_URLが正しいか確認
```

### 問題2: ポートが使用中

**エラー**: `Error: listen EADDRINUSE: address already in use :::3000`

**解決方法**:

```powershell
# 使用中のプロセス確認
netstat -ano | findstr :3000

# プロセス終了
taskkill /PID <PID番号> /F

# または別のポート使用
# backend/.env で PORT=3001 に変更
```

### 問題3: npm install でエラー

**エラー**: `npm ERR! code ENOENT`

**解決方法**:

```powershell
# npmキャッシュクリア
npm cache clean --force

# node_modules削除
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# 再インストール
npm install
```

### 問題4: Prismaマイグレーションエラー

**エラー**: `Error: P1001: Can't reach database server`

**解決方法**:

```powershell
# データベース接続確認
psql -U postgres -d delivery_management -c "SELECT 1"

# Prismaクライアント再生成
npx prisma generate

# マイグレーションリセット（開発環境のみ）
npx prisma migrate reset
npx prisma migrate dev
```

### 問題5: フロントエンドが真っ白

**解決方法**:

```powershell
# ブラウザのコンソールを確認（F12）
# エラーメッセージを確認

# バックエンドAPI接続確認
curl http://localhost:3000/health

# フロントエンド再起動
# Ctrl+C で停止
npm run dev
```

---

## 便利なコマンド一覧

### バックエンド

```powershell
# 開発サーバー起動
npm run dev

# テスト実行
npm test

# カバレッジ付きテスト
npm test -- --coverage

# ビルド
npm run build

# 本番起動
npm start

# Prisma Studio起動
npx prisma studio

# データベースリセット
npx prisma migrate reset
```

### フロントエンド

```powershell
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# ビルドプレビュー
npm run preview

# Lint
npm run lint

# 型チェック
npm run type-check
```

### データベース

```powershell
# PostgreSQL接続
psql -U postgres -d delivery_management

# データベース一覧
psql -U postgres -c "\l"

# テーブル一覧
psql -U postgres -d delivery_management -c "\dt"

# バックアップ
pg_dump -U postgres delivery_management > backup.sql

# リストア
psql -U postgres delivery_management < backup.sql
```

---

## 次のステップ

セットアップが完了したら：

1. **ドキュメント確認**
   - [README.md](./README.md) - プロジェクト概要
   - [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 詳細仕様
   - [TESTING.md](./TESTING.md) - テスト方法

2. **画面モック確認**
   - `mockups/` フォルダ内のHTMLファイル

3. **開発開始**
   - 新機能の実装
   - テストの追加
   - ドキュメントの更新

---

## サポート・質問

問題が解決しない場合：

1. **エラーログを確認**
   - バックエンド: ターミナル出力
   - フロントエンド: ブラウザのコンソール（F12）

2. **ドキュメント確認**
   - 各種設計ドキュメント
   - コードコメント

3. **GitHubリポジトリ**
   - https://github.com/okab130/new_trans

---

**最終更新**: 2025-01-20  
**バージョン**: 1.0.0
