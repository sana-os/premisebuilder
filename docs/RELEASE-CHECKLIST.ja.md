# 日本語版・公開前チェックリスト

## 自動確認

```sh
npm run check
```

成功時は、JavaScript構文、16件以上の単体・互換試験、42問の日英同一性、静的ビルド、日英ルート、HTML ID、ネットワーク禁止設定を確認します。

## デスクトップ表示

- `/ja/` でナビゲーション、作成画面、42問、Review、Override、Exportが日本語になる。
- 日本語・English切替が現在の言語を示す。
- ReviewでBase確定後は「Base r1 確定済み」となり、内容を変更するまでボタンが無効になる。
- Base確定時刻とImport時刻を混同しない。旧版Importでは「元の確定時刻は記録されていません」と表示する。
- Exportの「プレビュー」と形式選択が同じ行で不自然に分割されない。
- 長い日本語の質問、補足、プロジェクト名がカード外へはみ出さない。

## モバイル表示

- 360 px幅で横スクロールなしにホームと質問へ進める。
- 質問の回答、前後移動、Resolution、Review、Exportの主要ボタンを操作できる。
- 表形式のReviewがカード形式に変わり、項目ラベルを失わない。
- 言語切替が表示され、狭い幅ではローカル保存バッジだけを省略する。

## 実データ互換性

1. `examples/japanese-edition/fixtures/` の英語版由来またはlegacy JSONを日本語版へImportする。
2. Reviewで全42項目と日本語メモを確認する。
3. Base、Unified、AI Contextを再Exportする。
4. 日時とローカライズ表示を除き、ID、値、Contribution、Resolution、状態、メモ、スキーマが一致することを確認する。
