# Changelog

## Unreleased

- Expanded application chrome, all 130 questions, review messages, and the in-app guide to nine languages: English, Japanese, Spanish, Simplified Chinese, Traditional Chinese, Brazilian Portuguese, French, German, and Arabic.
- Added a compact language selector, Arabic right-to-left layout, localized page metadata, and routes for every template in every language.
- Added translation completeness, interpolation-variable, and nine-language import preservation checks.

- Expanded the in-app quick start in all three languages with a six-step first-project walkthrough, terminology, examples for all templates, Resolution and export guidance, and troubleshooting.
- Made the guide available from the project workspace, with expandable examples and persistent close controls.

- Added AI Agent Adoption Planning with 48 questions across 12 categories, in English, Japanese, and Spanish.
- Separated expected benefits from measured evidence and included non-agent alternatives, human review capacity, permissions, recovery, evaluation, total costs, and exit criteria.
- Added review warnings for unmeasured savings, advice/action mismatches, missing review arrangements, and direct rollout without representative evaluation.
- Tested the shared review condition evaluator and AI agent cross-language Base/Unified reconstruction.

- Added a selectable Game Development template with 40 questions in 10 categories, in English, Japanese, and Spanish.
- Enabled bundled templates beyond web-small-app to pass the application compatibility check.
- Added a game-specific online/offline review warning and preserved unresolved answer semantics.
- Added localized home footer links to Deshimaru Sakaguchi and Preference Compass.
- Extended static checks to all templates and added game cross-language import/export regression tests.

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
