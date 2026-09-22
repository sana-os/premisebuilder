# Premise Builder v0.2

Premise Builder is a local-first requirements alignment tool for websites and small web applications.

It separates:

- **Fact, View, Care, and Unknown** as premise axes;
- the perspective represented by an answer from the person who recorded it;
- reported contributions from the project-level resolution; and
- an explicitly confirmed Base from scoped Override patches and the derived Unified Context.

The English and Japanese editions contain the same 42 recognition-first questions across 10 categories. They share stable question IDs, choice values, rules, mappings, and schemas while localizing all visible question wording. The app supports multiple local projects, role-based contribution provenance, review filters, Base confirmation, ordered Overrides, deterministic conflict reporting, JSON import, and Base, Override, Unified, and AI Context exports.

日本語での導入手順と入力例は [docs/QUICKSTART.ja.md](docs/QUICKSTART.ja.md) を参照してください。今回の42問の実入力を使った回帰例は [examples/japanese-edition/README.ja.md](examples/japanese-edition/README.ja.md) にあります。

## Locale routes

- `/ja/` and `/ja/new/web-small-app/` — Japanese UI and questionnaire
- `/en/` and `/en/new/web-small-app/` — English UI and questionnaire

Import is locale-independent: an English Base or Unified document can be opened in the Japanese edition without changing stable IDs or stored choice values.

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

`npm run check` regenerates the Japanese question set, validates JavaScript and locale parity, runs deterministic import/export tests, and writes the deployable static site to `dist/`.

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
