# Changelog

## 0.3.0

- Added complete Spanish application chrome and a Spanish translation of all 42 questions.
- Added `/es/` routes and a language switcher generated from the template manifest.
- Preserved stable question IDs, choice values, rules, mappings, schemas, and exported JSON semantics across all three languages.
- Added English-to-Spanish and Spanish-to-English import/reconstruction regression tests.
- Generalized static locale checks and route checks to every locale declared by the template.
- Added a Spanish quick start with a concrete input example.
- Kept the product and release artifact names language-neutral for future locale expansion.
- Prevented an awkward line break inside the Japanese word `認識` on the home page.

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
