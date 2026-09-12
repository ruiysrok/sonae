#!/bin/bash
# 使い方: ./deploy.sh "変更メモ"（メモは省略可）
set -e
cd "$(dirname "$0")"
git add -A
if git diff --cached --quiet; then echo "変更なし"; exit 0; fi
git commit -m "${1:-update}"
git push
echo "✅ デプロイ完了（1〜2分で公開URLに反映されます）"
