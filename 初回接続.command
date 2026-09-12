#!/bin/bash
cd "$(dirname "$0")"
echo "========================================"
echo " そなえ 在庫管理サイト｜GitHub 初回接続"
echo "========================================"
echo ""
echo "① 先にGitHubで空のリポジトリを作り、そのURLを貼ってください。"
echo "   例: https://github.com/あなたのユーザー名/sonae.git"
echo ""
read -r -p "リポジトリURL: " url
if [ -z "$url" ]; then echo "URLが空です。中止します。"; read -n1 -p "Enterで終了"; exit 1; fi
git remote remove origin 2>/dev/null
git remote add origin "$url"
git branch -M main
echo ""
echo "② これからGitHubへアップロードします。"
echo "   Username = GitHubユーザー名"
echo "   Password = 作成したトークン(PAT)を貼り付け（画面には出ません）"
echo ""
git push -u origin main
echo ""
if [ $? -eq 0 ]; then
  echo "✅ アップロード成功！"
  echo "   次に GitHub の Settings → Pages で公開してください（手順書参照）。"
else
  echo "⚠️ 失敗しました。URL・ユーザー名・トークンを確認して、もう一度実行してください。"
fi
read -n1 -p "Enterキーで終了"
