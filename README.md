# Map Making App Tools

Map Making Appのマップ編集画面で、左右50%ずつに固定されているペイン幅をドラッグして変更するChrome拡張機能です。

左ペインは25%〜75%の範囲で変更できます。Manifest V3のローカル拡張機能として動作し、外部ライブラリやビルド処理は必要ありません。

本プロジェクトは非公式であり、Map Making Appまたはその運営者との提携、承認、関係を示すものではありません。

- [案内サイト](https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/)
- [拡張機能のソースをダウンロード](https://github.com/geoguessrwaiwai-lab/map-making-app-tools/archive/refs/heads/main.zip)

## 動作仕様

| 操作 | 動作 |
| --- | --- |
| 境界線を左右へドラッグ | 左右ペインの幅を変更 |
| 左右の矢印キー | 1%ずつ変更 |
| Shift + 左右の矢印キー | 5%ずつ変更 |
| Home | 左ペインを25%に変更 |
| End | 左ペインを75%に変更 |

- 対象URL: `https://map-making.app/maps/数字`
- 対象要素: `.page-map-editor`
- 画面幅801px以上でのみ有効（800px以下ではハンドルを外して元のレイアウトへ戻す）
- 左ペインの範囲: 25%〜75%
- カラム間の`gap`を除いた領域を100%として計算
- `minmax(0, …fr)`を使用し、内容由来の最小幅でカラムが止まらないようにする
- 直下のグリッドアイテムへ`min-width: 0`を適用する
- 右カラムが640px以下になると、位置プレビューの日時選択と操作ボタンをContainer Queryで縦積みにする
- 収まりきらない横幅は右カラム内だけでスクロールさせ、ページ全体の横スクロールを防ぐ
- 既存のグリッドエリアと行構成は変更しない
- SPAの画面遷移や対象要素の再生成に追従

## セキュリティとプライバシー

この拡張機能は次の制約を維持します。

- `permissions`と`host_permissions`を追加しない
- 対象URLと`.page-map-editor`が揃った場合だけ有効化する
- 外部通信、外部JavaScript、Cookie、ストレージ、分析ツールを使用しない
- マップ情報、入力内容、閲覧履歴を読み取り、記録、保存、送信しない
- ポインター位置はドラッグ中の幅計算にだけ一時的に使用する
- background、service worker、popup、optionsページを追加しない

詳しくは[プライバシーポリシー](https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/privacy/)をご覧ください。

## ディレクトリ構成

```text
map-making-app-tools/
├── manifest.json                 # Manifest V3設定
├── content.js                    # リサイズ操作とSPA追従
├── content.css                   # 境界線とドラッグ中の表示
├── icon16.png                    # Chrome用アイコン
├── icon32.png
├── icon48.png
├── icon128.png
├── artwork/                      # アイコン・ストア画像の編集可能な原本
├── scripts/validate.mjs          # 構造・構文・安全性の検証
├── Makefile                      # 検証とZIP生成
├── store-assets/                 # Chrome Web Store掲載画像
├── docs/MAINTAINING.md           # リリース・公開手順
├── CONTRIBUTING.md
├── SECURITY.md
├── CHANGELOG.md
├── LICENSE
└── dist/                         # 生成物（Git管理対象外）
```

## ローカルインストール

### GitHubから利用する

1. [リポジトリのZIP](https://github.com/geoguessrwaiwai-lab/map-making-app-tools/archive/refs/heads/main.zip)をダウンロードして展開する
2. Chromeで`chrome://extensions/`を開く
3. 「デベロッパー モード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」を選ぶ
5. 展開した`map-making-app-tools-main`フォルダを指定する
6. Map Making Appの対象ページを再読み込みする

ZIPファイルのままでは読み込めません。先に展開してください。

### 開発中のレポジトリから利用する

```bash
make unpacked
```

Chromeの「パッケージ化されていない拡張機能を読み込む」で`dist/map-making-app-tools-unpacked`を指定します。ソース変更後は再度`make unpacked`を実行し、拡張機能と対象ページを再読み込みしてください。

## 検証とパッケージ作成

Node.js、`make`、`zip`を使用します。npmやyarnによる依存関係のインストールは不要です。

```bash
make validate       # 構造、構文、Manifest、安全性を検証
make unpacked       # Chromeから直接読み込むフォルダを生成
make package        # Chrome Web Store提出用ZIPを生成
make clean          # 生成物を削除
```

生成物は次のとおりです。

```text
dist/map-making-app-tools-unpacked/
dist/map-making-app-tools-1.0.0.zip
```

## ホームページ

案内サイトは[`browser-extensions-site`](https://github.com/geoguessrwaiwai-lab/browser-extensions-site)リポジトリで管理しています。

公開先: [https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/](https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/)

## 動作確認

1. `https://map-making.app/maps/数字`形式のページだけで境界線が表示される
2. 境界線を左右へドラッグできる
3. 左ペインが25%未満、75%より大きくならない
4. Tabで境界線へ移動し、矢印キー、Shift+矢印キー、Home、Endが動作する
5. ウィンドウのリサイズやスクロール後も境界線の位置が合う
6. SPA遷移やDOM再生成後も正しく取り付け・取り外しされる
7. 対象外ページの表示と操作へ影響しない

## お問い合わせ

- [GitHub Issues](https://github.com/geoguessrwaiwai-lab/map-making-app-tools/issues)
- X: [@geo_waiwai](https://x.com/geo_waiwai)
