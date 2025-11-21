# トラック配送計画・配送実績追跡システム

物流企業向けのトラック配送管理システムです。配送計画の作成、ルート最適化、リアルタイム追跡、実績管理をサポートします。

## プロジェクト構成

```
new_trans/
├── backend/          # Node.js + Express + Prisma
├── frontend/         # React + Redux + MUI
├── database/         # データベーススキーマ
├── mockups/          # HTMLモックアップ
└── docs/             # 設計ドキュメント
```

## 技術スタック

### バックエンド
- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL 16.x
- **Cache**: Redis
- **Language**: TypeScript

### フロントエンド
- **Framework**: React 18.x
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI v5
- **Build Tool**: Vite
- **Language**: TypeScript

## セットアップ

### 前提条件
- Node.js 20.x 以上
- PostgreSQL 16.x
- Redis 7.x

### バックエンドセットアップ

```bash
cd backend

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .env を編集してデータベース接続情報を設定

# Prismaマイグレーション実行
npx prisma migrate dev

# サーバー起動（開発モード）
npm run dev
```

### フロントエンドセットアップ

```bash
cd frontend

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

### アクセス
- バックエンド: http://localhost:3000
- フロントエンド: http://localhost:5173

## データベースセットアップ

### PostgreSQLインストール（Windows）

```powershell
# PostgreSQL公式サイトからインストーラーをダウンロード
# または Chocolatey を使用
choco install postgresql

# データベース作成
psql -U postgres
CREATE DATABASE delivery_management;
```

### Prismaマイグレーション

```bash
cd backend

# Prismaクライアント生成
npm run prisma:generate

# マイグレーション実行
npm run prisma:migrate

# Prisma Studioで確認
npm run prisma:studio
```

## API ドキュメント

### 認証
- `POST /api/v1/auth/login` - ログイン
- `POST /api/v1/auth/logout` - ログアウト

### 配送依頼
- `GET /api/v1/delivery-orders` - 一覧取得
- `GET /api/v1/delivery-orders/:id` - 詳細取得
- `POST /api/v1/delivery-orders` - 新規作成
- `PUT /api/v1/delivery-orders/:id` - 更新
- `DELETE /api/v1/delivery-orders/:id` - 削除
- `GET /api/v1/delivery-orders/stats` - 統計情報取得

## テスト

### バックエンドテスト

```bash
cd backend

# 全テスト実行
npm test

# カバレッジ付きテスト
npm test -- --coverage

# ウォッチモード
npm run test:watch
```

### フロントエンドテスト

```bash
cd frontend

# テスト実行
npm test

# UI付きテスト
npm run test:ui
```

## ビルド

### バックエンド

```bash
cd backend
npm run build
npm start
```

### フロントエンド

```bash
cd frontend
npm run build
npm run preview
```

## 主要機能

### 配車担当者向け
✅ 配送依頼の登録・管理
✅ 配車計画の作成
✅ ルート最適化
✅ リアルタイム進捗モニター
✅ KPIダッシュボード

### ドライバー向け（モバイル）
✅ 当日の配送計画確認
✅ ナビゲーション連携
✅ 配送実績入力
✅ 電子サイン取得
✅ 配送証跡（写真）撮影

### 管理者向け
✅ 実績レポート
✅ パフォーマンス分析
✅ マスタ管理

## 開発ガイドライン

### コーディング規約
- ESLint + Prettier を使用
- コミットメッセージは Conventional Commits 形式
- TypeScript strict mode 有効

### Git ワークフロー
```bash
# feature ブランチ作成
git checkout -b feature/new-feature

# 開発・テスト

# コミット
git commit -m "feat: 新機能追加"

# プッシュ
git push origin feature/new-feature

# Pull Request 作成
```

## トラブルシューティング

### ポートが使用中
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Unix
lsof -ti:3000 | xargs kill
```

### Prisma接続エラー
```bash
# Prismaクライアント再生成
npx prisma generate

# データベース接続確認
npx prisma db pull
```

## 📚 ドキュメント

このプロジェクトには以下の詳細ドキュメントが用意されています：

| ドキュメント | 説明 |
|------------|------|
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | 詳細なセットアップ手順（初心者向け） |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | 完全なAPI仕様書 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 本番環境デプロイ手順 |
| [TESTING.md](./TESTING.md) | テスト実行方法 |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | プロジェクト全体サマリー |
| [FAQ.md](./FAQ.md) | よくある質問 |
| [GITHUB_UPLOAD.md](./GITHUB_UPLOAD.md) | GitHubアップロード手順 |

### 設計ドキュメント

| ドキュメント | 説明 |
|------------|------|
| [01_要件定義・前提条件.md](./01_要件定義・前提条件.md) | 業務要件・システム要件 |
| [02_データモデル設計.md](./02_データモデル設計.md) | ERD・テーブル定義（17テーブル） |
| [03_運用フロー・機能概要設計.md](./03_運用フロー・機能概要設計.md) | 業務フロー・機能詳細 |
| [04_画面一覧・画面詳細設計.md](./04_画面一覧・画面詳細設計.md) | 全39画面の仕様 |
| [05_技術仕様・アーキテクチャ設計.md](./05_技術仕様・アーキテクチャ設計.md) | 技術選定・実装方針 |

### 画面モックアップ

`mockups/` フォルダに9つのHTMLモックアップがあります：
- Web版: 5画面（ログイン、ダッシュボード、配送依頼一覧、配車計画、進捗モニター）
- モバイル版: 3画面（配送計画、実績入力、電子サイン）
- 管理画面: 1画面（KPIダッシュボード）

詳細は [mockups/README.md](./mockups/README.md) を参照してください。

## 🚀 クイックスタート

### 簡易セットアップ（経験者向け）

```bash
# リポジトリクローン
git clone https://github.com/okab130/new_trans.git
cd new_trans

# バックエンド起動
cd backend
npm install
cp .env.example .env
# .env編集してデータベース接続情報を設定
npx prisma migrate dev
npm run dev

# フロントエンド起動（別ターミナル）
cd ../frontend
npm install
npm run dev
```

### 詳細な手順

初めての方は [SETUP_GUIDE.md](./SETUP_GUIDE.md) を参照してください。

## ライセンス
This project is proprietary and confidential.

## 作成者
AI駆動開発チーム

## 🔗 リンク

- **GitHubリポジトリ**: https://github.com/okab130/new_trans
- **Issue報告**: https://github.com/okab130/new_trans/issues

## 更新履歴
- 2025-01-20: プロジェクト初期セットアップ
- 2025-01-20: 完全なドキュメント追加（セットアップ、API、デプロイ、FAQ）
