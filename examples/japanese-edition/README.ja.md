# 日本語版42問・実入力の回帰例

このディレクトリは、Premise Builder v0.1の英語画面で「Premise Builder v0.2 — Japanese Edition」を要件定義し、Base確定、Export、別のChromeへのImport、再Exportまで行った実例です。説明用の架空データではなく、今回の改修判断に使った42問の回答、Resolution、出所、メモを収録しています。

## ファイル

| ファイル | 内容 |
|---|---|
| `premise-builder-v0-2-japanese-edition.base.r1.legacy.json` | 最初に確定・ExportしたBase r1 |
| `premise-builder-v0-2-japanese-edition.unified.r1.legacy.json` | Overrideなしで生成したUnified r1 |
| `premise-builder-v0-2-japanese-edition.AI_CONTEXT.r1.legacy.md` | 最初のAI Context |
| `*.chrome-roundtrip.legacy.*` | Unifiedを別のChromeへImportして再Exportした結果 |

`legacy` は、旧版が `confirmedAt` と `importedAt` をまだ出力していなかったことを示します。テストではこの欠落を意図的に残し、`updatedAt` から確定時刻を推測しないことを確認します。

## 代表的な入力

- プロジェクト種別: `browser_local_utility`
- レスポンシブ方針: `desktop_priority`
- 性能方針: `core_web_vitals`
- ホスティング: `cloudflare_pages`
- 受入証拠: `combined`
- 未決定事項: 独立した作業は継続し、依存する決定は保留する

補足には、日本語文字列の欠落防止、ブラウザ内保存、外部送信禁止、Import・Exportのデータ保持、キーボード操作、Cloudflare Pagesへの静的配信など、実装と受入れに必要な境界が記録されています。

## 回帰試験

`tests/localization-roundtrip.test.mjs` が次を自動確認します。

1. 英語版と日本語版の42問で、質問ID、順序、回答形式、選択値、排他・補足必須フラグが一致する。
2. 英語Base → Unified → 日本語版Import → Base再構築で、意味を持つ非翻訳フィールドが一致する。
3. この42問サンプルの全項目、Contribution、Resolution、値、状態、メモを保持する。
4. 旧版に存在しないBase確定時刻を捏造せず、Import時刻だけを新しく記録する。

```sh
npm test
```
