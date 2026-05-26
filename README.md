# diffsite static

2つのWebサイトを視覚比較する、ビルド不要の静的ツールです。`static/index.html` をブラウザで開くだけで使えます。

## 使い方

1. `static/index.html` を開きます。
2. 比較元URLと比較先URLを入力します。
3. 必要に応じて Basic認証を有効にし、ユーザー名とパスワードを入力します。
4. 表示サイズ、ページ全体の高さ、比較モードを選びます。
5. `読み込み` を押して比較します。

## 比較機能

- 横並び表示
- 重ね合わせ表示
- onion 表示
- swipe 表示
- 差分表示
- ファーストビュー線
- 左右ページの縦位置調整
- 比較先ページの横位置調整
- PC/SP向けプリセット

## Basic認証について

静的HTMLでは iframe に任意の `Authorization` ヘッダーを付けられません。このツールは `https://user:pass@example.com/` 形式のURLを生成して読み込みます。

対象サイトやブラウザが userinfo 付きURLを拒否する場合や、`X-Frame-Options` / `Content-Security-Policy` によって iframe 表示が禁止されている場合は、ブラウザ側だけでは表示できません。その場合はサーバー側プロキシが必要です。

## ファイル構成

- `static/index.html`: 画面構造
- `static/styles.css`: スタイル
- `static/app.js`: URL生成、表示切り替え、位置調整
