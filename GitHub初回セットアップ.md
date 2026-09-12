# GitHub Pages 初回セットアップ（1回だけ）

これを一度やれば、以降の更新は自動で反映できるようになります。
所要 約10分。むずかしい所は「初回接続.command」がやってくれます。

---

## ステップ1：GitHubアカウント（持っていれば飛ばす）
https://github.com/signup で無料登録。

## ステップ2：空のリポジトリを作る
1. 右上「＋」→ **New repository**
2. Repository name：`sonae`（好きな名前でOK。これがURLの一部になります）
3. **Public** を選択
4. ❗ **「Add a README」等にはチェックを入れない**（空のまま作る）
5. **Create repository**
6. 次の画面に出る `https://github.com/ユーザー名/sonae.git` を控える

## ステップ3：トークン（PAT）を作る ＝ パスワード代わり
1. https://github.com/settings/tokens?type=beta を開く（Fine-grained tokens）
2. **Generate new token**
3. Token name：`sonae-deploy` / Expiration：お好み（90日など）
4. **Repository access** → Only select repositories → さっきの `sonae` を選ぶ
5. **Permissions** → Repository permissions → **Contents** を **Read and write** に
6. **Generate token** → 表示された `github_pat_...` を**コピー**（この画面でしか見られません）

## ステップ4：接続（ダブルクリック）
1. このフォルダの **`初回接続.command`** をダブルクリック
   - 開けない時：右クリック →「開く」→「開く」
2. 聞かれたら **リポジトリURL**（ステップ2の `...sonae.git`）を貼る
3. 次に
   - **Username**：GitHubユーザー名
   - **Password**：ステップ3でコピーした**トークンを貼り付け**（画面には出ません）
4. 「✅ アップロード成功！」が出ればOK

## ステップ5：公開（Pages を有効化）
1. GitHubの `sonae` リポジトリ → **Settings** → 左メニュー **Pages**
2. Source：**Deploy from a branch**
3. Branch：**main** ／ フォルダ：**/ (root)** → **Save**
4. 1〜2分待つと、上部に公開URLが出ます：
   ```
   https://ユーザー名.github.io/sonae/
   ```

---

## 完了後：今後の更新について
- ここまで済んだら、**ユーザー名と決めたリポジトリ名を私に教えてください**。
- 以降は、アプリを直したら私が `deploy.sh` を実行して**自動でGitHubへ反映**します
  （あなたの操作は不要）。
- ご自身で更新したい時も、このフォルダで `./deploy.sh "変更メモ"` を実行するだけ。

## うまくいかない時
- 「認証エラー」→ トークンの権限（Contents: Read and write）と対象リポジトリを確認
- 「repository not found」→ 貼ったURLのユーザー名/リポジトリ名を確認
- それでもダメなら、画面の内容をそのまま教えてください。
