# トラック配送計画・配送実績追跡システム - インフラ設計書

## 目次
1. [インフラ構成概要](#1-インフラ構成概要)
   - 1A. [開発環境インフラ構成（詳細）](#1a-開発環境インフラ構成詳細)
   - 1B. [ステージング環境インフラ構成（詳細）](#1b-ステージング環境インフラ構成詳細)
2. [ネットワーク設計](#2-ネットワーク設計)
3. [コンピューティング基盤](#3-コンピューティング基盤)
4. [データベース基盤](#4-データベース基盤)
5. [ストレージ設計](#5-ストレージ設計)
6. [セキュリティ設計](#6-セキュリティ設計)
7. [監視・ログ基盤](#7-監視ログ基盤)
8. [バックアップ・DR設計](#8-バックアップdr設計)
9. [スケーラビリティ設計](#9-スケーラビリティ設計)
10. [コスト設計](#10-コスト設計)
11. [運用設計](#11-運用設計)
12. [Infrastructure as Code (IaC)](#12-infrastructure-as-code-iac)
13. [セキュリティコンプライアンス](#13-セキュリティコンプライアンス)
14. [今後の拡張性](#14-今後の拡張性)

---

## 1. インフラ構成概要

### 1.1 クラウドプロバイダー選択

**推奨: AWS（Amazon Web Services）**

**選定理由:**
- 豊富なマネージドサービス群
- 地理空間データ対応（Amazon Location Service）
- 高い可用性とスケーラビリティ
- 詳細な監視・ログ機能
- 日本国内リージョン（東京）の安定性

**代替選択肢: Microsoft Azure**
- Azure Maps APIの統合
- Active Directory連携の利便性
- 企業向けサポート体制

### 1.2 全体インフラ構成図

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                   CloudFront (CDN)                               │
│  - 静的コンテンツ配信                                             │
│  - SSL/TLS終端                                                   │
│  - DDoS保護 (AWS Shield)                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                Route 53 (DNS)                                    │
│  - ドメイン管理                                                   │
│  - ヘルスチェック                                                 │
│  - フェイルオーバー                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
┌───────────────┴─────┐  ┌────────┴──────────┐
│  ALB (Public)       │  │  ALB (Internal)   │
│  - HTTPS終端        │  │  - 内部通信       │
│  - WAF連携          │  │                   │
└──────────┬──────────┘  └────────┬──────────┘
           │                      │
┌──────────┴──────────────────────┴──────────────────────────────┐
│                    VPC (10.0.0.0/16)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Availability Zone A (ap-northeast-1a)                   │  │
│  │  ┌────────────────────┐  ┌──────────────────────┐       │  │
│  │  │ Public Subnet      │  │ Private Subnet (App) │       │  │
│  │  │ 10.0.1.0/24        │  │ 10.0.11.0/24         │       │  │
│  │  │ - NAT Gateway      │  │ - ECS Tasks          │       │  │
│  │  │ - Bastion Host     │  │ - Lambda             │       │  │
│  │  └────────────────────┘  └──────────────────────┘       │  │
│  │                          ┌──────────────────────┐       │  │
│  │                          │ Private Subnet (DB)  │       │  │
│  │                          │ 10.0.21.0/24         │       │  │
│  │                          │ - RDS Primary        │       │  │
│  │                          │ - ElastiCache        │       │  │
│  │                          └──────────────────────┘       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Availability Zone C (ap-northeast-1c)                   │  │
│  │  ┌────────────────────┐  ┌──────────────────────┐       │  │
│  │  │ Public Subnet      │  │ Private Subnet (App) │       │  │
│  │  │ 10.0.2.0/24        │  │ 10.0.12.0/24         │       │  │
│  │  │ - NAT Gateway      │  │ - ECS Tasks          │       │  │
│  │  └────────────────────┘  └──────────────────────┘       │  │
│  │                          ┌──────────────────────┐       │  │
│  │                          │ Private Subnet (DB)  │       │  │
│  │                          │ 10.0.22.0/24         │       │  │
│  │                          │ - RDS Standby        │       │  │
│  │                          │ - ElastiCache        │       │  │
│  │                          └──────────────────────┘       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   マネージドサービス                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   RDS    │  │ElastiCache│ │DocumentDB│  │   S3     │       │
│  │PostgreSQL│  │  (Redis)  │  │(MongoDB) │  │ Storage  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   SQS    │  │   SNS    │  │   SES    │  │Secrets   │       │
│  │  Queue   │  │  Topics  │  │  Email   │  │Manager   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  監視・ログ基盤                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │CloudWatch│  │  X-Ray   │  │CloudTrail│  │  Athena  │       │
│  │  Logs    │  │  Trace   │  │  Audit   │  │  Query   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 環境構成

| 環境 | 目的 | 構成 | アクセス |
|------|------|------|----------|
| **開発環境 (Dev)** | 開発者個人の開発・デバッグ | ローカル Docker Compose | 開発者のみ |
| **ステージング環境 (Stg)** | 結合テスト・受入テスト | 本番同等の簡易構成 | 開発チーム・QA |
| **本番環境 (Prod)** | エンドユーザー向けサービス | Multi-AZ冗長構成 | 全ユーザー |
| **DR環境 (DR)** | 災害復旧 | 別リージョン（大阪）| 緊急時のみ |

---

## 1A. 開発環境インフラ構成（詳細）

### 1A.1 開発環境の目的と方針

**目的:**
- 開発者のローカルPC上で完結する開発環境
- 本番環境に近い構成をローカルで再現
- セットアップの容易さと再現性
- チーム全体で統一された開発環境

**方針:**
- Docker Composeによるコンテナベース構成
- 環境変数による設定管理
- データベース初期データの自動投入
- ホットリロード対応

### 1A.2 開発環境アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                    開発者ローカルPC                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Docker Desktop / Docker Engine               │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │          Docker Compose Network (bridge)           │  │  │
│  │  │                                                    │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐              │  │  │
│  │  │  │  frontend    │  │  backend     │              │  │  │
│  │  │  │  (Vite)      │  │  (Node.js)   │              │  │  │
│  │  │  │  Port: 5173  │  │  Port: 3000  │              │  │  │
│  │  │  │              │  │              │              │  │  │
│  │  │  │  - React     │  │  - Express   │              │  │  │
│  │  │  │  - TypeScript│  │  - TypeScript│              │  │  │
│  │  │  │  - HMR       │  │  - Nodemon   │              │  │  │
│  │  │  └──────┬───────┘  └──────┬───────┘              │  │  │
│  │  │         │                  │                      │  │  │
│  │  │         │                  ├──────────────┐       │  │  │
│  │  │         │                  │              │       │  │  │
│  │  │  ┌──────┴──────────────────┴────┐  ┌──────┴──┐   │  │  │
│  │  │  │  postgres                     │  │  redis  │   │  │  │
│  │  │  │  (PostgreSQL 16 + PostGIS)    │  │  (7)    │   │  │  │
│  │  │  │  Port: 5432                   │  │  Port:  │   │  │  │
│  │  │  │                               │  │  6379   │   │  │  │
│  │  │  │  - 開発用DB                   │  │         │   │  │  │
│  │  │  │  - 初期データ投入済み          │  │         │   │  │  │
│  │  │  │  - Volume永続化               │  │         │   │  │  │
│  │  │  └───────────────────────────────┘  └─────────┘   │  │  │
│  │  │                                                    │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐              │  │  │
│  │  │  │  mongodb     │  │  mailhog     │              │  │  │
│  │  │  │  (7)         │  │  (SMTP)      │              │  │  │
│  │  │  │  Port: 27017 │  │  SMTP: 1025  │              │  │  │
│  │  │  │              │  │  Web: 8025   │              │  │  │
│  │  │  │  - 位置履歴  │  │              │              │  │  │
│  │  │  │  - ログ保存  │  │  - メール    │              │  │  │
│  │  │  └──────────────┘  │    テスト用  │              │  │  │
│  │  │                    └──────────────┘              │  │  │
│  │  │                                                    │  │  │
│  │  │  ┌──────────────┐                                 │  │  │
│  │  │  │  adminer     │                                 │  │  │
│  │  │  │  (DB管理)    │                                 │  │  │
│  │  │  │  Port: 8080  │                                 │  │  │
│  │  │  │              │                                 │  │  │
│  │  │  │  - PostgreSQL│                                 │  │  │
│  │  │  │    Web GUI   │                                 │  │  │
│  │  │  └──────────────┘                                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              開発ツール（ホストOS上）                      │  │
│  │  - VSCode                                                 │  │
│  │  - Git                                                    │  │
│  │  - Node.js (バージョン管理: nvm/volta)                    │  │
│  │  - Docker Desktop                                         │  │
│  │  - Postman / Thunder Client (API テスト)                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

外部サービス（開発環境用）
┌─────────────────────────────────────────┐
│  - Google Maps API (開発用APIキー)       │
│  - モックサーバー (GPS位置情報エミュレート)│
└─────────────────────────────────────────┘
```

### 1A.3 Docker Compose構成

**docker-compose.yml（開発環境）:**

```yaml
version: '3.9'

services:
  # PostgreSQL（メインデータベース）
  postgres:
    image: postgis/postgis:16-3.4
    container_name: delivery-tracking-postgres
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: delivery_tracking_dev
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --locale=ja_JP.UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devuser"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - delivery-network

  # Redis（キャッシュ・セッション）
  redis:
    image: redis:7-alpine
    container_name: delivery-tracking-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass devredis
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - delivery-network

  # MongoDB（ログ・位置履歴）
  mongodb:
    image: mongo:7
    container_name: delivery-tracking-mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: devuser
      MONGO_INITDB_ROOT_PASSWORD: devpass
      MONGO_INITDB_DATABASE: tracking_logs
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - ./database/mongo-init:/docker-entrypoint-initdb.d
    networks:
      - delivery-network

  # バックエンドAPI
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
      target: development
    container_name: delivery-tracking-backend
    environment:
      NODE_ENV: development
      PORT: 3000
      DATABASE_URL: postgresql://devuser:devpass@postgres:5432/delivery_tracking_dev
      REDIS_URL: redis://:devredis@redis:6379
      MONGODB_URL: mongodb://devuser:devpass@mongodb:27017/tracking_logs
      JWT_SECRET: dev-secret-key-change-in-production
      JWT_EXPIRES_IN: 24h
      GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY:-AIza_dev_key}
      LOG_LEVEL: debug
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js デバッガーポート
    volumes:
      - ./backend:/app
      - /app/node_modules
      - backend_logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      mongodb:
        condition: service_started
    command: npm run dev
    networks:
      - delivery-network

  # フロントエンド
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
      target: development
    container_name: delivery-tracking-frontend
    environment:
      VITE_API_BASE_URL: http://localhost:3000/api
      VITE_GOOGLE_MAPS_API_KEY: ${GOOGLE_MAPS_API_KEY:-AIza_dev_key}
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev -- --host
    networks:
      - delivery-network

  # Adminer（データベース管理ツール）
  adminer:
    image: adminer:latest
    container_name: delivery-tracking-adminer
    ports:
      - "8080:8080"
    environment:
      ADMINER_DEFAULT_SERVER: postgres
    depends_on:
      - postgres
    networks:
      - delivery-network

  # MailHog（メールテスト用SMTPサーバー）
  mailhog:
    image: mailhog/mailhog:latest
    container_name: delivery-tracking-mailhog
    ports:
      - "1025:1025"  # SMTPポート
      - "8025:8025"  # Web UIポート
    networks:
      - delivery-network

  # Redis Commander（Redis管理ツール）
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: delivery-tracking-redis-commander
    environment:
      REDIS_HOSTS: local:redis:6379:0:devredis
    ports:
      - "8081:8081"
    depends_on:
      - redis
    networks:
      - delivery-network

  # Mongo Express（MongoDB管理ツール）
  mongo-express:
    image: mongo-express:latest
    container_name: delivery-tracking-mongo-express
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: devuser
      ME_CONFIG_MONGODB_ADMINPASSWORD: devpass
      ME_CONFIG_MONGODB_URL: mongodb://devuser:devpass@mongodb:27017/
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: admin
    ports:
      - "8082:8081"
    depends_on:
      - mongodb
    networks:
      - delivery-network

networks:
  delivery-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  mongodb_data:
    driver: local
  backend_logs:
    driver: local
```

### 1A.4 バックエンド Dockerfile（開発用）

**backend/Dockerfile.dev:**

```dockerfile
# 開発環境用マルチステージビルド
FROM node:20-alpine AS base

WORKDIR /app

# 依存関係インストール
COPY package*.json ./
RUN npm ci

# Prisma CLIをグローバルインストール
RUN npm install -g prisma

# 開発環境
FROM base AS development

# アプリケーションコードをコピー（ボリュームマウントで上書きされる）
COPY . .

# Prismaクライアント生成
RUN npx prisma generate

# ポート公開
EXPOSE 3000 9229

# 開発サーバー起動（nodemon使用）
CMD ["npm", "run", "dev"]
```

### 1A.5 フロントエンド Dockerfile（開発用）

**frontend/Dockerfile.dev:**

```dockerfile
FROM node:20-alpine AS base

WORKDIR /app

# 依存関係インストール
COPY package*.json ./
RUN npm ci

# 開発環境
FROM base AS development

# アプリケーションコードをコピー
COPY . .

# ポート公開
EXPOSE 5173

# 開発サーバー起動（Vite HMR有効）
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### 1A.6 環境変数設定

**backend/.env.development:**

```env
# Database
DATABASE_URL="postgresql://devuser:devpass@localhost:5432/delivery_tracking_dev"

# Redis
REDIS_URL="redis://:devredis@localhost:6379"

# MongoDB
MONGODB_URL="mongodb://devuser:devpass@localhost:27017/tracking_logs"

# JWT
JWT_SECRET="dev-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"

# API Keys
GOOGLE_MAPS_API_KEY="AIza_your_dev_api_key"

# Logging
LOG_LEVEL="debug"

# SMTP (MailHog)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASS=""

# Application
NODE_ENV="development"
PORT="3000"
CORS_ORIGIN="http://localhost:5173"
```

**frontend/.env.development:**

```env
# API Endpoint
VITE_API_BASE_URL=http://localhost:3000/api

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=AIza_your_dev_api_key

# Feature Flags
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEBUG_PANEL=true
```

### 1A.7 データベース初期化スクリプト

**database/init/01_extensions.sql:**

```sql
-- PostGIS拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- その他の拡張
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

**database/init/02_seed_data.sql:**

```sql
-- 開発用サンプルデータ投入
-- 組織
INSERT INTO organization (organization_id, organization_code, name, address, created_at, updated_at)
VALUES ('ORG-001', 'DEV-ORG', '開発用物流企業', '東京都千代田区丸の内1-1-1', NOW(), NOW());

-- 拠点
INSERT INTO branch (branch_id, organization_id, branch_code, name, address, latitude, longitude, created_at, updated_at)
VALUES 
  ('BR-001', 'ORG-001', 'TKY-01', '東京本社', '東京都千代田区丸の内1-1-1', 35.6812, 139.7671, NOW(), NOW()),
  ('BR-002', 'ORG-001', 'OSA-01', '大阪支社', '大阪府大阪市北区梅田1-1-1', 34.7024, 135.4959, NOW(), NOW());

-- ユーザー
INSERT INTO "user" (user_id, organization_id, branch_id, login_id, password_hash, name, email, role, created_at, updated_at)
VALUES 
  ('U-001', 'ORG-001', 'BR-001', 'admin', '$2b$10$dev_hash_admin', '管理者', 'admin@example.com', 'ADMIN', NOW(), NOW()),
  ('U-002', 'ORG-001', 'BR-001', 'dispatcher01', '$2b$10$dev_hash_dispatcher', '配車担当A', 'dispatcher01@example.com', 'DISPATCHER', NOW(), NOW()),
  ('U-003', 'ORG-001', 'BR-001', 'driver01', '$2b$10$dev_hash_driver', 'ドライバーA', 'driver01@example.com', 'DRIVER', NOW(), NOW());

-- 車両
INSERT INTO vehicle (vehicle_id, branch_id, vehicle_number, vehicle_type, max_load_weight, status, created_at, updated_at)
VALUES 
  ('V-001', 'BR-001', '品川500あ1234', 'TRUCK_2TON', 2000.00, 'AVAILABLE', NOW(), NOW()),
  ('V-002', 'BR-001', '品川500あ5678', 'TRUCK_4TON', 4000.00, 'AVAILABLE', NOW(), NOW());

-- ドライバー
INSERT INTO driver (driver_id, branch_id, employee_number, name, license_number, status, created_at, updated_at)
VALUES 
  ('D-001', 'BR-001', 'EMP-001', '山田太郎', 'DL12345678', 'AVAILABLE', NOW(), NOW()),
  ('D-002', 'BR-001', 'EMP-002', '佐藤花子', 'DL87654321', 'AVAILABLE', NOW(), NOW());

-- 顧客
INSERT INTO customer (customer_id, organization_id, customer_code, name, phone_number, email, created_at, updated_at)
VALUES 
  ('C-001', 'ORG-001', 'CUST-001', 'ABC商事株式会社', '03-1234-5678', 'contact@abc.co.jp', NOW(), NOW()),
  ('C-002', 'ORG-001', 'CUST-002', 'XYZ物産株式会社', '06-9876-5432', 'info@xyz.co.jp', NOW(), NOW());
```

**database/mongo-init/init.js:**

```javascript
// MongoDB初期化スクリプト
db = db.getSiblingDB('tracking_logs');

// コレクション作成
db.createCollection('vehicle_locations');
db.createCollection('application_logs');

// インデックス作成
db.vehicle_locations.createIndex({ vehicle_id: 1, timestamp: -1 });
db.vehicle_locations.createIndex({ location: "2dsphere" });
db.vehicle_locations.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90日で削除

// サンプルデータ挿入
db.vehicle_locations.insertMany([
  {
    vehicle_id: "V-001",
    timestamp: new Date(),
    location: {
      type: "Point",
      coordinates: [139.7671, 35.6812]
    },
    speed: 0,
    heading: 0,
    status: "STOPPED"
  },
  {
    vehicle_id: "V-002",
    timestamp: new Date(),
    location: {
      type: "Point",
      coordinates: [135.4959, 34.7024]
    },
    speed: 0,
    heading: 0,
    status: "STOPPED"
  }
]);

print("MongoDB initialization completed!");
```

### 1A.8 開発環境セットアップ手順

**1. 必要なツールのインストール:**

```bash
# Docker Desktop（Windows/Mac）
# https://www.docker.com/products/docker-desktop

# Git
# https://git-scm.com/downloads

# Node.js（バージョン管理ツール経由を推奨）
# Windows: volta
winget install Volta.Volta

# Mac: volta or nvm
brew install volta
```

**2. リポジトリクローン:**

```bash
git clone https://github.com/your-org/delivery-tracking-system.git
cd delivery-tracking-system
```

**3. 環境変数設定:**

```bash
# バックエンド
cd backend
cp .env.example .env.development
# .env.developmentを編集してAPIキー等を設定

# フロントエンド
cd ../frontend
cp .env.example .env.development
# .env.developmentを編集
```

**4. Docker Compose起動:**

```bash
# プロジェクトルートディレクトリで実行
cd ..
docker-compose up -d

# ログ確認
docker-compose logs -f backend
```

**5. データベースマイグレーション実行:**

```bash
# backendコンテナ内で実行
docker exec -it delivery-tracking-backend sh
npx prisma migrate dev --name init
npx prisma db seed  # シードデータ投入
exit
```

**6. 動作確認:**

```bash
# ブラウザでアクセス
フロントエンド: http://localhost:5173
バックエンドAPI: http://localhost:3000/health
Adminer（DB管理）: http://localhost:8080
MailHog（メール確認）: http://localhost:8025
Redis Commander: http://localhost:8081
Mongo Express: http://localhost:8082
```

### 1A.9 開発時のよくある操作

**コンテナ再起動:**
```bash
docker-compose restart backend
```

**データベースリセット:**
```bash
docker-compose down -v  # ボリュームも削除
docker-compose up -d
docker exec -it delivery-tracking-backend npx prisma migrate reset
```

**ログ確認:**
```bash
# 全サービス
docker-compose logs -f

# 特定サービス
docker-compose logs -f backend frontend
```

**依存関係更新:**
```bash
# バックエンド
cd backend
npm install <package-name>
docker-compose restart backend

# フロントエンド
cd frontend
npm install <package-name>
docker-compose restart frontend
```

**データベース接続（CLI）:**
```bash
# PostgreSQL
docker exec -it delivery-tracking-postgres psql -U devuser -d delivery_tracking_dev

# MongoDB
docker exec -it delivery-tracking-mongodb mongosh -u devuser -p devpass

# Redis
docker exec -it delivery-tracking-redis redis-cli -a devredis
```

### 1A.10 開発環境のトラブルシューティング

**問題: ポートが既に使用されている**
```bash
# Windowsの場合
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Macの場合
lsof -i :5173
kill -9 <PID>
```

**問題: データベース接続エラー**
```bash
# コンテナのヘルスチェック確認
docker-compose ps

# PostgreSQLコンテナのログ確認
docker-compose logs postgres

# データベースへの接続テスト
docker exec -it delivery-tracking-backend npx prisma db pull
```

**問題: ホットリロードが動作しない**
```bash
# ボリュームマウントの確認
docker-compose config

# WSL2環境の場合、プロジェクトをWSL2内に配置
# /mnt/c/ ではなく ~/projects/ に配置
```

### 1A.11 開発環境のリソース要件

**最小スペック:**
- CPU: 4コア以上
- メモリ: 8GB以上
- ディスク: 20GB以上の空き容量

**推奨スペック:**
- CPU: 8コア以上
- メモリ: 16GB以上
- ディスク: 50GB以上の空き容量（SSD推奨）

**Docker Desktop設定:**
```
Memory: 4GB以上割り当て
CPU: 2コア以上割り当て
Swap: 1GB以上
```

### 1A.12 開発環境のセキュリティ

**注意事項:**
- 開発環境の認証情報は本番環境と分離
- `.env`ファイルは`.gitignore`に含める
- APIキーは環境変数で管理
- ポート公開は必要最小限に

**推奨設定:**
```bash
# .gitignore に追加
.env
.env.development
.env.local
*.log
node_modules/
```

---

## 1B. ステージング環境インフラ構成（詳細）

### 1B.1 ステージング環境の目的と方針

**目的:**
- 本番環境と同等の構成で統合テスト実施
- 本番リリース前の最終検証
- パフォーマンステスト実施
- 外部システム連携テスト

**方針:**
- AWSクラウド上に構築（本番と同じリージョン）
- コスト削減のため単一AZ構成
- 本番環境の50%程度のスペック
- 自動デプロイメント（CI/CD）対応

### 1B.2 ステージング環境アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                   AWS ap-northeast-1 (東京)                      │
│                   VPC (10.1.0.0/16)                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Availability Zone A (ap-northeast-1a)                    │  │
│  │                                                           │  │
│  │  ┌────────────────────┐  ┌──────────────────────┐       │  │
│  │  │ Public Subnet      │  │ Private Subnet (App) │       │  │
│  │  │ 10.1.1.0/24        │  │ 10.1.11.0/24         │       │  │
│  │  │                    │  │                      │       │  │
│  │  │ ┌────────────┐     │  │ ┌──────────────┐   │       │  │
│  │  │ │ ALB        │     │  │ │ ECS Fargate  │   │       │  │
│  │  │ │ (Public)   │────────┼─│ (2 tasks)    │   │       │  │
│  │  │ └────────────┘     │  │ │ - backend    │   │       │  │
│  │  │                    │  │ │ - worker     │   │       │  │
│  │  │ ┌────────────┐     │  │ └──────────────┘   │       │  │
│  │  │ │ NAT Gateway│     │  │                      │       │  │
│  │  │ └────────────┘     │  │                      │       │  │
│  │  └────────────────────┘  └──────────┬───────────┘       │  │
│  │                                      │                   │  │
│  │                          ┌───────────┴──────────┐       │  │
│  │                          │ Private Subnet (DB)  │       │  │
│  │                          │ 10.1.21.0/24         │       │  │
│  │                          │                      │       │  │
│  │                          │ ┌──────────────┐   │       │  │
│  │                          │ │ RDS          │   │       │  │
│  │                          │ │ (db.t3.large)│   │       │  │
│  │                          │ │ Single-AZ    │   │       │  │
│  │                          │ └──────────────┘   │       │  │
│  │                          │                      │       │  │
│  │                          │ ┌──────────────┐   │       │  │
│  │                          │ │ ElastiCache  │   │       │  │
│  │                          │ │ (cache.t3.   │   │       │  │
│  │                          │ │  medium)     │   │       │  │
│  │                          │ └──────────────┘   │       │  │
│  │                          └──────────────────────┘       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              マネージドサービス                            │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │
│  │  │   S3     │  │DocumentDB│  │ Secrets  │               │  │
│  │  │(Staging) │  │(t3.medium│  │ Manager  │               │  │
│  │  └──────────┘  │ x1)      │  └──────────┘               │  │
│  │                └──────────┘                               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 1B.3 ステージング環境リソース仕様

**コンピューティング:**
```yaml
ECS Cluster:
  Service: backend-api-service-stg
    Task Definition: 
      CPU: 512 (.5 vCPU)
      Memory: 1024 MB
    Desired Count: 2
    Min: 1
    Max: 4
```

**データベース:**
```yaml
RDS PostgreSQL:
  Instance Class: db.t3.large
  vCPU: 2
  Memory: 8 GB
  Storage: 100 GB (gp3)
  Multi-AZ: false
  Backup Retention: 3 days

ElastiCache Redis:
  Node Type: cache.t3.medium
  vCPU: 2
  Memory: 3.09 GB
  Cluster Mode: disabled
  Replicas: 0

DocumentDB:
  Instance Class: db.t3.medium
  vCPU: 2
  Memory: 4 GB
  Instances: 1
  Storage: Auto-scaling
```

### 1B.4 ステージング環境デプロイフロー

```yaml
# GitHub Actions ワークフロー（ステージング）
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: arn:aws:iam::xxx:role/GitHubActionsRole
          aws-region: ap-northeast-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/backend-api-stg:$IMAGE_TAG ./backend
          docker push $ECR_REGISTRY/backend-api-stg:$IMAGE_TAG

      - name: Update ECS service
        run: |
          aws ecs update-service \
            --cluster delivery-tracking-stg \
            --service backend-api-service-stg \
            --force-new-deployment

      - name: Run database migrations
        run: |
          # ECS Task経由でマイグレーション実行
          aws ecs run-task \
            --cluster delivery-tracking-stg \
            --task-definition db-migrate-stg \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"

      - name: Run integration tests
        run: npm run test:integration
        env:
          API_URL: https://stg-api.example.com
```

### 1B.5 ステージング環境のコスト（月額）

| サービス | スペック | 月額（USD） | 月額（JPY） |
|---------|---------|------------|------------|
| ECS Fargate | 0.5 vCPU x 1GB x 2タスク 24h | $37 | ¥5,550 |
| RDS PostgreSQL | db.t3.large Single-AZ | $120 | ¥18,000 |
| ElastiCache Redis | cache.t3.medium x 1 | $43 | ¥6,450 |
| DocumentDB | db.t3.medium x 1 | $100 | ¥15,000 |
| ALB | 処理データ100GB | $25 | ¥3,750 |
| NAT Gateway | 1AZ x 50GB | $50 | ¥7,500 |
| S3 | 100GB Standard | $3 | ¥450 |
| CloudWatch | Logs 20GB | $15 | ¥2,250 |
| **合計** | | **$393** | **¥58,950** |

※為替レート: 1 USD = 150 JPY換算

### 1B.6 ステージング環境の自動停止設定

**コスト削減のため夜間・休日は自動停止:**

```python
# Lambda関数（夜間停止）
import boto3

def lambda_handler(event, context):
    ecs = boto3.client('ecs')
    rds = boto3.client('rds')
    
    # ECSサービスを0タスクに
    ecs.update_service(
        cluster='delivery-tracking-stg',
        service='backend-api-service-stg',
        desiredCount=0
    )
    
    # RDS停止
    rds.stop_db_instance(
        DBInstanceIdentifier='delivery-tracking-stg'
    )
    
    return {'status': 'stopped'}

# CloudWatch Events設定
# 平日: 20:00停止 → 8:00起動
# 土日: 終日停止
```

**想定停止時間:**
- 平日夜間: 20:00-8:00 (12時間)
- 土日: 終日停止

**月間コスト削減額:**
- RDS: 約 $60削減（50%削減）
- ECS: 約 $18削減（50%削減）
- **合計削減額: 約 $78/月 (¥11,700)**

---

## 2. ネットワーク設計

### 2.1 VPC設計

**VPC CIDR:** 10.0.0.0/16

**サブネット構成:**

| サブネット種別 | AZ-A | AZ-C | 用途 |
|---------------|------|------|------|
| Public Subnet | 10.0.1.0/24 | 10.0.2.0/24 | NAT Gateway, Bastion |
| Private Subnet (App) | 10.0.11.0/24 | 10.0.12.0/24 | ECS, Lambda |
| Private Subnet (DB) | 10.0.21.0/24 | 10.0.22.0/24 | RDS, ElastiCache |

**ルーティング:**

```
# Public Subnet Route Table
Destination        Target
10.0.0.0/16        local
0.0.0.0/0          igw-xxxxx (Internet Gateway)

# Private Subnet (App) Route Table
Destination        Target
10.0.0.0/16        local
0.0.0.0/0          nat-xxxxx (NAT Gateway)

# Private Subnet (DB) Route Table
Destination        Target
10.0.0.0/16        local
```

### 2.2 セキュリティグループ設計

**ALB Security Group (sg-alb)**
```
Inbound:
  - HTTP (80) from 0.0.0.0/0
  - HTTPS (443) from 0.0.0.0/0

Outbound:
  - All traffic to sg-ecs
```

**ECS Security Group (sg-ecs)**
```
Inbound:
  - HTTP (3000) from sg-alb
  - HTTP (3000) from sg-ecs (内部通信)

Outbound:
  - PostgreSQL (5432) to sg-rds
  - Redis (6379) to sg-elasticache
  - MongoDB (27017) to sg-documentdb
  - HTTPS (443) to 0.0.0.0/0 (外部API)
```

**RDS Security Group (sg-rds)**
```
Inbound:
  - PostgreSQL (5432) from sg-ecs
  - PostgreSQL (5432) from sg-bastion

Outbound:
  - なし
```

**ElastiCache Security Group (sg-elasticache)**
```
Inbound:
  - Redis (6379) from sg-ecs

Outbound:
  - なし
```

**Bastion Security Group (sg-bastion)**
```
Inbound:
  - SSH (22) from 企業IPアドレス範囲

Outbound:
  - PostgreSQL (5432) to sg-rds
  - SSH (22) to sg-ecs
```

### 2.3 ネットワークACL

**基本方針:** デフォルトのACLを使用（全許可）
**理由:** セキュリティグループで細かく制御するため

### 2.4 VPCエンドポイント

**Gateway型エンドポイント:**
- S3
- DynamoDB

**Interface型エンドポイント:**
- Secrets Manager
- CloudWatch Logs
- ECR

**メリット:**
- NAT Gatewayのトラフィック削減
- セキュリティ向上（インターネット経由不要）
- コスト削減

---

## 3. コンピューティング基盤

### 3.1 コンテナオーケストレーション（ECS Fargate）

**選定理由:**
- サーバーレスでインフラ管理不要
- スケーラビリティ
- コスト効率

**ECSクラスター構成:**
```
Cluster: delivery-tracking-cluster
  ├── Service: backend-api-service
  │   ├── Task Definition: backend-api:latest
  │   ├── Desired Count: 2 (最小)
  │   ├── Max Count: 10 (Auto Scaling)
  │   └── Target Group: backend-api-tg
  │
  ├── Service: tracking-worker-service
  │   ├── Task Definition: tracking-worker:latest
  │   └── Desired Count: 2
  │
  └── Service: route-optimizer-service
      ├── Task Definition: route-optimizer:latest
      └── Desired Count: 1
```

**タスク定義例（backend-api）:**
```json
{
  "family": "backend-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend-api",
      "image": "<account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/backend-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-1:xxxxx:secret:db-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/backend-api",
          "awslogs-region": "ap-northeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### 3.2 Auto Scaling設定

**Target Tracking Scaling:**
```yaml
ScalingPolicy:
  Type: TargetTrackingScaling
  TargetTrackingScalingPolicyConfiguration:
    TargetValue: 70.0
    PredefinedMetricSpecification:
      PredefinedMetricType: ECSServiceAverageCPUUtilization
    ScaleInCooldown: 300
    ScaleOutCooldown: 60
```

**スケジュールベースScaling:**
```yaml
# 平日朝のピーク時間（8:00-10:00）
ScheduledAction:
  ScalableTargetAction:
    MinCapacity: 5
    MaxCapacity: 15
  Schedule: "cron(0 8 ? * MON-FRI *)"
```

### 3.3 Lambda関数

**用途:**
- 定期バッチ処理（日次レポート生成）
- イベント駆動処理（S3アップロード時の画像処理）
- 非同期タスク（メール送信）

**Lambda関数リスト:**

| 関数名 | トリガー | メモリ | タイムアウト |
|--------|----------|--------|--------------|
| daily-report-generator | CloudWatch Events (毎日6:00) | 1024MB | 300s |
| image-processor | S3 Object Created | 2048MB | 60s |
| email-sender | SQS Queue | 512MB | 30s |
| data-archiver | CloudWatch Events (毎月1日) | 3008MB | 900s |

---

## 4. データベース基盤

### 4.1 Amazon RDS for PostgreSQL

**仕様:**
```yaml
Engine: PostgreSQL 16.1
Instance Class: db.r6g.xlarge (4vCPU, 32GB RAM)
Storage:
  Type: gp3
  Size: 500GB
  IOPS: 12000
  Throughput: 500 MB/s
  Autoscaling: Max 2TB

Multi-AZ: Enabled
Backup:
  Retention: 7 days
  Window: 03:00-04:00 JST
Maintenance Window: Sun 04:00-05:00 JST

Extensions:
  - PostGIS 3.4
  - pg_stat_statements
```

**パラメータグループ設定:**
```
max_connections = 200
shared_buffers = 8GB
effective_cache_size = 24GB
maintenance_work_mem = 2GB
work_mem = 64MB
random_page_cost = 1.1
effective_io_concurrency = 200
```

**Read Replica構成:**
```
Primary: ap-northeast-1a
Replica1: ap-northeast-1c (読み取り専用、レポート用)
Replica2: ap-northeast-1a (フェイルオーバー用)
```

### 4.2 Amazon ElastiCache for Redis

**仕様:**
```yaml
Engine: Redis 7.0
Node Type: cache.r6g.large (2vCPU, 13.07GB RAM)
Cluster Mode: Enabled
Shards: 3
Replicas per Shard: 1

Multi-AZ: Enabled
Automatic Failover: Enabled
Backup:
  Retention: 5 days
  Window: 03:00-04:00 JST
```

**使用用途:**
- セッション管理
- APIレート制限
- リアルタイム車両位置キャッシュ
- 配送進捗キャッシュ

### 4.3 Amazon DocumentDB (MongoDB互換)

**仕様:**
```yaml
Engine: DocumentDB 5.0
Instance Class: db.r6g.large (2vCPU, 16GB RAM)
Instances: 3 (1 Primary + 2 Replica)
Storage: Auto-scaling up to 64TB

Backup:
  Retention: 7 days
  Window: 03:00-04:00 JST
```

**使用用途:**
- 位置履歴データ
- アプリケーションログ
- イベントストリーム

---

## 5. ストレージ設計

### 5.1 Amazon S3

**バケット構成:**

| バケット名 | 用途 | ライフサイクル | 暗号化 |
|-----------|------|---------------|--------|
| delivery-tracking-assets | 静的アセット（画像、CSS、JS） | なし | SSE-S3 |
| delivery-tracking-uploads | 配送証跡画像 | 90日後にGlacierへ移行 | SSE-KMS |
| delivery-tracking-reports | レポートファイル（CSV、PDF） | 365日後に削除 | SSE-S3 |
| delivery-tracking-logs | アプリケーションログ | 180日後に削除 | SSE-S3 |
| delivery-tracking-backups | データベースバックアップ | 30日後に削除 | SSE-KMS |

**S3バケットポリシー例（uploads）:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowECSTasksOnly",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/ecs-task-role"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::delivery-tracking-uploads/*"
    }
  ]
}
```

### 5.2 CloudFront (CDN)

**ディストリビューション設定:**
```yaml
Origins:
  - Id: S3-Assets
    DomainName: delivery-tracking-assets.s3.amazonaws.com
    OriginPath: /production
  - Id: ALB-API
    DomainName: alb-xxxxx.ap-northeast-1.elb.amazonaws.com

Behaviors:
  - PathPattern: /static/*
    TargetOrigin: S3-Assets
    CachingPolicy: CachingOptimized
    Compress: true
  - PathPattern: /api/*
    TargetOrigin: ALB-API
    CachingPolicy: CachingDisabled
    AllowedMethods: [GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE]

SSL Certificate: ACM証明書
Price Class: PriceClass_200 (日本・アジア・北米)
```

---

## 6. セキュリティ設計

### 6.1 IAMロール設計

**ECSタスク実行ロール（ecsTaskExecutionRole）:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

**ECSタスクロール（ecsTaskRole）:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::delivery-tracking-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage"
      ],
      "Resource": "arn:aws:sqs:ap-northeast-1:*:delivery-*"
    }
  ]
}
```

### 6.2 AWS WAF設定

**WebACL ルール:**

1. **AWS Managed Rules - Core rule set**
   - SQL injection攻撃対策
   - XSS攻撃対策

2. **AWS Managed Rules - Known bad inputs**
   - 既知の不正パターン検知

3. **Rate-based rule**
   ```
   Rate limit: 2000 requests per 5 minutes per IP
   Action: Block
   ```

4. **Geo-blocking rule**
   ```
   Allow: JP (日本)
   Block: その他の国（必要に応じて調整）
   ```

### 6.3 AWS Secrets Manager

**シークレット管理:**

| シークレット名 | 内容 | ローテーション |
|---------------|------|---------------|
| rds/postgresql/master | RDSマスターパスワード | 30日 |
| redis/auth-token | Redis認証トークン | 90日 |
| jwt/secret-key | JWT署名鍵 | 180日 |
| google-maps/api-key | Google Maps APIキー | 手動 |
| sendgrid/api-key | SendGrid APIキー | 手動 |

### 6.4 暗号化

**保存時暗号化:**
- RDS: AWS KMS (カスタマーマネージドキー)
- ElastiCache: 有効化
- DocumentDB: AWS KMS
- S3: SSE-S3 / SSE-KMS
- EBS: デフォルト暗号化

**通信時暗号化:**
- HTTPS/TLS 1.3必須
- RDS接続: SSL/TLS強制
- Redis接続: TLS有効化

### 6.5 AWS Shield & GuardDuty

**AWS Shield Standard:** 自動有効（DDoS対策）

**AWS GuardDuty:** 有効化
- 異常なAPIコール検知
- 不正アクセス検知
- 暗号通貨マイニング検知

---

## 7. 監視・ログ基盤

### 7.1 Amazon CloudWatch

**メトリクス監視:**

| メトリクス | 閾値 | アクション |
|-----------|------|-----------|
| ECS CPU使用率 | > 80% | Auto Scaling |
| ECS メモリ使用率 | > 85% | Auto Scaling |
| RDS CPU使用率 | > 75% | アラート通知 |
| RDS 空きメモリ | < 2GB | アラート通知 |
| ALB ターゲット異常数 | > 0 | 緊急通知 |
| API エラー率 | > 5% | アラート通知 |
| API レスポンスタイム | > 3秒 | アラート通知 |

**カスタムメトリクス:**
```typescript
// アプリケーション内で送信
cloudwatch.putMetricData({
  Namespace: 'DeliveryTracking/Business',
  MetricData: [
    {
      MetricName: 'DeliveryCount',
      Value: count,
      Unit: 'Count',
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'Environment', Value: 'Production' }
      ]
    }
  ]
});
```

### 7.2 ログ管理

**CloudWatch Logs ロググループ:**

| ロググループ | 保持期間 | サブスクリプション |
|-------------|---------|-------------------|
| /ecs/backend-api | 30日 | Kinesis Firehose → S3 |
| /ecs/tracking-worker | 30日 | Kinesis Firehose → S3 |
| /aws/lambda/daily-report-generator | 14日 | なし |
| /aws/rds/postgresql/error | 90日 | SNS通知 |
| /aws/alb/access-logs | 7日 | S3アーカイブ |

**ログ形式（構造化ログ - JSON）:**
```json
{
  "timestamp": "2025-01-20T10:30:00.000Z",
  "level": "INFO",
  "service": "backend-api",
  "trace_id": "abc123def456",
  "user_id": "U-001",
  "action": "create_delivery_plan",
  "plan_id": "P-12345",
  "duration_ms": 245,
  "status": "success"
}
```

### 7.3 AWS X-Ray（分散トレーシング）

**有効化範囲:**
- ECS Fargate Tasks
- Lambda関数
- API Gateway

**トレース情報:**
- リクエストフロー全体の可視化
- ボトルネック特定
- エラー発生箇所の特定

### 7.4 アラート設定（SNS + Lambda）

**通知フロー:**
```
CloudWatch Alarm → SNS Topic → Lambda → Slack/Email/PagerDuty
```

**アラートレベル:**

| レベル | 通知先 | 例 |
|--------|--------|---|
| Critical | Slack + PagerDuty + 電話 | サービス全停止、データベース障害 |
| High | Slack + Email | API エラー率高、応答時間遅延 |
| Medium | Slack | Auto Scaling発動、ディスク使用率上昇 |
| Low | Emailのみ | バッチ処理完了 |

---

## 8. バックアップ・DR設計

### 8.1 バックアップ戦略

**RDS自動バックアップ:**
```yaml
Automated Backup:
  Retention: 7 days
  Window: 03:00-04:00 JST
  Backup Target: Snapshot to S3

Manual Snapshot:
  Frequency: リリース前必須
  Retention: 30 days
```

**データベース論理バックアップ:**
```bash
# 日次実行（Lambda経由）
pg_dump -h <rds-endpoint> -U master -Fc delivery_db > /tmp/backup.dump
aws s3 cp /tmp/backup.dump s3://delivery-tracking-backups/db/$(date +%Y%m%d).dump
```

**S3バージョニング:**
- 重要バケット（uploads, reports）は有効化
- 誤削除から保護

**バックアップ検証:**
- 月次でリストアテスト実施
- 別環境で復旧確認

### 8.2 災害復旧（DR）設計

**RPO（目標復旧時点）:** 1時間以内
**RTO（目標復旧時間）:** 4時間以内

**DR構成（大阪リージョン）:**
```
Primary Region: ap-northeast-1 (東京)
DR Region: ap-northeast-3 (大阪)

DR構成:
  - RDS Cross-Region Read Replica
  - S3 Cross-Region Replication
  - AMI定期コピー
  - Infrastructure as Code (Terraform) で迅速再構築
```

**フェイルオーバー手順:**
```
1. 障害検知（自動/手動）
2. Route 53 Health Check失敗検知
3. 大阪リージョンのRead ReplicaをPromote
4. ECSサービスを大阪リージョンで起動
5. Route 53フェイルオーバーレコード切り替え
6. 稼働確認
```

### 8.3 データアーカイブ

**S3 Glacier移行ルール:**
```yaml
Rules:
  - Id: ArchiveOldUploads
    Prefix: uploads/
    Status: Enabled
    Transitions:
      - Days: 90
        StorageClass: GLACIER
      - Days: 365
        StorageClass: DEEP_ARCHIVE
    Expiration:
      Days: 2555  # 7年保管
```

---

## 9. スケーラビリティ設計

### 9.1 水平スケーリング

**ECS Auto Scaling:**
```yaml
MinCapacity: 2
MaxCapacity: 20
TargetTrackingScaling:
  - CPU使用率: 70%
  - メモリ使用率: 80%
  - ALB リクエスト数/ターゲット: 1000

StepScaling:
  - CPU > 90%: +5 tasks (即座)
  - CPU < 30% for 10min: -1 task (緩やか)
```

**RDS Auto Scaling (Storage):**
```yaml
Threshold: 90% storage used
Increment: 10%
Maximum: 2TB
```

### 9.2 Read/Write分離

**アプリケーション側実装:**
```typescript
// 書き込み → Primary
const writePrisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_PRIMARY }
  }
});

// 読み取り → Read Replica
const readPrisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL_REPLICA }
  }
});

// レポート生成はRead Replicaを使用
async function generateDailyReport() {
  const data = await readPrisma.deliveryExecution.findMany({
    where: { delivery_date: today }
  });
  // ...
}
```

### 9.3 キャッシュ戦略

**階層型キャッシュ:**
```
Request
  ↓
CloudFront (Edge Cache)
  ↓ (Cache Miss)
ALB
  ↓
Application
  ↓
Redis (L1 Cache - Hot Data)
  ↓ (Cache Miss)
Database
```

**キャッシュTTL設定:**
- マスタデータ: 1時間
- リアルタイム車両位置: 30秒
- 配送進捗: 5分
- レポートデータ: 10分

---

## 10. コスト設計

### 10.1 想定月額コスト（本番環境）

**小規模構成（配送車両20台、ユーザー50名）**

| サービス | スペック | 月額（USD） | 月額（JPY） |
|---------|---------|------------|------------|
| ECS Fargate | 0.5 vCPU x 1GB x 2タスク 24h | $73 | ¥10,950 |
| RDS PostgreSQL | db.t3.large Multi-AZ | $240 | ¥36,000 |
| ElastiCache Redis | cache.t3.medium x 2 | $85 | ¥12,750 |
| DocumentDB | db.t3.medium x 3 | $300 | ¥45,000 |
| ALB | 処理データ500GB | $40 | ¥6,000 |
| NAT Gateway | 2AZ x 100GB | $100 | ¥15,000 |
| S3 | 500GB Standard | $12 | ¥1,800 |
| CloudFront | 1TB転送 | $85 | ¥12,750 |
| CloudWatch | Logs 50GB, Metrics | $30 | ¥4,500 |
| Route 53 | 1 Hosted Zone | $1 | ¥150 |
| **合計** | | **$966** | **¥144,900** |

**中規模構成（配送車両100台、ユーザー200名）**

| サービス | スペック | 月額（USD） | 月額（JPY） |
|---------|---------|------------|------------|
| ECS Fargate | 1 vCPU x 2GB x 5タスク 24h | $365 | ¥54,750 |
| RDS PostgreSQL | db.r6g.xlarge Multi-AZ | $650 | ¥97,500 |
| ElastiCache Redis | cache.r6g.large x 2 | $280 | ¥42,000 |
| DocumentDB | db.r6g.large x 3 | $900 | ¥135,000 |
| ALB | 処理データ2TB | $100 | ¥15,000 |
| NAT Gateway | 2AZ x 500GB | $200 | ¥30,000 |
| S3 | 2TB Standard | $48 | ¥7,200 |
| CloudFront | 5TB転送 | $340 | ¥51,000 |
| CloudWatch | Logs 200GB, Metrics | $100 | ¥15,000 |
| **合計** | | **$2,983** | **¥447,450** |

※為替レート: 1 USD = 150 JPY換算

### 10.2 コスト最適化施策

**1. リザーブドインスタンス活用**
```
RDS: 1年契約で約40%削減
ElastiCache: 1年契約で約35%削減
→ 年間約$3,000削減
```

**2. Savings Plans（Compute）**
```
ECS Fargate: 1年契約で約20%削減
→ 年間約$500削減
```

**3. S3インテリジェントティアリング**
```
アクセス頻度に応じて自動的にストレージクラス変更
→ 月間約$20削減
```

**4. CloudWatch Logs保持期間最適化**
```
デバッグログ: 7日
エラーログ: 30日
アクセスログ: 14日
→ 月間約$30削減
```

**5. Spot Instances活用（非本番環境）**
```
ステージング環境でSpot Instances使用
→ 月間約$150削減
```

### 10.3 コスト監視

**AWS Cost Explorer設定:**
- 日次コストレポート
- サービス別コスト分析
- タグベース配分

**予算アラート:**
```yaml
Budget: $3,500/month
Alerts:
  - 80% ($2,800): Email通知
  - 100% ($3,500): Slack + Email通知
  - 120% ($4,200): 緊急通知
```

---

## 11. 運用設計

### 11.1 デプロイ戦略

**Blue-Greenデプロイ（ECS）:**
```
1. 新バージョンのタスクを起動（Green）
2. ヘルスチェック通過確認
3. ALBのトラフィックを徐々にGreenへ切り替え
4. 問題なければBlueを停止
5. 問題あればロールバック（Blueへ即座に切り戻し）
```

**データベースマイグレーション:**
```bash
# ゼロダウンタイムマイグレーション
1. 後方互換性のあるスキーマ変更を先行実施
2. アプリケーションデプロイ
3. 古いカラム/テーブルの削除（1週間後）
```

### 11.2 運用タスク

**日次:**
- ヘルスチェック確認
- エラーログレビュー
- バックアップ成功確認

**週次:**
- パフォーマンスレビュー
- セキュリティアラート確認
- コストレビュー

**月次:**
- 容量計画見直し
- バックアップリストアテスト
- 脆弱性スキャン

**四半期:**
- DRテスト実施
- インフラコスト最適化レビュー
- アーキテクチャ見直し

### 11.3 インシデント対応

**インシデントレベル:**

| レベル | 影響 | 対応時間 | 例 |
|--------|------|---------|---|
| P0 | サービス全停止 | 即座 | データベース障害 |
| P1 | 主要機能停止 | 1時間以内 | 配車計画作成不可 |
| P2 | 一部機能停止 | 4時間以内 | レポート生成遅延 |
| P3 | 軽微な問題 | 1営業日以内 | 表示の乱れ |

**エスカレーションフロー:**
```
検知 → 担当者調査 → 30分で解決不可 → チームリーダー
     → 1時間で解決不可 → マネージャー
     → 2時間で解決不可 → ベンダーサポート
```

---

## 12. Infrastructure as Code (IaC)

### 12.1 Terraformディレクトリ構成

```
terraform/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── stg/
│   └── prod/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ecs/
│   ├── rds/
│   ├── elasticache/
│   └── alb/
└── README.md
```

### 12.2 Terraform実装例

**VPCモジュール:**
```hcl
# modules/vpc/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-public-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
  }
}

resource "aws_subnet" "private_app" {
  count             = length(var.private_app_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_app_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-private-app-subnet-${count.index + 1}"
    Environment = var.environment
    Type        = "private-app"
  }
}

# NAT Gateway, Internet Gateway, Route Tables...
```

**本番環境設定:**
```hcl
# environments/prod/main.tf
terraform {
  backend "s3" {
    bucket         = "delivery-tracking-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

module "vpc" {
  source = "../../modules/vpc"

  project_name             = "delivery-tracking"
  environment              = "prod"
  vpc_cidr                 = "10.0.0.0/16"
  availability_zones       = ["ap-northeast-1a", "ap-northeast-1c"]
  public_subnet_cidrs      = ["10.0.1.0/24", "10.0.2.0/24"]
  private_app_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
  private_db_subnet_cidrs  = ["10.0.21.0/24", "10.0.22.0/24"]
}

module "rds" {
  source = "../../modules/rds"

  project_name      = "delivery-tracking"
  environment       = "prod"
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_db_subnet_ids
  instance_class    = "db.r6g.xlarge"
  allocated_storage = 500
  multi_az          = true
}
```

### 12.3 CI/CD（GitHub Actions）

```yaml
# .github/workflows/terraform-apply.yml
name: Terraform Apply

on:
  push:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.6.0
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
      
      - name: Terraform Init
        run: terraform init
        working-directory: terraform/environments/prod
      
      - name: Terraform Plan
        run: terraform plan -out=tfplan
        working-directory: terraform/environments/prod
      
      - name: Terraform Apply
        if: github.event_name == 'push'
        run: terraform apply -auto-approve tfplan
        working-directory: terraform/environments/prod
```

---

## 13. セキュリティコンプライアンス

### 13.1 AWS Well-Architected Framework準拠

**5つの柱:**

1. **運用の卓越性**
   - Infrastructure as Code
   - 自動デプロイメント
   - 監視とアラート

2. **セキュリティ**
   - 最小権限の原則
   - データ暗号化
   - ログ監査

3. **信頼性**
   - Multi-AZ構成
   - 自動バックアップ
   - DRサイト

4. **パフォーマンス効率**
   - Auto Scaling
   - キャッシュ戦略
   - CDN活用

5. **コスト最適化**
   - リザーブドインスタンス
   - 適切なサイジング
   - 不要リソース削除

### 13.2 コンプライアンス

**GDPR対応（個人情報保護）:**
- データ暗号化（保存時・通信時）
- アクセスログ記録
- データ削除機能実装

**ISMS（ISO 27001）対応:**
- アクセス制御
- 変更管理プロセス
- インシデント対応手順

---

## 14. 今後の拡張性

### 14.1 将来的な拡張計画

**Phase 1（現在）:**
- 基本的な配送管理機能
- 車両追跡
- レポート生成

**Phase 2（6ヶ月後）:**
- AI/ML活用した需要予測
- SageMakerで最適ルート学習
- リアルタイム交通情報連携

**Phase 3（1年後）:**
- IoTデバイス連携（車載センサー）
- ドローン配送対応
- マルチテナント化（複数企業対応）

### 14.2 スケールアウト戦略

**地理的拡張:**
```
現在: 日本国内のみ
将来: アジア太平洋地域
  → シンガポールリージョン追加
  → CloudFrontエッジロケーション活用
```

**データ量増加対応:**
```
現在: PostgreSQL単一DB
将来: シャーディング or Aurora Serverless v2
  → 読み取り負荷をRead Replica分散
  → 書き込み負荷を地域別DB分割
```

---

## 付録

### A. 用語集

| 用語 | 説明 |
|------|------|
| Multi-AZ | 複数のアベイラビリティゾーンに冗長化 |
| Auto Scaling | 負荷に応じて自動的にリソース増減 |
| RPO | 目標復旧時点（データ損失許容時間） |
| RTO | 目標復旧時間（サービス停止許容時間） |
| Blue-Green Deployment | 新旧環境を並行稼働させてリスク低減 |

### B. 参考資料

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Best Practices for DDoS Resiliency](https://d1.awsstatic.com/whitepapers/Security/DDoS_White_Paper.pdf)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

### C. 変更履歴

| 日付 | バージョン | 変更内容 | 作成者 |
|------|-----------|---------|--------|
| 2025-01-20 | 1.0 | 初版作成 | Infrastructure Team |
| 2025-01-21 | 1.1 | 開発環境・ステージング環境の詳細を追加 | Infrastructure Team |

---

**文書管理情報**
- 文書番号: INFRA-DESIGN-001
- バージョン: 1.1
- 承認者: CTOまたはインフラ責任者
- 次回レビュー: 2025-04-20（四半期ごと）
- 最終更新: 2025-01-21
