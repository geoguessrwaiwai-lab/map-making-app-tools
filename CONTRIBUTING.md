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

## 開発方針

- 外部ライブラリを追加しない
- 対象URLと対象要素を安易に広げない
- 25%〜75%の制約、グリッドのgapを考慮した計算、SPA遷移時の後片付けを維持する
- 動作が変わる場合はREADMEと、[`browser-extensions-site`](https://github.com/geoguessrwaiwai-lab/browser-extensions-site)で管理する案内サイト・プライバシーポリシーも更新する
- `dist/`内の生成物をコミットしない

## 検証

```bash
make validate
make package
```
