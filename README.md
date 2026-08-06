# Map Making App Tools

Map Making Appのマップ編集画面で、左右50%ずつに固定されている画面幅の変更と、ロケーションの連続確認を支援するChrome拡張機能です。

左側の画面領域は25%〜75%の範囲で変更できます。Manifest V3のローカル拡張機能として動作し、外部ライブラリやビルド処理は必要ありません。

本プロジェクトは非公式であり、Map Making Appまたはその運営者との提携、承認、関係を示すものではありません。

- [案内サイト](https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/)
- [Chrome ウェブストアからインストール](https://chromewebstore.google.com/detail/flhepjgbbcielemfkkkfimcfhgfomofj?utm_source=item-share-cb)
- [拡張機能のソースをダウンロード](https://github.com/geoguessrwaiwai-lab/map-making-app-tools/archive/refs/heads/main.zip)

## 動作仕様

| 操作 | 動作 |
| --- | --- |
| 境界線を左右へドラッグ | 左右の画面幅を変更 |
| ぽちぽちモードをON | ON後に新しく選んだロケーションを、次のロケーション選択時に削除 |

### ぽちぽちモード

- 画面右上のiPhone風トグルでON／OFFを切り替える
- ONにした時点で開いているロケーションは削除対象にしない
- ONへ切り替える直前にMap Making Appが読み込み済みの全保存地点IDを取得し、既存ロケーションを削除対象にしない
- 保存地点の一覧を取得できなかった場合は、誤削除を防ぐためモードをONにしない
- ON中に初めて選択したロケーションだけを一時的な削除対象とし、次に左側マップをクリックした時点でDeleteボタンを先に発火する
- ON中にSaveまたはCloseしたロケーションは保護し、再選択した後にマップをクリックしても削除しない
- Deleteボタンの発火後も元のマップクリックを止めず、Map Making Appに新しいロケーションを選択させる
- マップを6px以上ドラッグした場合はパン操作と判定し、削除ボタンを発火しない
- OFFへ切り替えたときは、モード中に新しく選択されて残っている最後のロケーションも削除する
- 先頭のinfoアイコンだけを案内サイトへの別タブリンクとし、トグル操作と分離する
- `.location-preview__panorama`の再生成とStreet Viewのpano IDを監視し、Map Making Appの地点IDを優先してロケーション変更を識別する
- トグルを切り替えると、現在のマップURLをキーにON／OFFを`chrome.storage.local`へ保存する
- 同じマップURLを次回開いたときは保存状態をデフォルトとして復元する。別のマップURLには影響しない
- 選択履歴や地点情報は保存せず、URLごとのON／OFFだけを保存する

### 拡張機能の設定

Chromeの`chrome://extensions/`で「Map Making App Tools」の「詳細」から「拡張機能のオプション」を開くと、次を設定できます。

- 画面幅調整を使用する
- ぽちぽちモードを使用する
- URL別設定がないマップで、ぽちぽちモードのONをデフォルトにする
- 保存済みのURL別ON／OFFを一覧から変更する
- URLの部分一致検索で設定を絞り込む
- 個別設定を全体デフォルトへ戻す、または確認画面からURL別設定をすべて削除する

Map Making App上でトグルを切り替えたURLでは、そのURL専用のON／OFFが全体デフォルトより優先されます。機能別設定の変更は、開いているMap Making Appにも反映されます。

デフォルトONの復元時は、Map Making App側の保存地点インデックスが準備できるまで待ってからモードを開始します。読み込み途中に既存地点の保護判定が失敗しても、すぐにOFFとして確定しません。

- 対象URL: `https://map-making.app/maps/数字`
- 対象要素: `.page-map-editor`
- 画面幅801px以上でのみ有効（800px以下ではハンドルを外して元のレイアウトへ戻す）
- 左側の画面幅の範囲: 25%〜75%
- 左側の`.map-embed`が500px未満になると`.map-meta__import`を非表示にし、500px以上で再表示する
- 左側の`.map-embed`が300px未満になると`.map-meta__total`を非表示にし、300px以上で再表示する
- `.map-meta__count`が存在する場合は各境界を60px増やし、それぞれ560pxと360pxにする
- カラム間の`gap`を除いた領域を100%として計算
- `minmax(0, …fr)`を使用し、内容由来の最小幅でカラムが止まらないようにする
- 直下のグリッドアイテムへ`min-width: 0`を適用する
- 右カラムが640px以下になると、位置プレビューの日時選択と操作ボタンをContainer Queryで縦積みにする
- 収まりきらない横幅は右カラム内だけでスクロールさせ、ページ全体の横スクロールを防ぐ
- 既存のグリッドエリアと行構成は変更しない
- SPAの画面遷移や対象要素の再生成に追従

## セキュリティとプライバシー

この拡張機能は次の制約を維持します。

- 権限はURL単位のデフォルト設定に必要な`storage`だけを使用し、`host_permissions`は追加しない
- 対象URLと`.page-map-editor`が揃った場合だけ有効化する
- 外部通信、外部JavaScript、Cookie、分析ツールを使用しない
- ぽちぽちモード中は、削除対象の判定に必要な地点ID、pano ID、座標をページ内のメモリだけで一時的に処理する
- 保存地点はMap Making Appが読み込み済みの内部インデックスから取得し、APIへの追加通信は行わない
- 拡張ストレージには機能別設定、全体デフォルト、マップURLとURL別のON／OFFだけを保存する
- 処理したマップ情報や入力内容を記録、保存、送信しない
- ポインター位置はドラッグ中の幅計算にだけ一時的に使用する
- background、service worker、popupを追加しない

詳しくは[プライバシーポリシー](https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/privacy/)をご覧ください。

## ディレクトリ構成

```text
map-making-app-tools/
├── manifest.json                 # Manifest V3設定
├── content.js                    # リサイズ操作とSPA追従
├── page.js                       # ぽちぽちモードの地点監視と削除
├── content.css                   # 境界線とドラッグ中の表示
├── options.html                  # 拡張機能の設定画面
├── options.css
├── options.js
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
dist/map-making-app-tools-1.1.0.zip
```

## ホームページ

案内サイトは[`browser-extensions-site`](https://github.com/geoguessrwaiwai-lab/browser-extensions-site)リポジトリで管理しています。

公開先: [https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/](https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/)

## 動作確認

1. `https://map-making.app/maps/数字`形式のページだけで境界線が表示される
2. 境界線を左右へドラッグできる
3. 左側の画面幅が25%未満、75%より大きくならない
4. ウィンドウのリサイズやスクロール後も境界線の位置が合う
5. SPA遷移やDOM再生成後も正しく取り付け・取り外しされる
6. 対象外ページの表示と操作へ影響しない
7. ぽちぽちモードをONにした時点のロケーションは、次へ移動しても残る
8. ON中に初めて選択したロケーションは、次へ移動したときだけ削除される
9. 過去に選択済みのロケーションへ戻った場合は削除されない
10. ON中にSaveまたはCloseしたロケーションを再選択しても削除されない
11. オプション画面で2機能を個別に無効化できる
12. URL別設定がないマップでは、オプション画面のデフォルトON／OFFが反映される

## お問い合わせ

- [GitHub Issues](https://github.com/geoguessrwaiwai-lab/map-making-app-tools/issues)
- X: [@geo_waiwai](https://x.com/geo_waiwai)
