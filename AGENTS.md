# AGENTS.md

このファイルは、このリポジトリで作業するAI Agent向けの指示です。利用者向けの説明は`README.md`、一般の開発参加手順は`CONTRIBUTING.md`、リリースと公開の運用手順は`docs/MAINTAINING.md`を参照してください。

## 基本方針

1. 外部ライブラリを使わない最小構成を維持する。
2. 対象URLを`https://map-making.app/maps/数字`（マップ編集画面）と`https://map-making.app/`（トップページのマップ一覧）に限定する。
3. マップ編集画面では`.page-map-editor`以外のグリッドへ、トップページでは`[data-replace="InteractiveMapList"]`、`section.updates`（フッターへの再配置と更新履歴の折りたたみ）、および`.page-map-list`のレイアウト（Updates折りたたみ時に「Your Maps」列へ幅を譲る調整）以外の要素へ介入しない。
4. 既存のグリッドエリアと行構成を変更しない。
5. 権限、外部通信、データ収集を追加しない。必要な場合は実装前にユーザーへ確認する。
6. Map Making Appの公式製品と誤認させる名称、説明、画像を追加しない。

## アーキテクチャ（機能ごと）

ソースファイルは実行world・対象URLではなく、担当する機能で命名・分割している。機能を横断する変更を避け、該当ファイルだけを触ること。

```text
manifest.json                           Manifest V3設定
resize.js / resize.css                  画面幅リサイズ（ISOLATED world, /maps/数字）
pochipochi.js                           ぽちぽちモード本体（MAIN world, /maps/数字）
pochipochi-bridge.js / pochipochi.css   ぽちぽちモードの設定を分離ストレージへ橋渡し（ISOLATED world, /maps/数字）
map-list.js / map-list.css              トップページのフォルダビュー（ISOLATED world, /）
options.html / options.css / options.js 拡張機能の設定画面
scripts/validate.mjs                    構造・構文・安全性の検証（機能ごとにファイルを読み分けて検証する）
Makefile                                検証・ZIP生成
```

### 画面幅リサイズ（resize.js / resize.css）

- 対象URL: `https://map-making.app/maps/数字`、対象要素: `.page-map-editor`
- 画面幅801px以上でのみ有効（800px以下ではハンドルを外して元のレイアウトへ戻す）
- 左側の画面幅の範囲: 25%〜75%（`MIN_PERCENT`/`MAX_PERCENT`）
- `dialog[open]`または`[role="dialog"]`（`data-state="closed"`を除く）が開いている間は、ハンドルをモーダルと重ねずに一時的に隠す
- 左側の`.map-embed`が500px未満で`.map-meta__import`を、300px未満で`.map-meta__total`を非表示にする。`.map-meta__count`が存在する場合は各境界を60px増やす
- カラム間の`gap`を除いた領域を100%として計算し、`minmax(0, …fr)`と直下グリッドアイテムへの`min-width: 0`で、内容由来の最小幅にカラムが止まらないようにする
- 右カラムが640px以下になると、位置プレビューの日時選択と操作ボタンをContainer Queryで縦積みにする
- 収まりきらない横幅は右カラム内だけでスクロールさせ、ページ全体の横スクロールを防ぐ
- SPAの画面遷移や対象要素の再生成に追従する（`MutationObserver`/`ResizeObserver`）
- 拡張機能の設定でOFFにできる（`mma-feature-screen-resize-enabled`）。OFF時はCSSも`html.mma-resize-feature-enabled`クラス経由で無効化する

### ぽちぽちモード（pochipochi.js + pochipochi-bridge.js）

MAIN worldとISOLATED worldに分かれているのは、Map Making App本体の内部API（`editor`、地点インデックス）へ触れるには同じJSコンテキストのMAIN worldが必要な一方、`chrome.storage`はISOLATED worldからしかアクセスできないため。両者は`CustomEvent`（`mma-pochipochi-settings-*`）で橋渡しする。

- ONにした時点で開いているロケーション、および読み込み済みの全保存地点IDを削除対象にしない（一覧を取得できなかった場合は誤削除防止のためONにしない）
- ON中に初めて選択したロケーションだけを一時的な削除対象とし、次に左側マップをクリックした時点でDeleteボタンを先に発火する。元のマップクリックは止めず、Map Making Appに新しいロケーションを選択させる
- ON中にSaveまたはCloseしたロケーションは保護し、再選択後にマップをクリックしても削除しない
- マップを6px（`DRAG_THRESHOLD_PX`）以上ドラッグした場合はパン操作と判定し、削除ボタンを発火しない
- OFFへ切り替えたときは、モード中に新しく選択されて残っている最後のロケーションも削除する
- `.location-preview__panorama`の再生成とStreet ViewのDOM上のpano IDを監視し、Map Making Appの地点IDを優先してロケーション変更を識別する
- トグルは現在のマップURLをキーに`chrome.storage.local`へON／OFFを保存する（`mma-pochipochi-default:<url>`）。同じURLを次回開いたときに復元し、他のURLには影響しない
- 全体デフォルト（`mma-pochipochi-default-enabled`）はURL別設定がない場合にだけ使う。機能自体のON／OFFは`mma-feature-pochipochi-enabled`
- デフォルトONの復元時は、Map Making App側の保存地点インデックスが準備できるまでリトライしながら待つ（`INITIALIZATION_MAX_ATTEMPTS`）。準備前に失敗してもすぐにOFF確定にしない

### フォルダビュー（map-list.js / map-list.css）

トップページ（`https://map-making.app/`）のマップ一覧の見た目・構造は変更せず、視覚的に隠した上に、フォルダでグループ化されたカード表示を重ねる。

- ネイティブの一覧はDOMに残したまま非表示にし、マップ名・地点数・編集ボタンの読み取り元、および新規作成・編集操作の委譲先として使い続ける（`findNativeEditButton`/`findNativeCreateMapForm`）
- 初回表示時だけ既存のネイティブのフォルダ分けを引き継いでフォルダを自動生成する（未所属マップは「未分類」）。以降のフォルダ構成（`HEADINGS_KEY`）は拡張機能側の設定として独立管理する
- フォルダの追加（プリセット／自由入力24文字まで）・名称変更・削除、801px以上での2カラムグリッド表示（「未分類」は常に右カラム）、フォルダ・マップカードのドラッグ並び替え（画面端付近での自動スクロール込み）に対応する
- 新規マップ作成はモーダルで名前と作成先フォルダを入力し、ネイティブの作成フォームへ値を渡して送信を委譲する
- カードの「⋯」メニューから編集（名前・フォルダ・タグをまとめて変更）・お気に入り（`FAVORITES_KEY`）・削除ができる。名前の更新はネイティブの設定ダイアログへ委譲し、フォルダとタグ（`TAGS_KEY`、この機能専用のデータ）は拡張機能側で保存する
- 国チップ（`COUNTRIES_KEY`、`Intl.DisplayNames`で日本語表示、国旗はISOコードから生成）、GeoGuessrマップへのリンクURL設定（ネイティブの設定ダイアログへ委譲）に対応する
- ネイティブの設定ダイアログはどのフォームを送信してもマップの全項目（名前・説明・リンクURL）を送るが、そのフォーム自身の入力欄以外はダイアログを開いた時点のデータから組み立てる。そのため名前とリンクは1回では保存できず、名前を保存→開き直したダイアログの名前入力欄が新しい名前になるのを待つ→リンクを保存、と順番に進める（`applyMapEditsViaNativeDialog`）。待っても新しい名前にならない場合は、名前が巻き戻るためリンクの保存を見送る
- 再描画のたびにダイアログ内のノードは差し替わる。入力欄・保存ボタンは必ず操作の直前に取り直す（`currentNativeEditDialog`）
- 削除は取り消せない旨を明記した独自の確認モーダルを経てネイティブの削除ボタンへ処理を委譲する
- フッター2段目の「以前の表示に切り替える」でネイティブ表示に戻せる。切り替え時はフッターへ移動していたUpdates関連ノード（`attachFooter`/`detachFooter`、`movedFooterNodes`で追跡）も元の位置へ完全復元する
- リロード時はネイティブの一覧が一瞬見えないよう`document_start`で読み込み中クラス（`BOOTING_CLASS`）を付け、フォルダビュー描画完了・機能OFF・対象外判定・2秒タイムアウトのいずれかで解除する
- 表示言語（日本語／英語）はフッターとオプション画面の両方から切り替えられ、`chrome.storage.local`の`mma-language`を共有する。未設定時はブラウザの言語設定から自動判定するが、その結果は保存しない
- マップ名のリンクは既定で別タブ（`NEW_TAB_KEY`）を開く。オプションでOFFにすると同じタブになる
- フォルダ・並び順・お気に入り・国・タグは、マップURLに紐づかないアカウント単位の設定として保存する
- 文言は`t("key")`/`data-i18n`で参照し、`MESSAGES`に日本語（`ja`）・英語（`en`）の両方を必ず定義する（`scripts/validate.mjs`が検証する）

## 実装と文言

- 実装のコメントは日本語で記載する。
- DOM再生成、SPA遷移、ドラッグ終了時の後片付けを維持する。
- 動作仕様を変更した場合は、`manifest.json`、`README.md`、ストア掲載情報を同期し、必要に応じて別リポジトリ`browser-extensions-site`の案内ページとプライバシーポリシーも更新する。

## 検証と生成物

- 拡張機能を変更した場合は、`make validate`、`make package`、`make unpacked`を実行する。
- **指示された作業（タスク）が完了するたびに、コミット・pushの前に必ず`make unpacked`を実行し、`dist/map-making-app-tools-unpacked`を最新の状態にする。実行したことをユーザーへの返信で明示的に伝える。**
- JavaScript/CSS/HTMLはPrettierで統一している。手で整形せず`make format`を使い、`make validate`（内部で`make format-check`を実行）が通ることを確認する。Prettierは`devDependencies`のみで、拡張機能本体にはバンドルされないため「外部ライブラリを使わない」方針には反しない。
- `scripts/validate.mjs`で検証している対象URL、権限なし、外部通信なしの不変条件を弱めない。ファイルを分割・改名した場合は、`REQUIRED_EXTENSION_FILES`・`content_scripts`の対応・各アサーションの参照ファイルを機能ごとに揃える。
- `dist/`内のZIPや展開済みファイルをソース管理に追加しない。

## 動作確認

機能ごとに次を確認する。

**画面幅リサイズ**

1. `https://map-making.app/maps/数字`形式のページだけで境界線が表示される
2. 境界線を左右へドラッグでき、左側の画面幅が25%未満・75%より大きくならない
3. ウィンドウのリサイズやスクロール後も境界線の位置が合う
4. SPA遷移やDOM再生成後も正しく取り付け・取り外しされる
5. 対象外ページの表示と操作へ影響しない

**ぽちぽちモード**

6. ONにした時点のロケーションは、次へ移動しても残る
7. ON中に初めて選択したロケーションは、次へ移動したときだけ削除される
8. 過去に選択済みのロケーションへ戻った場合は削除されない
9. ON中にSaveまたはCloseしたロケーションを再選択しても削除されない
10. URL別設定がないマップでは、オプション画面のデフォルトON／OFFが反映される

**フォルダビュー**

11. トップページでフォルダの追加・名称変更・削除、フォルダ・マップの並び替え、お気に入り、国チップ、タグの付与ができる
12. フォルダを選択して新しいマップを作成すると、そのマップが選択したフォルダへ入る
13. カードの「⋯」メニューから編集・お気に入り・削除ができ、削除では確認モーダルが開く
14. 右上のトグルでネイティブ表示に戻せ、戻した状態でも検索・New map・New folderが問題なく使える
15. マップ名のクリックで別タブが開き、オプション画面でOFFにすると同じタブで開く
16. フッター右下とオプション画面のどちらで言語を変えても、両方の表示が日本語／英語に切り替わる

**共通**

17. オプション画面で各機能を個別に無効化できる

## リリース

- リリース公開の依頼では、`main`へのマージとタグのpushだけで完了としない。
- `v<version>`のannotated tagに対応するGitHub Releaseを作成し、`dist/map-making-app-tools-<version>.zip`をRelease assetとして添付する。
- 完了前に、GitHub ReleaseがDraftでもPrereleaseでもない公開状態であり、対象ZIPがアップロード済みであることを確認する。

## 作業時の注意

- ユーザーの既存変更を保存し、依頼範囲外の差分を戻さない。
- セレクタを推測で広げず、実際のDOMを確認してから変更する。
- セキュリティまたはプライバシーに関わる挙動を変更する場合は、関連文書とストア掲載内容も確認する。
