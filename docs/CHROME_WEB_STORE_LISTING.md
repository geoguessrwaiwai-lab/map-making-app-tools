# Chrome Web Store 掲載情報

Map Making App Tools `1.5.0` のChrome Web Store提出用情報です。

ホームページはCloudflare Workersで公開しています。

## 提出フォームに貼り付ける項目

Chrome Web Storeのダッシュボードで入力する4項目です。項目名はダッシュボードの表記に合わせています。

### 商品の詳細（日本語・デフォルト）

```text
Map Making App Toolsは、Map Making Appのマップ編集画面の幅調整、ロケーションの連続確認、トップページのマップ一覧の整理を支援するChrome拡張機能です。

編集画面の中央に表示されるハンドルをドラッグすると、地図と作業エリアの幅を25%〜75%の範囲で変更できます。タグ編集などで右側を広く使いたい場合や、地図を大きく確認したい場合に、作業内容に合った幅へすぐに調整できます。

「ぽちぽちモード」をONにすると、現在のマップの保存状態を汚すことなく、新しい地点を連続して選択し、閲覧できます。もとから保存されている地点は保護されるため、既存のロケーションを残したまま、新しく確認した候補を続けて整理できます。

トップページのマップ一覧には「フォルダビュー」を追加しました。ネイティブの一覧の見た目・機能を変えずに視覚的に隠し、フォルダでグループ化したカード表示を重ねます。フォルダの追加・並び替え、マップのお気に入り・国チップ・タグ付けができ、編集・削除やマップ作成はMap Making App本体の操作に委譲します。表示言語（日本語／英語）や、マップカードのロケーション数・国チップアイコンの表示は設定で切り替えられます。フッターからいつでもネイティブの表示へ戻せます。設定画面からは、すべての設定をJSONファイルへエクスポート・インポートしてバックアップできます。

タグ編集では、タグ名を変更するとMap Making App側でタグが作り直されて色が初期値へ戻ってしまいます。「タグの色をキープ」をONにしておくと、保存時に入力されていた色がそのまま保たれます。

拡張機能の独自サーバーや第三者への通信、広告、分析ツール、Cookie、外部JavaScriptは使用しません。「タグの色をキープ」は、利用者がタグ名を保存したときにMap Making App自身が送るタグ更新リクエスト（PATCH https://map-making.app/api/maps/<ID>/tags）へ色の指定を足して同じ宛先へ送り直すだけで、新たな送信先への通信は行いません。拡張機能専用ストレージには、機能別設定、ぽちぽちモードの全体デフォルト、対象のマップURLとURL別のON／OFF、フォルダビューのフォルダ構成・フォルダとマップの並び順・お気に入り・国チップ・タグ・表示言語・表示設定だけを保存します。地点ID、pano ID、座標はページ内で一時的に処理し、保存または外部送信しません。

本拡張機能は非公式であり、Map Making Appまたはその運営者との提携、承認、関係を示すものではありません。
```

### 商品の詳細（English）

```text
Map Making App Tools is a Chrome extension that helps you adjust the Map Making App editor width, review locations in sequence, and organize the map list on the home page.

Drag the handle in the center of the editor to adjust the widths of the map and work area within a range of 25% to 75%. Whether you need more room on the right for tasks such as editing tags or a larger map for closer inspection, you can quickly resize the screen to suit your work. The import control is automatically hidden below 500 px and the total display below 300 px; each reappears when the map returns to its respective threshold or wider. When the location count is present, these thresholds increase to 560 px and 360 px, respectively.

Turn on Pochi-pochi mode to continuously select and view new locations without cluttering the current map's saved state. Locations that were already saved remain protected, so you can continue reviewing and organizing new candidates while keeping existing locations intact.

The map list on the home page now has a folder view. It visually hides the native list without changing its behavior, and overlays a card layout grouped by user-defined folders. You can add and reorder folders, favorite maps, and assign a country chip and tags to each map, while editing, deleting, and creating maps still delegate to Map Making App's own controls. Settings let you switch the display language (Japanese or English) and choose whether map cards show location counts and country chip icons. You can return to the native list from the footer at any time. The settings screen also lets you export or import all of your settings as a JSON file for backup.

Renaming a tag makes Map Making App recreate it and reset its colour. Turn on "Keep tag colours" and the colour you had in the Edit tag form is preserved.

The extension does not use its own servers, third-party network requests, advertising, analytics tools, cookies, or remote JavaScript. "Keep tag colours" only adds the colour to the tag update request Map Making App itself sends when you save a renamed tag (PATCH https://map-making.app/api/maps/<ID>/tags), resending it to that same destination. It introduces no new destination and no extra request. Extension-local storage contains only feature settings, the global Pochi-pochi mode default, the target map URL, the URL-specific ON/OFF setting, and the folder view's folders, the order of folders and maps, favorites, country chips, tags, display language, and display preferences. Location IDs, pano IDs, and coordinates are processed temporarily within the page and are neither stored nor transmitted externally.

This is an unofficial extension and is not affiliated with, endorsed by, or otherwise associated with Map Making App or its operators.
```

### 単一用途

```text
Map Making Appの自分のマップを扱う画面の表示を、利用者が扱いやすいように調整できるようにすること。具体的には、編集画面で左右の画面幅を調整すること、利用者が明示的に有効化した間だけ新しく確認したロケーションを次の選択時に削除すること、トップページのマップ一覧を利用者が決めたフォルダで分類して表示すること、タグ名の変更でタグの色が初期値へ戻らないようにすることです。
```

### 単一用途（English）

```text
Let users adjust how their own Map Making App maps are presented: resize the editor screen widths, delete each newly reviewed location when selecting the next one while the mode is explicitly enabled, group the home page map list into folders the user defines, and keep a tag's colour when it is renamed.
```

### 権限が必要な理由（`storage`が必要な理由）

```text
機能別の有効・無効、ぽちぽちモードの全体デフォルト、現在のマップURLをキーとしたON／OFF、およびフォルダビューのフォルダ構成・フォルダとマップの並び順・お気に入り・国チップ・タグ・表示言語・表示設定を拡張機能専用のローカルストレージへ保存するために使用します。地点ID、pano ID、座標、選択履歴、マップ名は保存しません。
```

### 権限が必要な理由（`storage`が必要な理由・English）

```text
The storage permission saves feature enable/disable preferences, the global Pochi-pochi default, the ON/OFF value keyed by the current map URL, and the folder view's folders, the order of folders and maps, favorites, country chips, tags, display language, and display preferences. It does not store location IDs, pano IDs, coordinates, selection history, or map names.
```

### 権限が必要な理由（ホスト権限が必要な理由）

```text
本拡張機能はhttps://map-making.app/maps/*とhttps://map-making.app/でのみコンテンツスクリプトを実行します。対象ページの編集グリッドとロケーションプレビュー、またはトップページのマップ一覧を検出し、画面幅を調整し、ぽちぽちモード中の地点変更と削除を処理し、マップ一覧にフォルダビューを重ね、タグ名の変更時にMap Making App自身のタグ更新リクエストへ色の指定を足して送り直すために必要です。地点ID、pano ID、座標、マップ名・ID・地点数はページ内で一時的に処理するだけで、収集、保存、送信しません。
```

### 権限が必要な理由（ホスト権限が必要な理由・English）

```text
The content scripts run only on https://map-making.app/maps/* and https://map-making.app/ so they can adjust the editor screen width, detect location changes for Pochi-pochi mode, overlay the folder view on the map list, and add the colour to Map Making App's own tag update request when a tag is renamed. Location IDs, pano IDs, coordinates, and map names/IDs/location counts are processed temporarily in page memory and are not collected, stored, or transmitted.
```

## 基本情報（日本語・デフォルト）

商品名と概要は`_locales/ja/messages.json`・`_locales/en/messages.json`の`extName`／`extDescription`から配信されるため、ダッシュボードでは入力しません。以下は同梱している文面です。ダッシュボードの言語ドロップダウンには`_locales`に含めたロケール（日本語・英語）だけが並び、選んだ言語ごとに詳細な説明・スクリーンショット・プロモーション動画を入力します。

### 商品名

```text
Map Making App Tools
```

### 概要

```text
Map Making Appの画面幅調整、ロケーション整理、マップ一覧のフォルダ分けを使いやすくします。
```

### カテゴリと言語

- カテゴリ: `ツール`
- デフォルトの言語: `日本語`
- 成人向けコンテンツ: `なし`

## English listing

### Name

```text
Map Making App Tools
```

### Summary

```text
Adjust the editor screen width, streamline location cleanup, and group your map list into folders in Map Making App.
```

## URL

- Chrome Web Store: `https://chromewebstore.google.com/detail/flhepjgbbcielemfkkkfimcfhgfomofj?utm_source=item-share-cb`
- ホームページ: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/`
- プライバシーポリシー: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/privacy/`
- 英語版ホームページ: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/en/`
- 英語版プライバシーポリシー: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/en/privacy/`
- サポート: `https://github.com/geoguessrwaiwai-lab/map-making-app-tools/issues`

## プライバシーに関する取り組み

### リモートコード

- リモートコードを使用していますか: `いいえ`
- 説明: 外部JavaScript、WebAssembly、`eval`、動的コード取得を使用しません。実行コードは提出ZIPにすべて含まれます。

### データ利用

- 個人を特定できる情報: `収集しない`
- 健康情報: `収集しない`
- 財務・支払い情報: `収集しない`
- 認証情報: `収集しない`
- 個人的なコミュニケーション: `収集しない`
- 位置情報: `収集しない`
- ウェブ履歴: `収集しない`
- ユーザーのアクティビティ: `収集しない`
- ウェブサイトのコンテンツ: `収集しない`

ポインターのX座標、地点ID、pano ID、座標は、幅計算またはぽちぽちモードの判定にだけ一時的に使用し、記録、保存、送信しません。機能別設定、全体デフォルト、対象のマップURLとURLごとのON／OFF設定、フォルダビューのフォルダ構成・フォルダとマップの並び順・お気に入り・国チップ・タグ・表示言語・表示設定だけを端末内の拡張機能専用ストレージへ保存し、外部へ送信しません。「タグの色をキープ」がONの場合にかぎり、利用者がタグ名を保存したときにMap Making App自身が送るタグ更新リクエスト（`PATCH https://map-making.app/api/maps/<ID>/tags`）へ色の指定を足して同じ宛先へ送り直します。新たな送信先はなく、拡張機能の独自サーバーや第三者へは何も送信しません。

### 開示・認証項目

- データを販売または第三者へ転送する: `いいえ`
- 単一用途と無関係な目的でデータを使用する: `いいえ`
- 信用判断または融資目的でデータを使用する: `いいえ`
- ユーザーデータの取り扱い: `収集しない`

## グラフィックアセット

| 用途 | ファイル | サイズ | 状態 |
| --- | --- | --- | --- |
| ストアアイコン | `icon128.png` | 128×128 | 必須・準備済み |
| スクリーンショット | `store-assets/screenshot-editor-640x400.png` | 640×400 | 必須・準備済み |
| 小さいプロモーションタイル | `store-assets/small-promo-440x280.png` | 440×280 | 準備済み |
| マーキー画像 | なし | 1400×560 | 任意・未作成 |
| YouTube動画 | なし | URL | 任意・未登録 |

スクリーンショットは、Chrome Web Storeの掲載ガイドが認める640×400形式です。

## 提出ファイル

```text
dist/map-making-app-tools-1.4.1.zip
```

ZIPには拡張機能の実行に必要なファイルだけが含まれ、ホームページやストア画像は含まれません。

## 公開設定の推奨値

- 公開範囲: `一般公開`
- 地域: `すべての地域`
- 価格: `無料`
- テスト手順: インストール後、`https://map-making.app/maps/数字`形式の編集ページを画面幅801px以上で開き、中央のハンドルを左右へドラッグする。画面右上の「ぽちぽちモード」をONにして新しいロケーションを選び、次にマップをクリックすると、直前の新しいロケーションがMap Making AppのDeleteボタンで削除される。モード開始前から保存されているロケーションと、マップをドラッグした場合のロケーションは削除されない。`https://map-making.app/`のトップページを開くと、マップ一覧がフォルダごとのカード表示になり、フォルダの追加・名称変更・削除、フォルダとマップのドラッグ並び替え、カードの「⋯」メニューからの編集・お気に入り・削除ができる。フッターのボタンでいつでもネイティブの一覧表示へ戻せる。`chrome://extensions/`で本拡張機能の「詳細」から「拡張機能のオプション」を開くと、各機能のON／OFF、ぽちぽちモードのデフォルト、表示言語、フォルダビューの表示設定を変更できる。同じ画面の「設定のバックアップ」から、設定をJSONファイルへエクスポートし、そのファイルをインポートして復元できる

## 公式ガイド

- [掲載ページ作成のベストプラクティス](https://developer.chrome.com/docs/webstore/best-listing)
- [掲載情報の入力](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Chrome Web Storeプログラムポリシー](https://developer.chrome.com/docs/webstore/program-policies/policies)
