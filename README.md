# Kasanely

Kasanelyは、2つのWebサイトを視覚比較するビルド不要の静的HTMLツールです。`static/index.html` をブラウザで開くだけで使えます。

## 使い方

1. `static/index.html` を開きます。
2. 比較元URLと比較先URLを入力します。
3. 必要に応じてBasic認証を有効にし、ユーザー名とパスワードを入力します。
4. 表示サイズ、ページ全体の高さ、比較モードを選びます。
5. `読み込み` を押して比較します。

## 比較機能

- 横並び表示
- 重ね合わせ表示
- onion表示
- swipe表示
- 差分表示
- フルページ表示
- 左右ページの縦位置調整
- 比較先ページの横位置調整
- PC向けプリセット

## Basic認証について

静的HTMLではiframeに任意の`Authorization`ヘッダーを付けられません。Kasanelyは`https://user:pass@example.com/`形式のURLを生成して読み込みます。

対象サイトやブラウザがuserinfo付きURLを拒否する場合や、`X-Frame-Options` / `Content-Security-Policy` によってiframe表示が禁止されている場合は、ブラウザ側だけでは表示できません。その場合はサーバー側プロキシが必要です。

## SEO / LLMO対応

- `static/index.html` にタイトル、description、robots、OGP、Twitter Card、SoftwareApplication/WebApplicationのJSON-LDを追加しています。
- `static/robots.txt` で通常クローラとOpenAI系クローラのクロール許可を明示しています。
- `static/llms.txt` にAIエージェント向けの概要、主要機能、制限事項、主要ファイルを整理しています。
- 公開URLが決まったら、canonical、`og:url`、サイトマップURLを追加してください。
- 名前は一般Webの完全一致検索で明確な衝突が見当たりにくい造語として `Kasanely` を仮採用しています。商標、ドメイン、npm/GitHub等の正式な空き確認は公開前に別途行ってください。

## ファイル構成

- `static/index.html`: 画面構造とSEO/LLMOメタデータ
- `static/styles.css`: スタイル
- `static/app.js`: URL生成、表示切り替え、位置調整
- `static/robots.txt`: クローラ制御
- `static/llms.txt`: LLM向け概要
