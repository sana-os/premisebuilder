# Premise Builder v0.3

Premise Builder is a local-first requirements alignment tool for websites, small web applications, game development, and AI agent adoption planning.

It separates:

- **Fact, View, Care, and Unknown** as premise axes;
- the perspective represented by an answer from the person who recorded it;
- reported contributions from the project-level resolution; and
- an explicitly confirmed Base from scoped Override patches and the derived Unified Context.

All nine language editions offer three templates: **Websites & Small Web Apps** (42 questions across 10 categories), **Game Development** (40 questions across 10 categories), and **AI Agent Adoption Planning** (48 questions across 12 categories). Each template shares stable question IDs, choice values, rules, mappings, and schemas across languages while localizing all visible question wording. The app supports multiple local projects, role-based contribution provenance, review filters, Base confirmation, ordered Overrides, deterministic conflict reporting, JSON import, and Base, Override, Unified, and AI Context exports.

The game template covers intent, players, core rules, scope, art/audio/narrative, technology, accessibility, boundaries/rights, production, and playtesting. It does not assume a particular engine or genre. See [the Japanese game guide](docs/GAME-DEVELOPMENT.ja.md) for scope and examples.

The AI agent template starts with actual work and expected value, then covers current baselines, alternatives, authority, people, data, context, recovery, evaluation, costs, and rollout. Expected benefits remain interpretations rather than measured facts. Review warnings flag four concrete premise mismatches without changing answers or acting as an approval gate. See [the Japanese AI agent guide](docs/AI-AGENT-ADOPTION.ja.md) for definitions, examples, and reference sources.

日本語での導入手順と入力例は [docs/QUICKSTART.ja.md](docs/QUICKSTART.ja.md) を参照してください。La guía y un ejemplo de entrada en español están en [docs/QUICKSTART.es.md](docs/QUICKSTART.es.md). The recorded v0.2 Japanese browser test remains under [examples/japanese-edition/README.ja.md](examples/japanese-edition/README.ja.md) as a historical regression fixture.

## Locale routes

- `/en/` — English
- `/ja/` — 日本語
- `/es/` — Español
- `/zh-hans/` — 简体中文
- `/zh-hant/` — 繁體中文
- `/pt-br/` — Português (Brasil)
- `/fr/` — Français
- `/de/` — Deutsch
- `/ar/` — العربية (right-to-left layout)

Each locale includes the application interface, all 130 questions and choices, review messages, and the in-app usage guide. The language selector uses native language names and retains the template creation route when switching.

Template creation routes are `/{locale}/new/web-small-app/`, `/{locale}/new/game-development/`, and `/{locale}/new/ai-agent-adoption/`. All three templates can also be selected from each locale's home page.

Import is locale-independent: Base and Unified documents can move among all nine interfaces without changing stable IDs, stored choice values, or user-written content. Switching the interface language does not translate project answers or change their recorded content language.

## Time semantics

- `meta.confirmedAt` records when that exact Base revision was explicitly confirmed.
- `derivedFrom.baseConfirmedAt` carries the source Base confirmation time into Unified.
- `derivedFrom.generatedAt` records when Unified was derived.
- `meta.importedAt` records when the current local copy was imported; it never substitutes for a missing confirmation time.
- Legacy files without `confirmedAt` remain valid and display the confirmation time as not recorded.

## Privacy boundary

Project names, participants, answers, notes, imported files, and generated contexts remain in browser storage on the current device and origin. The application has no project-data backend, account system, analytics, tracking, remote fonts, or third-party runtime scripts.

Public static assets—including source code, schemas, manifests, rules, mappings, and question wording—are not private project data.

## Local build

```sh
npm run check
npm run serve
```

`npm run check` regenerates the English/Japanese/Spanish authoring outputs, validates all nine locales for every template (including guide structure and message placeholders), runs cross-language import/export and review-rule tests, and writes the deployable static site to `dist/`. In PowerShell, use `npm.cmd run check` if the installed `npm.ps1` shim is broken.

## Cloudflare Pages

- Framework preset: none
- Build command: `npm run build`
- Output directory: `dist`
- Runtime variables: none
- Functions, Workers, D1, KV, and R2: not used

The intended canonical origin is `https://premisebuilder.info`. Cloudflare Pages may connect directly to the canonical GitHub repository.

## Extension contract

Templates live under `templates/<template-id>/`. Each independently versioned manifest declares its locales, question set, rules, and mappings. The build generates the public registry and locale routes from those manifests, so future design, game, and writing templates do not require a separate application or origin.

Application chrome lives in `src/locales/`. Question labels live in the template locale files. IDs, choice values, rules, mappings, and schemas remain language-neutral.

The six additional languages are maintained directly in `src/locales/{locale}.json`, `src/locales/guides/{locale}.json`, and `templates/{template}/questions/{locale}.json`. Update all nine editions together when changing wording. The English/Japanese/Spanish guide source is `src/locales/guide.js`; `npm run localize` updates its JSON outputs. Builds load checked-in translations locally and do not call a translation service.

The game template's authoring source is `scripts/generate-game-questions.mjs`; regenerate with `npm run localize` after editing it. Its generated JSON files are checked in so `npm run build` works without regenerating translations.

The AI agent template's authoring source is `scripts/generate-agent-questions.mjs`, with generated files under `templates/ai-agent-adoption/`. The same localization and build workflow applies.

## Author and related tool

- [Deshimaru Sakaguchi — author and research](https://deshimarusakaguchi.com/)
- [Preference Compass — human–AI relationship portability](https://preferencecompass.info/)
