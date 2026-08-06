# 変更履歴

このプロジェクトの主な変更はこのファイルに記録します。バージョン番号は`manifest.json`に合わせます。

## [Unreleased]

## [1.2.0] - 2026-08-06

### Added

- 左側の地図が500px未満になったときインポート操作を、300px未満になったとき合計表示を隠し、地点数表示がある場合は各境界を60px増やすレスポンシブ表示

## [1.1.0] - 2026-08-06

### Fixed

- ぽちぽちモード中にSaveまたはCloseしたロケーションが、再選択後のマップクリックで削除される不具合を修正

### Removed

- 画面幅調整ハンドルの矢印キー、Shift+矢印キー、Home、Endによる操作を削除

## [1.0.0] - 2026-08-05

### Added

- Map Making Appのマップ編集画面で左右の画面幅をドラッグして変更するChrome拡張機能
- 左側の画面幅を25%〜75%に制限するポインター操作
- 矢印キー、Shift+矢印キー、Home、Endによるキーボード操作
- SPA遷移とDOM再生成への追従
- 画面右上から切り替えられるiPhone風の「ぽちぽちモード」トグル
- モード中に初めて選択したロケーションを、次のロケーション選択時に削除する連続確認機能
- Street View DOM、pano ID、Map Making Appの地点IDを組み合わせたロケーション変更検知
- 地図クリックのキャプチャ時に公式Deleteボタンを先行発火し、元のクリックを止めずに新しい地点選択へつなげる処理
- マップのドラッグ操作では削除ボタンを発火しない移動量判定
- モードをOFFにしたとき、最後に残った新規選択ロケーションも削除する処理
- トグル先頭に案内サイトを別タブで開く円形infoリンクを追加し、上端位置を7pxへ調整
- モードON直前にMap Making Appの読み込み済み地点インデックスを取得し、全保存地点を削除対象外にする初期化処理
- 保存地点を列挙できない場合はモードを開始せず、既存地点の誤削除を防ぐ処理
- マップURL単位のデフォルトON／OFFを拡張機能専用ストレージへ保存・復元する処理
- 画面幅調整とぽちぽちモードを個別にON／OFFできる拡張機能オプション画面
- URL別設定がないマップに適用する、ぽちぽちモードの全体デフォルト設定
- デフォルトONの復元時に、Map Making Appの保存地点インデックス準備を待つリトライ処理
- URL別設定のスクロール一覧、部分一致検索、個別・一括削除を備えた管理UI
- プライバシーポリシー、案内サイト、開発・コントリビューション文書

### Changed

- 案内サイトを共通の`browser-extensions-site`リポジトリへ移行

[Unreleased]: https://github.com/geoguessrwaiwai-lab/map-making-app-tools/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/geoguessrwaiwai-lab/map-making-app-tools/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/geoguessrwaiwai-lab/map-making-app-tools/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/geoguessrwaiwai-lab/map-making-app-tools/releases/tag/v1.0.0
