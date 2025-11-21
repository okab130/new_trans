# 🚀 デプロイメントガイド

本番環境へのデプロイ手順を説明します。

## 📋 目次

1. [デプロイ前のチェックリスト](#デプロイ前のチェックリスト)
2. [環境構築](#環境構築)
3. [Docker デプロイ](#dockerデプロイ)
4. [クラウドデプロイ](#クラウドデプロイ)
5. [CI/CD パイプライン](#cicdパイプライン)
6. [監視とログ](#監視とログ)

---

## デプロイ前のチェックリスト

### セキュリティ

- [ ] すべての環境変数が設定されている
- [ ] JWT_SECRETが強固なランダム文字列
- [ ] データベースパスワードが変更されている
- [ ] APIキーがハードコードされていない
- [ ] HTTPS通信が有効
- [ ] CORS設定が適切
- [ ] セキュリティヘッダーが設定されている

### パフォーマンス

- [ ] 本番ビルドが完了している
- [ ] 静的ファイルが圧縮されている
- [ ] データベースインデックスが作成されている
- [ ] キャッシュ戦略が実装されている

### テスト

- [ ] すべてのユニットテストが成功
- [ ] 統合テストが成功
- [ ] E2Eテストが成功（実装予定）
- [ ] 負荷テストが実施されている

### ドキュメント

- [ ] README.mdが更新されている
- [ ] API仕様書が最新
- [ ] 運用マニュアルが準備されている

---

## 環境構築

### 必要なサーバー

| サーバー | 推奨スペック |
|---------|------------|
| **アプリケーション** | 2 vCPU, 4GB RAM |
| **データベース** | 2 vCPU, 8GB RAM, 100GB SSD |
| **Redis** | 1 vCPU, 2GB RAM |

### 必要なソフトウェア

```bash
# Node.js
node --version  # v20.x

# PostgreSQL
psql --version  # 16.x

# Redis
redis-cli --version  # 7.x

# Nginx（リバースプロキシ）
nginx -v  # 1.24.x
```

---

## Docker デプロイ

### 1. Dockerファイル作成

#### backend/Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係インストール
COPY package*.json ./
RUN npm ci --only=production

# ソースコピー
COPY . .

# Prisma生成
RUN npx prisma generate

# ビルド
RUN npm run build

# 本番イメージ
FROM node:20-alpine

WORKDIR /app

# 本番依存関係のみコピー
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# ポート公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 起動
CMD ["npm", "start"]
```

#### frontend/Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係インストール
COPY package*.json ./
RUN npm ci

# ソースコピー
COPY . .

# ビルド
RUN npm run build

# Nginx イメージ
FROM nginx:alpine

# ビルド成果物をコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx設定
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### frontend/nginx.conf

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip圧縮
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # キャッシュ設定
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPAルーティング
    location / {
        try_files $uri $uri/ /index.html;
    }

    # APIプロキシ
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Docker Compose設定

#### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: delivery_management
      POSTGRES_USER: delivery_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U delivery_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://delivery_user:${DB_PASSWORD}@postgres:5432/delivery_management
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### 3. デプロイ実行

```bash
# 環境変数設定
cp .env.example .env.production
nano .env.production

# Dockerイメージビルド
docker-compose build

# 起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# ヘルスチェック
curl http://localhost:3000/health
curl http://localhost/
```

---

## クラウドデプロイ

### AWS デプロイ

#### 1. ECS（Elastic Container Service）使用

```bash
# ECRにプッシュ
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com

# タグ付け
docker tag delivery-backend:latest <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/delivery-backend:latest

# プッシュ
docker push <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/delivery-backend:latest
```

#### 2. RDS（PostgreSQL）設定

```bash
# RDSインスタンス作成
aws rds create-db-instance \
  --db-instance-identifier delivery-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --master-username admin \
  --master-user-password <password> \
  --allocated-storage 100
```

#### 3. ElastiCache（Redis）設定

```bash
# Redisクラスター作成
aws elasticache create-cache-cluster \
  --cache-cluster-id delivery-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### Heroku デプロイ

```bash
# Heroku CLI ログイン
heroku login

# アプリ作成
heroku create delivery-management-app

# PostgreSQL アドオン追加
heroku addons:create heroku-postgresql:standard-0

# Redis アドオン追加
heroku addons:create heroku-redis:premium-0

# 環境変数設定
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=<secret>

# デプロイ
git push heroku main

# マイグレーション実行
heroku run npx prisma migrate deploy
```

### Vercel デプロイ（フロントエンド）

```bash
# Vercel CLI インストール
npm i -g vercel

# デプロイ
cd frontend
vercel --prod
```

---

## CI/CD パイプライン

### GitHub Actions

#### .github/workflows/deploy.yml

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run tests
        run: |
          cd backend
          npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: delivery-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
```

---

## 監視とログ

### ログ設定

#### Winston（バックエンド）

```typescript
// backend/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### 監視ツール

#### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### アラート設定

- **エラー率**: 5%以上で通知
- **レスポンスタイム**: 2秒以上で通知
- **CPU使用率**: 80%以上で通知
- **メモリ使用率**: 85%以上で通知
- **ディスク使用率**: 90%以上で通知

---

## バックアップ戦略

### データベースバックアップ

```bash
# 毎日自動バックアップ
0 2 * * * pg_dump -U delivery_user delivery_management > /backup/db_$(date +\%Y\%m\%d).sql

# 週次フルバックアップ
0 3 * * 0 pg_dump -U delivery_user delivery_management | gzip > /backup/weekly_$(date +\%Y\%m\%d).sql.gz
```

### ファイルバックアップ

```bash
# アップロードファイルのバックアップ
aws s3 sync /app/uploads s3://delivery-backups/uploads/ --delete
```

---

## ロールバック手順

```bash
# 以前のバージョンに戻す
docker-compose down
docker tag delivery-backend:previous delivery-backend:latest
docker-compose up -d

# データベースロールバック
npx prisma migrate resolve --rolled-back <migration_name>
```

---

**最終更新**: 2025-01-20  
**バージョン**: 1.0.0
