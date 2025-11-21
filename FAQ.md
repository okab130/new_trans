# ❓ よくある質問（FAQ）

## 📋 目次

- [一般的な質問](#一般的な質問)
- [セットアップに関する質問](#セットアップに関する質問)
- [開発に関する質問](#開発に関する質問)
- [トラブルシューティング](#トラブルシューティング)
- [機能に関する質問](#機能に関する質問)

---

## 一般的な質問

### Q: このシステムは何ができますか？

A: トラック配送計画・配送実績追跡システムは、以下の機能を提供します：

- 配送依頼の管理
- 配車計画の作成と最適化
- リアルタイム配送追跡
- 配送実績の記録と分析
- KPIダッシュボード
- ドライバー向けモバイルアプリ

詳細は [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) を参照してください。

### Q: どのような企業向けですか？

A: 主に以下の企業向けです：

- 物流企業
- 配送業者
- 運送会社
- ECサイト運営企業（自社配送）

### Q: ライセンスは何ですか？

A: このプロジェクトはプロプライエタリ（社内システム）です。商用利用には別途契約が必要です。

### Q: 対応言語は？

A: 現在は日本語のみ対応しています。多言語対応は今後の計画に含まれています。

---

## セットアップに関する質問

### Q: 必要な技術スキルは？

A: 以下のスキルがあると理解しやすいです：

- **バックエンド**: Node.js, TypeScript, Express, Prisma
- **フロントエンド**: React, Redux, TypeScript
- **データベース**: PostgreSQL
- **その他**: Git, Docker（オプション）

### Q: セットアップにどのくらい時間がかかりますか？

A: 環境によりますが：

- **既存環境あり**: 30分〜1時間
- **初めてのセットアップ**: 1〜2時間
- **Docker使用**: 15〜30分

詳細は [SETUP_GUIDE.md](./SETUP_GUIDE.md) を参照してください。

### Q: Windowsでも動作しますか？

A: はい、Windows 10/11で動作します。以下のツールを使用：

- PowerShell
- WSL2（オプション）
- Docker Desktop（オプション）

### Q: Macでも動作しますか？

A: はい、macOS 11以降で動作します。

### Q: Linuxでも動作しますか？

A: はい、Ubuntu 20.04以降、その他の主要なLinuxディストリビューションで動作します。

### Q: PostgreSQLの代わりにMySQLは使えますか？

A: 現在はPostgreSQLのみサポートしています。Prismaを使用しているため、理論的にはMySQLも可能ですが、テストしていません。

---

## 開発に関する質問

### Q: どこから開発を始めればいいですか？

A: 以下の順序をお勧めします：

1. [SETUP_GUIDE.md](./SETUP_GUIDE.md) でセットアップ
2. `mockups/` フォルダで画面イメージを確認
3. 設計ドキュメント（01〜05）を読む
4. バックエンドAPIを確認（[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)）
5. 機能追加

### Q: テストはどう書けばいいですか？

A: 以下を参照：

- [TESTING.md](./TESTING.md) - テストガイド
- `backend/tests/api.test.ts` - テスト例

```typescript
// テスト例
describe('配送依頼API', () => {
  it('一覧取得ができる', async () => {
    const response = await request(app).get('/api/v1/delivery-orders');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Q: 新しい機能を追加するには？

A: 以下の手順：

1. **設計**: 仕様を検討
2. **データモデル**: Prismaスキーマ更新
3. **バックエンド**: API実装
4. **フロントエンド**: UI実装
5. **テスト**: ユニットテスト追加
6. **ドキュメント**: 更新

### Q: コーディング規約は？

A: 以下を遵守：

- ESLint + Prettier を使用
- TypeScript strict mode 有効
- Conventional Commits形式でコミット
- 関数・変数名は英語
- コメントは日本語OK

### Q: Git ブランチ戦略は？

A: Git Flowを推奨：

```bash
main            # 本番環境
develop         # 開発環境
feature/xxx     # 機能開発
bugfix/xxx      # バグ修正
hotfix/xxx      # 緊急修正
```

---

## トラブルシューティング

### Q: `npm install` でエラーが出ます

A: 以下を試してください：

```bash
# キャッシュクリア
npm cache clean --force

# node_modules削除
rm -rf node_modules package-lock.json

# 再インストール
npm install
```

### Q: `prisma migrate dev` でエラーが出ます

A: データベース接続を確認：

```bash
# PostgreSQL起動確認
psql -U postgres -c "SELECT version();"

# .envファイル確認
cat backend/.env

# Prismaクライアント再生成
npx prisma generate
```

### Q: ポート3000が使用中です

A: 以下で解決：

```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

### Q: フロントエンドが真っ白です

A: 以下を確認：

1. ブラウザのコンソール（F12）でエラー確認
2. バックエンドが起動しているか確認
3. CORS設定を確認
4. 環境変数を確認

### Q: データベースに接続できません

A: 以下を確認：

```bash
# PostgreSQL起動確認
sudo systemctl status postgresql  # Linux
Get-Service postgresql*           # Windows

# 接続テスト
psql -U delivery_user -d delivery_management

# .envファイルのDATABASE_URLを確認
```

### Q: Redisに接続できません

A: Redisはオプションです。開発環境では不要です。

```bash
# Redis起動確認
redis-cli ping

# Dockerで起動
docker run -d -p 6379:6379 redis:7-alpine
```

---

## 機能に関する質問

### Q: ルート最適化機能はありますか？

A: 現在は基本実装のみです。高度な最適化アルゴリズムは今後実装予定です。

### Q: リアルタイム追跡はどう実装しますか？

A: WebSocketを使用した実装を計画中です：

- Socket.io
- GPS位置情報の定期送信
- 地図上でのリアルタイム表示

### Q: モバイルアプリはありますか？

A: 現在はHTMLモックアップのみです。React Nativeでの開発を予定しています。

### Q: 電子サインはどう実装しますか？

A: Canvasベースの手書きサイン機能を実装予定：

- `mockups/08_mobile_signature.html` で動作確認可能
- Base64エンコードでサーバーに送信
- 画像ファイルとして保存

### Q: 写真アップロード機能は？

A: 配送証跡写真のアップロード機能を計画中：

- カメラAPI連携
- S3/クラウドストレージ保存
- サムネイル生成

### Q: レポート機能はありますか？

A: 基本的な統計情報APIがあります。詳細レポートは今後実装予定：

- PDF生成
- Excel出力
- グラフ・チャート
- カスタムレポート

### Q: 多拠点対応していますか？

A: はい、データモデルに組織・拠点の概念があります。

- Organization（組織）
- Branch（拠点）
- 拠点別のデータ管理

### Q: ユーザー権限管理は？

A: 基本的なロール管理があります：

- ADMIN（管理者）
- DISPATCHER（配車担当）
- DRIVER（ドライバー）
- VIEWER（閲覧のみ）

### Q: API認証方式は？

A: JWT（JSON Web Token）ベアラー認証を使用：

```http
Authorization: Bearer <token>
```

---

## パフォーマンスに関する質問

### Q: 何件のデータまで扱えますか？

A: データベース設計上、以下を想定：

- 配送依頼: 数百万件
- 配送実績: 数千万件
- 同時接続ユーザー: 100人程度

大規模運用にはインデックス最適化とキャッシュ戦略が必要です。

### Q: レスポンスタイムの目標は？

A: 以下を目標：

- API: 200ms以内
- 画面表示: 1秒以内
- 一覧取得: 500ms以内

---

## セキュリティに関する質問

### Q: セキュリティ対策は？

A: 以下を実装：

- JWT認証
- パスワードハッシュ化（bcrypt）
- HTTPS通信
- SQL インジェクション対策（Prisma）
- XSS対策
- CSRF トークン（計画中）

### Q: 個人情報保護は？

A: 以下に準拠：

- 個人情報は暗号化保存
- アクセスログ記録
- 定期的なセキュリティ監査

---

## デプロイに関する質問

### Q: 本番環境のデプロイ方法は？

A: [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

以下の方法をサポート：

- Docker + Docker Compose
- AWS (ECS, RDS, ElastiCache)
- Heroku
- Vercel (フロントエンド)

### Q: CDN は使えますか？

A: はい、フロントエンドの静的ファイルはCDN推奨：

- CloudFront (AWS)
- Cloudflare
- Fastly

### Q: バックアップ戦略は？

A: 以下を推奨：

- **データベース**: 毎日自動バックアップ
- **ファイル**: S3同期
- **設定**: Git管理

---

## その他

### Q: ドキュメントはどこにありますか？

A: 以下のドキュメントがあります：

| ドキュメント | 説明 |
|------------|------|
| README.md | プロジェクト概要 |
| SETUP_GUIDE.md | セットアップ手順 |
| API_DOCUMENTATION.md | API仕様 |
| TESTING.md | テストガイド |
| DEPLOYMENT.md | デプロイ手順 |
| PROJECT_SUMMARY.md | プロジェクト詳細 |
| FAQ.md | よくある質問（このファイル） |

### Q: サポートはありますか？

A: GitHubリポジトリのIssueで質問できます：

https://github.com/okab130/new_trans/issues

### Q: 貢献するには？

A: Pull Requestを歓迎します：

1. Forkする
2. feature ブランチ作成
3. 変更をコミット
4. Pull Request作成

### Q: 更新頻度は？

A: 現在は開発初期段階です。定期的な更新を計画中。

---

## 質問が解決しない場合

1. **既存Issue確認**: https://github.com/okab130/new_trans/issues
2. **新しいIssue作成**: 問題を詳しく記述
3. **ドキュメント再確認**: 見落としがないか確認

---

**最終更新**: 2025-01-20  
**バージョン**: 1.0.0
