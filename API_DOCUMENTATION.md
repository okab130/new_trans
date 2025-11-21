# 📡 API仕様書 - トラック配送管理システム

バックエンドAPIの詳細仕様です。

## 📋 目次

1. [概要](#概要)
2. [認証](#認証)
3. [エンドポイント一覧](#エンドポイント一覧)
4. [詳細仕様](#詳細仕様)
5. [エラーレスポンス](#エラーレスポンス)
6. [使用例](#使用例)

---

## 概要

### ベースURL

```
開発環境: http://localhost:3000/api/v1
本番環境: https://api.example.com/api/v1
```

### リクエスト形式

- **Content-Type**: `application/json`
- **文字エンコーディング**: UTF-8
- **日時形式**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)

### レスポンス形式

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "timestamp": "2025-01-20T12:00:00.000Z"
}
```

---

## 認証

### 認証方式

JWT (JSON Web Token) Bearer認証

### ヘッダー

```
Authorization: Bearer <token>
```

### トークン取得

ログインAPIでトークンを取得します。

---

## エンドポイント一覧

### ヘルスチェック

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/health` | 不要 | サーバー状態確認 |

### 認証

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| POST | `/auth/login` | 不要 | ログイン |
| POST | `/auth/logout` | 必要 | ログアウト |
| POST | `/auth/refresh` | 必要 | トークン更新 |
| GET | `/auth/me` | 必要 | 現在のユーザー情報 |

### 配送依頼

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/delivery-orders` | 必要 | 一覧取得 |
| GET | `/delivery-orders/:id` | 必要 | 詳細取得 |
| POST | `/delivery-orders` | 必要 | 新規作成 |
| PUT | `/delivery-orders/:id` | 必要 | 更新 |
| DELETE | `/delivery-orders/:id` | 必要 | 削除 |
| GET | `/delivery-orders/stats` | 必要 | 統計情報 |

### 配車計画

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/delivery-plans` | 必要 | 一覧取得 |
| GET | `/delivery-plans/:id` | 必要 | 詳細取得 |
| POST | `/delivery-plans` | 必要 | 新規作成 |
| PUT | `/delivery-plans/:id` | 必要 | 更新 |
| POST | `/delivery-plans/:id/optimize` | 必要 | ルート最適化 |

### 配送ルート

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/delivery-routes` | 必要 | 一覧取得 |
| GET | `/delivery-routes/:id` | 必要 | 詳細取得 |
| POST | `/delivery-routes` | 必要 | 新規作成 |
| PUT | `/delivery-routes/:id` | 必要 | 更新 |

### 配送実績

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/delivery-executions` | 必要 | 一覧取得 |
| GET | `/delivery-executions/:id` | 必要 | 詳細取得 |
| POST | `/delivery-executions` | 必要 | 新規登録 |
| PUT | `/delivery-executions/:id` | 必要 | 更新 |
| POST | `/delivery-executions/:id/signature` | 必要 | 電子サイン登録 |
| POST | `/delivery-executions/:id/photo` | 必要 | 配送証跡写真登録 |

### マスタデータ

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/customers` | 必要 | 顧客一覧 |
| GET | `/vehicles` | 必要 | 車両一覧 |
| GET | `/drivers` | 必要 | ドライバー一覧 |
| GET | `/delivery-locations` | 必要 | 配送先一覧 |

---

## 詳細仕様

### 1. ヘルスチェック

#### `GET /health`

サーバーの状態を確認します。

**リクエスト**: なし

**レスポンス**:

```json
{
  "status": "ok",
  "timestamp": "2025-01-20T12:00:00.000Z",
  "version": "1.0.0",
  "database": "connected"
}
```

---

### 2. 認証

#### `POST /auth/login`

ログインしてトークンを取得します。

**リクエスト**:

```json
{
  "loginId": "user001",
  "password": "password123"
}
```

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 604800,
    "user": {
      "id": "uuid-1234",
      "loginId": "user001",
      "name": "山田太郎",
      "role": "DISPATCHER",
      "branchId": "uuid-branch-1"
    }
  }
}
```

---

### 3. 配送依頼

#### `GET /delivery-orders`

配送依頼の一覧を取得します。

**クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|----------|----|----|------|
| page | number | × | ページ番号（デフォルト: 1） |
| limit | number | × | 取得件数（デフォルト: 20） |
| status | string | × | ステータスフィルタ |
| customerId | string | × | 顧客IDフィルタ |
| dateFrom | string | × | 配送日開始（YYYY-MM-DD） |
| dateTo | string | × | 配送日終了（YYYY-MM-DD） |
| sortBy | string | × | ソート項目 |
| sortOrder | string | × | ソート順（asc/desc） |

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid-order-1",
        "orderNumber": "ORD-20250120-001",
        "status": "PLANNING",
        "customerId": "uuid-customer-1",
        "customer": {
          "id": "uuid-customer-1",
          "customerCode": "C001",
          "name": "株式会社ABC商事"
        },
        "deliveryLocationId": "uuid-location-1",
        "deliveryLocation": {
          "id": "uuid-location-1",
          "locationName": "ABC商事 東京支店",
          "address": "東京都千代田区...",
          "latitude": 35.6812,
          "longitude": 139.7671
        },
        "requestedDeliveryDate": "2025-01-25",
        "requestedTimeFrom": "09:00:00",
        "requestedTimeTo": "12:00:00",
        "totalWeight": 500.5,
        "totalVolume": 2.5,
        "itemCount": 10,
        "specialInstructions": "午前中配送希望",
        "createdAt": "2025-01-20T10:00:00.000Z",
        "updatedAt": "2025-01-20T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### `GET /delivery-orders/:id`

配送依頼の詳細を取得します。

**パスパラメータ**:

- `id`: 配送依頼ID（UUID）

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-order-1",
    "orderNumber": "ORD-20250120-001",
    "status": "PLANNING",
    "customer": { ... },
    "deliveryLocation": { ... },
    "items": [
      {
        "id": "uuid-item-1",
        "itemName": "商品A",
        "quantity": 10,
        "weight": 50.5,
        "volume": 0.25
      }
    ],
    "requestedDeliveryDate": "2025-01-25",
    "requestedTimeFrom": "09:00:00",
    "requestedTimeTo": "12:00:00",
    "totalWeight": 500.5,
    "totalVolume": 2.5,
    "itemCount": 10,
    "specialInstructions": "午前中配送希望",
    "createdAt": "2025-01-20T10:00:00.000Z",
    "updatedAt": "2025-01-20T10:00:00.000Z"
  }
}
```

#### `POST /delivery-orders`

新しい配送依頼を作成します。

**リクエスト**:

```json
{
  "customerId": "uuid-customer-1",
  "deliveryLocationId": "uuid-location-1",
  "requestedDeliveryDate": "2025-01-25",
  "requestedTimeFrom": "09:00",
  "requestedTimeTo": "12:00",
  "specialInstructions": "午前中配送希望",
  "items": [
    {
      "itemName": "商品A",
      "quantity": 10,
      "weight": 50.5,
      "volume": 0.25
    },
    {
      "itemName": "商品B",
      "quantity": 20,
      "weight": 100.0,
      "volume": 0.5
    }
  ]
}
```

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-order-new",
    "orderNumber": "ORD-20250120-150",
    "status": "PLANNING",
    "totalWeight": 2050.5,
    "totalVolume": 7.5,
    "itemCount": 30,
    "createdAt": "2025-01-20T15:00:00.000Z"
  },
  "message": "配送依頼を作成しました"
}
```

#### `PUT /delivery-orders/:id`

配送依頼を更新します。

**リクエスト**:

```json
{
  "requestedDeliveryDate": "2025-01-26",
  "requestedTimeFrom": "13:00",
  "requestedTimeTo": "17:00",
  "specialInstructions": "午後配送に変更"
}
```

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "id": "uuid-order-1",
    "orderNumber": "ORD-20250120-001",
    "status": "PLANNING",
    "updatedAt": "2025-01-20T16:00:00.000Z"
  },
  "message": "配送依頼を更新しました"
}
```

#### `DELETE /delivery-orders/:id`

配送依頼を削除します。

**レスポンス**:

```json
{
  "success": true,
  "message": "配送依頼を削除しました"
}
```

#### `GET /delivery-orders/stats`

配送依頼の統計情報を取得します。

**クエリパラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|----------|----|----|------|
| dateFrom | string | × | 集計開始日 |
| dateTo | string | × | 集計終了日 |

**レスポンス**:

```json
{
  "success": true,
  "data": {
    "total": 150,
    "byStatus": {
      "PLANNING": 45,
      "ASSIGNED": 35,
      "IN_PROGRESS": 25,
      "COMPLETED": 40,
      "CANCELLED": 5
    },
    "totalWeight": 50000.5,
    "totalVolume": 250.5,
    "averageWeight": 333.34
  }
}
```

---

## エラーレスポンス

### 形式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": { ... }
  },
  "timestamp": "2025-01-20T12:00:00.000Z"
}
```

### HTTPステータスコード

| コード | 説明 |
|-------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 400 | リクエストエラー |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソースが見つからない |
| 409 | 競合エラー |
| 422 | バリデーションエラー |
| 500 | サーバーエラー |

### エラーコード

| コード | 説明 |
|-------|------|
| `VALIDATION_ERROR` | 入力値検証エラー |
| `AUTHENTICATION_ERROR` | 認証エラー |
| `AUTHORIZATION_ERROR` | 権限エラー |
| `NOT_FOUND` | リソースが見つからない |
| `DUPLICATE_ERROR` | 重複エラー |
| `DATABASE_ERROR` | データベースエラー |
| `INTERNAL_ERROR` | 内部サーバーエラー |

### バリデーションエラーの例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": {
      "customerId": "顧客IDは必須です",
      "requestedDeliveryDate": "日付形式が不正です"
    }
  },
  "timestamp": "2025-01-20T12:00:00.000Z"
}
```

---

## 使用例

### cURLでの使用例

#### ログイン

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginId": "user001",
    "password": "password123"
  }'
```

#### 配送依頼一覧取得

```bash
curl -X GET "http://localhost:3000/api/v1/delivery-orders?page=1&limit=20&status=PLANNING" \
  -H "Authorization: Bearer <token>"
```

#### 配送依頼作成

```bash
curl -X POST http://localhost:3000/api/v1/delivery-orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "uuid-customer-1",
    "deliveryLocationId": "uuid-location-1",
    "requestedDeliveryDate": "2025-01-25",
    "requestedTimeFrom": "09:00",
    "requestedTimeTo": "12:00",
    "items": [
      {
        "itemName": "商品A",
        "quantity": 10,
        "weight": 50.5,
        "volume": 0.25
      }
    ]
  }'
```

### JavaScriptでの使用例

```javascript
// ログイン
const login = async () => {
  const response = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      loginId: 'user001',
      password: 'password123',
    }),
  });
  const data = await response.json();
  return data.data.token;
};

// 配送依頼取得
const getDeliveryOrders = async (token) => {
  const response = await fetch('http://localhost:3000/api/v1/delivery-orders', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data.data.orders;
};
```

---

## バージョニング

APIバージョンはURLパスに含まれます：

- **v1**: `/api/v1/...` （現在のバージョン）
- **v2**: `/api/v2/...` （今後の予定）

---

## レート制限

現在、レート制限は実装されていませんが、将来的に以下を予定：

- **認証あり**: 100リクエスト/分
- **認証なし**: 20リクエスト/分

---

**最終更新**: 2025-01-20  
**APIバージョン**: v1.0.0
