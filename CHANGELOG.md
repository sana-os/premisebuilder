# Changelog

## 0.2.0

- Added complete Japanese application chrome and a Japanese translation of all 42 questions.
- Added `/ja/` and `/en/` routes with stable language-neutral IDs, values, mappings, and schemas.
- Added explicit `confirmedAt`, `baseConfirmedAt`, `generatedAt`, and `importedAt` semantics.
- Preserved the original Base confirmation timestamp in Unified documents.
- Kept legacy imports honest when their Base confirmation time was never recorded.
- Corrected the post-confirmation summary and disabled duplicate Base confirmation until content changes.
- Added a confirmation step before creating or replacing a Base revision.
- Aligned the review status label to “Provisional”.
- Fixed Export preview heading layout for long labels and Japanese text.
- Added Japanese quick-start guidance, real 42-question fixtures, and English-to-Japanese round-trip regression tests.
