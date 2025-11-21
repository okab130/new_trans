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

## ライセンス
This project is proprietary and confidential.

## 作成者
AI駆動開発チーム

## 更新履歴
- 2025-01-20: プロジェクト初期セットアップ
