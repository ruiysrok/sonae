#!/bin/bash
cd "$(dirname "$0")"
echo "======================================"
echo " そなえ｜GitHubへ安全にアップロード"
echo "======================================"
echo ""
# 接続先（未設定なら設定）
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/ruiysrok/sonae.git"
git branch -M main
git config credential.helper osxkeychain
echo "新しいトークン(github_pat_...)を貼り付けて Enter を押してください。"
echo "（安全のため、入力しても画面には何も表示されません）"
read -s tok
echo ""
if [ -z "$tok" ]; then echo "トークンが空です。中止します。"; read -n1 -p "Enterで終了"; exit 1; fi
# キーチェーンに保存（次回以降は入力不要になります）
printf "protocol=https\nhost=github.com\nusername=ruiysrok\npassword=%s\n\n" "$tok" | git credential-osxkeychain store
unset tok
echo "認証情報を保存しました。アップロードします…"
echo ""
git push -u origin main
code=$?
echo ""
if [ $code -eq 0 ]; then
  echo "✅ アップロード成功！"
  echo "   次に Pages を有効化してください（下のURL）:"
  echo "   https://github.com/ruiysrok/sonae/settings/pages"
else
  echo "⚠️ 失敗しました。トークンの権限(Contents: Read and write)と対象リポジトリ(sonae)を確認して、もう一度実行してください。"
fi
read -n1 -p "Enterキーで終了"
