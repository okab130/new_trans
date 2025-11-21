# テスト実行ガイド

## バックエンドテスト

### テストの実行

```bash
cd backend

# 全テスト実行
npm test

# カバレッジレポート付き
npm test -- --coverage

# 特定のテストファイル実行
npm test -- api.test.ts

# ウォッチモード
npm run test:watch
```

### テスト結果の確認

テスト実行後、以下が表示されます：
- ✅ 成功したテスト
- ❌ 失敗したテスト
- カバレッジレポート（coverage/ディレクトリ）

### テストケース

#### 配送依頼API
- `GET /api/v1/delivery-orders` - 一覧取得
- `GET /api/v1/delivery-orders/:id` - 詳細取得
- `POST /api/v1/delivery-orders` - 新規作成
- `GET /api/v1/delivery-orders/stats` - 統計情報

#### 認証API
- `POST /api/v1/auth/login` - ログイン
- `POST /api/v1/auth/logout` - ログアウト

#### ヘルスチェック
- `GET /health` - サーバー状態確認

## フロントエンドテスト

### テストの実行

```bash
cd frontend

# テスト実行
npm test

# UI付きテスト
npm run test:ui

# カバレッジ
npm test -- --coverage
```

## 統合テスト

### データベース接続テスト

```bash
cd backend

# Prismaで接続確認
npx prisma db pull

# テストデータ投入
npm run seed
```

### E2Eテスト（今後の実装）

```bash
# Playwright使用
npm run test:e2e
```

## CI/CDパイプライン

GitHub Actionsで自動テスト：
- プルリクエスト作成時
- mainブランチへのマージ時
- 定期実行（毎日）

## テストデータ

### サンプルデータ生成

```bash
cd backend
npm run seed
```

## カバレッジ目標

- バックエンド: 80%以上
- フロントエンド: 70%以上
- 重要な機能: 90%以上
