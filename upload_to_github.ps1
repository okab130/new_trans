# GitHub Upload Script for Delivery Management System (Windows PowerShell)

Write-Host "=== トラック配送管理システム - GitHub アップロード ===" -ForegroundColor Green
Write-Host ""
Write-Host "このスクリプトはGitHubへのアップロードを支援します"
Write-Host ""

# ユーザー名入力
$USERNAME = Read-Host "GitHubユーザー名を入力してください"

if ([string]::IsNullOrEmpty($USERNAME)) {
    Write-Host "エラー: ユーザー名が入力されていません" -ForegroundColor Red
    exit 1
}

# リポジトリ名
$REPO_NAME = "delivery-management-system"

Write-Host ""
Write-Host "リポジトリURL: https://github.com/$USERNAME/$REPO_NAME" -ForegroundColor Cyan
Write-Host ""
Write-Host "以下の手順で進めます："
Write-Host "1. リモートリポジトリを追加"
Write-Host "2. ブランチ名をmainに変更"
Write-Host "3. GitHubへプッシュ"
Write-Host ""
$CONFIRM = Read-Host "続行しますか? (y/n)"

if ($CONFIRM -ne "y") {
    Write-Host "キャンセルしました" -ForegroundColor Yellow
    exit 0
}

# ディレクトリ移動
Set-Location "C:\Users\user\gh\new_trans"

# リモート追加
Write-Host ""
Write-Host "リモートリポジトリを追加中..." -ForegroundColor Cyan
try {
    git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git" 2>&1 | Out-Null
    Write-Host "✓ リモートリポジトリを追加しました" -ForegroundColor Green
} catch {
    Write-Host "⚠ リモートリポジトリは既に存在します（スキップ）" -ForegroundColor Yellow
}

# ブランチ名変更
Write-Host ""
Write-Host "ブランチ名をmainに変更中..." -ForegroundColor Cyan
git branch -M main
Write-Host "✓ ブランチ名を変更しました" -ForegroundColor Green

# プッシュ
Write-Host ""
Write-Host "GitHubへプッシュ中..." -ForegroundColor Cyan
Write-Host "（Personal Access Tokenの入力が必要な場合があります）" -ForegroundColor Yellow
Write-Host ""

$result = git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== アップロード完了 ===" -ForegroundColor Green
    Write-Host "✓ リポジトリURL: https://github.com/$USERNAME/$REPO_NAME" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "=== エラーが発生しました ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "以下を確認してください："
    Write-Host "1. GitHubで $REPO_NAME リポジトリを作成済みか"
    Write-Host "   → https://github.com/new"
    Write-Host "2. Personal Access Tokenが正しいか"
    Write-Host "   → https://github.com/settings/tokens"
    Write-Host ""
    Write-Host "エラー詳細："
    Write-Host $result -ForegroundColor Gray
}
