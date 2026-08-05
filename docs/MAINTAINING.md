# メンテナンスガイド

この文書は、Map Making App ToolsのリリースとChrome ウェブストア掲載の運用手順をまとめたものです。

## バージョン管理

拡張機能のバージョンは`manifest.json`を正とし、Semantic Versioningの`MAJOR.MINOR.PATCH`形式で管理します。

- `PATCH`: 不具合修正、DOM変更への対応、互換性改善
- `MINOR`: 後方互換性を保った機能追加
- `MAJOR`: 操作方法や対象範囲の大きな変更

## リリース手順

1. `main`が最新で、作業ツリーがクリーンであることを確認する。
2. `manifest.json`の`version`を更新する。
3. `CHANGELOG.md`を更新する。
4. `make clean validate package unpacked`を実行する。
5. `dist/map-making-app-tools-unpacked`をChromeへ読み込み、READMEの動作確認項目を確認する。
6. CIが成功したことを確認して`main`へマージする。
7. `v<version>`形式のannotated tagとGitHub Releaseを作成する。
8. `dist/map-making-app-tools-<version>.zip`をChrome ウェブストアへ提出する。
9. 動作や説明を変更した場合は、`browser-extensions-site`リポジトリの案内ページとプライバシーポリシーを更新する。

## Chrome ウェブストア

提出フォームへ転記する掲載文とプライバシー申告は[`CHROME_WEB_STORE_LISTING.md`](CHROME_WEB_STORE_LISTING.md)で管理します。

- 商品名: `Map Making App Tools`
- カテゴリー: ツール
- 言語: 日本語
- リモートコード: 使用しない
- 収集するユーザーデータ: なし
- 単一用途: Map Making Appのマップ編集画面で左右ペインの幅を変更できるようにする
- Map Making Appの非公式拡張機能であることを明記する

## ホームページ

案内サイトは[`browser-extensions-site`](https://github.com/geoguessrwaiwai-lab/browser-extensions-site)リポジトリで管理します。

- 日本語版: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/`
- 英語版: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/en/`
- プライバシーポリシー: `https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/privacy/`
