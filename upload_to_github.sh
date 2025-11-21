#!/bin/bash
# GitHub Upload Script for Delivery Management System

echo "=== トラック配送管理システム - GitHub アップロード ==="
echo ""
echo "このスクリプトはGitHubへのアップロードを支援します"
echo ""

# ユーザー名入力
read -p "GitHubユーザー名を入力してください: " USERNAME

if [ -z "$USERNAME" ]; then
    echo "エラー: ユーザー名が入力されていません"
    exit 1
fi

# リポジトリ名
REPO_NAME="delivery-management-system"

echo ""
echo "リポジトリURL: https://github.com/$USERNAME/$REPO_NAME"
echo ""
echo "以下の手順で進めます："
echo "1. リモートリポジトリを追加"
echo "2. ブランチ名をmainに変更"
echo "3. GitHubへプッシュ"
echo ""
read -p "続行しますか? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "キャンセルしました"
    exit 0
fi

# リモート追加
echo ""
echo "リモートリポジトリを追加中..."
git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✓ リモートリポジトリを追加しました"
else
    echo "⚠ リモートリポジトリは既に存在します（スキップ）"
fi

# ブランチ名変更
echo ""
echo "ブランチ名をmainに変更中..."
git branch -M main

echo "✓ ブランチ名を変更しました"

# プッシュ
echo ""
echo "GitHubへプッシュ中..."
echo "（Personal Access Tokenの入力が必要な場合があります）"
echo ""

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "=== アップロード完了 ==="
    echo "✓ リポジトリURL: https://github.com/$USERNAME/$REPO_NAME"
    echo ""
else
    echo ""
    echo "=== エラーが発生しました ==="
    echo ""
    echo "以下を確認してください："
    echo "1. GitHubで $REPO_NAME リポジトリを作成済みか"
    echo "   → https://github.com/new"
    echo "2. Personal Access Tokenが正しいか"
    echo "   → https://github.com/settings/tokens"
    echo ""
fi
