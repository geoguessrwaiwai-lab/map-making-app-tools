# コントリビューションガイド

Map Making App Toolsへの不具合報告、改善案、質問、Pull Requestを歓迎します。

## Issueを作成する

- 作成前に同じ内容のIssueがないか検索する
- 不具合報告にはOS、Chromeのバージョン、対象ページのURL形式、再現手順、期待した動作、実際の動作を含める
- スクリーンショットやログにマップ名、ユーザー名などの個人情報を含めない
- セキュリティに関わる詳細は公開Issueへ書かず、[`SECURITY.md`](SECURITY.md)の手順で報告する

## Pull Requestを作成する

1. リポジトリをforkし、変更用ブランチを作成します。
2. 1つのPull Requestを1つの目的に絞ります。
3. 関連文書を更新し、検証を実行します。
4. Pull Requestテンプレートに沿って、変更理由と確認結果を記載します。

権限、外部通信、データ収集に関わる変更は、実装前にIssueで相談してください。

## ローカルで動かす

### リポジトリから読み込む

```bash
git clone https://github.com/geoguessrwaiwai-lab/map-making-app-tools.git
cd map-making-app-tools
npm install
make unpacked
```

Chromeで`chrome://extensions/`を開き、「デベロッパー モード」を有効にしてから「パッケージ化されていない拡張機能を読み込む」で`dist/map-making-app-tools-unpacked`を指定します。ソース変更後は再度`make unpacked`を実行し、拡張機能と対象ページを再読み込みしてください。

### ZIPから読み込む（git不要）

1. [リポジトリのZIP](https://github.com/geoguessrwaiwai-lab/map-making-app-tools/archive/refs/heads/main.zip)をダウンロードして展開する
2. 上記と同じ手順で、展開した`map-making-app-tools-main`フォルダを読み込む

ZIPファイルのままでは読み込めません。先に展開してください。

## 開発方針

- 外部ライブラリを追加しない
- 対象URLと対象要素を安易に広げない
- 25%〜75%の制約、グリッドのgapを考慮した計算、SPA遷移時の後片付けを維持する
- 動作が変わる場合はREADMEと、[`browser-extensions-site`](https://github.com/geoguessrwaiwai-lab/browser-extensions-site)で管理する案内サイト・プライバシーポリシーも更新する
- `dist/`内の生成物をコミットしない

## フォーマット

JavaScript/CSS/HTMLはPrettierで統一しています。初回のみ`npm install`を実行してください。VSCodeで開く場合は`esbenp.prettier-vscode`拡張機能（`.vscode/extensions.json`で推奨）を入れるとformat on saveで自動整形されます。

```bash
npm install
make format       # 書き換える
make format-check # 崩れていないかだけ確認する
```

## 検証

```bash
make validate       # 構造、構文、Manifest、安全性を検証
make unpacked       # Chromeから直接読み込むフォルダを生成
make package        # Chrome Web Store提出用ZIPを生成
make clean          # 生成物を削除
```

`make validate`は`make format-check`を含むため、フォーマットが崩れていると失敗します。Node.js、`make`、`zip`を使用し、npmやyarnによる依存関係のインストールは不要です（Prettierを使う`format`/`format-check`のみ、初回に`npm install`が必要です）。
