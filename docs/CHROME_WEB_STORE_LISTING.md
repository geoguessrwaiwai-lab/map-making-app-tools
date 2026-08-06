# Chrome Web Store 掲載情報

Map Making App Tools `1.1.0` のChrome Web Store提出用情報です。

ホームページはCloudflare Workersで公開しています。

## 基本情報（日本語・デフォルト）

### 商品名

```text
Map Making App Tools
```

### 概要

```text
Map Making Appの画面幅調整とロケーション整理を使いやすくします。
```

### 詳細な説明

```text
Map Making App Toolsは、Map Making Appのマップ編集画面の幅調整と、ロケーションの連続確認を支援するChrome拡張機能です。

編集画面の中央に表示されるハンドルをドラッグすると、地図と作業エリアの幅を25%〜75%の範囲で変更できます。タグ編集などで右側を広く使いたい場合や、地図を大きく確認したい場合に、作業内容に合った幅へすぐに調整できます。

「ぽちぽちモード」をONにすると、現在のマップの保存状態を汚すことなく、新しい地点を連続して選択し、閲覧できます。もとから保存されている地点は保護されるため、既存のロケーションを残したまま、新しく確認した候補を続けて整理できます。

外部通信、広告、分析ツール、Cookie、外部JavaScriptは使用しません。拡張機能専用ストレージには、機能別設定、ぽちぽちモードの全体デフォルト、対象のマップURLとURL別のON／OFFだけを保存します。地点ID、pano ID、座標はページ内で一時的に処理し、保存または外部送信しません。

本拡張機能は非公式であり、Map Making Appまたはその運営者との提携、承認、関係を示すものではありません。
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
Adjust the editor screen width and streamline location cleanup in Map Making App.
```

### Detailed description

```text
Map Making App Tools is a Chrome extension that helps you adjust the Map Making App editor width and review locations in sequence.

Drag the handle in the center of the editor to adjust the widths of the map and work area within a range of 25% to 75%. Whether you need more room on the right for tasks such as editing tags or a larger map for closer inspection, you can quickly resize the screen to suit your work.

Turn on Pochi-pochi mode to continuously select and view new locations without cluttering the current map's saved state. Locations that were already saved remain protected, so you can continue reviewing and organizing new candidates while keeping existing locations intact.

The extension does not use external network requests, advertising, analytics tools, cookies, or remote JavaScript. Extension-local storage contains only feature settings, the global Pochi-pochi mode default, the target map URL, and the URL-specific ON/OFF setting. Location IDs, pano IDs, and coordinates are processed temporarily within the page and are neither stored nor transmitted externally.

This is an unofficial extension and is not affiliated with, endorsed by, or otherwise associated with Map Making App or its operators.
```

## URL

- Chrome Web Store: `https://chromewebstore.google.com/detail/flhepjgbbcielemfkkkfimcfhgfomofj?utm_source=item-share-cb`
- ホームページ: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/`
- プライバシーポリシー: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/privacy/`
- 英語版ホームページ: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/en/`
- 英語版プライバシーポリシー: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/en/privacy/`
- サポート: `https://github.com/geoguessrwaiwai-lab/map-making-app-tools/issues`

## プライバシーに関する取り組み

### 単一用途

```text
Map Making Appの編集画面で左右の画面幅を調整し、利用者が明示的に有効化した間だけ新しく確認したロケーションを次の選択時に削除できるようにすること。
```

### Single purpose (English)

```text
Allow users to adjust Map Making App editor screen widths and, while explicitly enabled, delete each newly reviewed location when selecting the next one.
```

### サイトアクセスの理由

```text
本拡張機能はhttps://map-making.app/maps/*でのみコンテンツスクリプトを実行します。対象ページの編集グリッドとロケーションプレビューを検出し、画面幅を調整し、ぽちぽちモード中の地点変更と削除を処理するために必要です。地点ID、pano ID、座標はページ内で一時的に処理するだけで、収集、保存、送信しません。
```

### Host access justification (English)

```text
The content scripts run only on https://map-making.app/maps/* so they can adjust the editor screen width and detect location changes for Pochi-pochi mode. Location IDs, pano IDs, and coordinates are processed temporarily in page memory and are not collected, stored, or transmitted.
```

### `storage`権限の理由

```text
機能別の有効・無効、ぽちぽちモードの全体デフォルト、および現在のマップURLをキーとしたON／OFFを拡張機能専用のローカルストレージへ保存するために使用します。地点ID、pano ID、座標、選択履歴は保存しません。
```

### `storage` permission justification (English)

```text
The storage permission saves feature enable/disable preferences, the global Pochi-pochi default, and the ON/OFF value keyed by the current map URL. It does not store location IDs, pano IDs, coordinates, or selection history.
```

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

ポインターのX座標、地点ID、pano ID、座標は、幅計算またはぽちぽちモードの判定にだけ一時的に使用し、記録、保存、送信しません。機能別設定、全体デフォルト、対象のマップURLとURLごとのON／OFF設定だけを端末内の拡張機能専用ストレージへ保存し、外部へ送信しません。

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
dist/map-making-app-tools-1.1.0.zip
```

ZIPには拡張機能の実行に必要なファイルだけが含まれ、ホームページやストア画像は含まれません。

## 公開設定の推奨値

- 公開範囲: `一般公開`
- 地域: `すべての地域`
- 価格: `無料`
- テスト手順: インストール後、`https://map-making.app/maps/数字`形式の編集ページを画面幅801px以上で開き、中央のハンドルを左右へドラッグする。画面右上の「ぽちぽちモード」をONにして新しいロケーションを選び、次にマップをクリックすると、直前の新しいロケーションがMap Making AppのDeleteボタンで削除される。モード開始前から保存されているロケーションと、マップをドラッグした場合のロケーションは削除されない。`chrome://extensions/`で本拡張機能の「詳細」から「拡張機能のオプション」を開くと、各機能とぽちぽちモードのデフォルトを設定できる

## 公式ガイド

- [掲載ページ作成のベストプラクティス](https://developer.chrome.com/docs/webstore/best-listing)
- [掲載情報の入力](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Chrome Web Storeプログラムポリシー](https://developer.chrome.com/docs/webstore/program-policies/policies)
