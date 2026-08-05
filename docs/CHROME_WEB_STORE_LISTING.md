# Chrome Web Store 掲載情報

Map Making App Tools `1.0.0` のChrome Web Store提出用情報です。

ホームページはCloudflare Workersで公開しています。

## 基本情報（日本語・デフォルト）

### 商品名

```text
Map Making App Tools
```

### 概要

```text
Map Making Appのマップ編集画面で、左右ペインの幅をドラッグして変更できるようにします。
```

### 詳細な説明

```text
Map Making App Toolsは、Map Making Appのマップ編集画面を使いやすい幅に調整するためのChrome拡張機能です。

編集画面の中央に表示されるハンドルをドラッグすると、地図と作業エリアの幅を25%〜75%の範囲で変更できます。タグ編集などで右側を広く使いたい場合や、地図を大きく確認したい場合に、作業内容に合った幅へすぐに調整できます。

主な機能:
・中央のハンドルを左右へドラッグしてペイン幅を変更
・左右の矢印キーで1%ずつ調整
・Shift + 左右の矢印キーで5%ずつ調整
・Homeキーで左ペインを25%、Endキーで75%に変更
・狭くなった右ペインの操作項目を見やすく配置
・ページ全体の横スクロールを防ぎ、必要な場合は右ペイン内だけでスクロール

本拡張機能は画面幅801px以上で動作します。800px以下ではハンドルを表示せず、Map Making App本来のレイアウトを使用します。

外部通信、広告、分析ツール、Cookie、ブラウザストレージ、外部JavaScriptは使用しません。マップ情報、入力内容、閲覧履歴などのユーザーデータを収集、保存、送信しません。

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
Resize the map and work-area panes in Map Making App by dragging their divider.
```

### Detailed description

```text
Map Making App Tools is a Chrome extension that lets you adjust the Map Making App editor to a comfortable working width.

Drag the handle between the map and work area to resize either pane from 25% to 75%. Give the work area more room while editing tags, or enlarge the map when you need a clearer view.

Features:
• Drag the center handle to resize the editor panes
• Use the Left and Right arrow keys for 1% adjustments
• Hold Shift with the arrow keys for 5% adjustments
• Press Home for a 25% left pane or End for a 75% left pane
• Reflow controls when the right pane becomes narrow
• Prevent page-level horizontal scrolling and keep any necessary scrolling inside the right pane

The extension is active at viewport widths of 801 pixels or more. At 800 pixels or less, it hides the handle and leaves the original Map Making App layout unchanged.

The extension does not use external network requests, advertising, analytics, cookies, browser storage, or remote JavaScript. It does not collect, store, or transmit map data, form input, browsing history, or other user data.

This is an unofficial extension and is not affiliated with, endorsed by, or associated with Map Making App or its operators.
```

## URL

- ホームページ: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/`
- プライバシーポリシー: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/privacy/`
- 英語版ホームページ: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/en/`
- 英語版プライバシーポリシー: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/en/privacy/`
- サポート: `https://github.com/geoguessrwaiwai-lab/map-making-app-tools/issues`

## プライバシーに関する取り組み

### 単一用途

```text
Map Making Appのマップ編集画面で、地図と作業エリアの境界をドラッグまたはキーボードで移動し、左右ペインの幅を調整できるようにすること。
```

### Single purpose (English)

```text
Allow users to resize the map and work-area panes in the Map Making App editor by dragging the divider or using the keyboard.
```

### サイトアクセスの理由

```text
本拡張機能はhttps://map-making.app/maps/*でのみコンテンツスクリプトを実行します。対象ページの編集グリッドを検出し、ペイン幅、ドラッグハンドル、狭幅時のレイアウトだけを調整するために必要です。ページ内容、マップ情報、入力値を収集、保存、送信しません。
```

### Host access justification (English)

```text
The content script runs only on https://map-making.app/maps/* so it can detect the editor grid and adjust its pane widths, resize handle, and narrow-pane layout. It does not collect, store, or transmit page content, map data, or form values.
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

ポインターのX座標はドラッグ中の幅計算にだけ一時的に使用し、記録、保存、送信しません。

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
dist/map-making-app-tools-1.0.0.zip
```

ZIPには拡張機能の実行に必要なファイルだけが含まれ、ホームページやストア画像は含まれません。

## 公開設定の推奨値

- 公開範囲: `一般公開`
- 地域: `すべての地域`
- 価格: `無料`
- テスト手順: インストール後、`https://map-making.app/maps/数字`形式の編集ページを画面幅801px以上で開き、中央のハンドルを左右へドラッグする

## 公式ガイド

- [掲載ページ作成のベストプラクティス](https://developer.chrome.com/docs/webstore/best-listing)
- [掲載情報の入力](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Chrome Web Storeプログラムポリシー](https://developer.chrome.com/docs/webstore/program-policies/policies)
