# Premise Builder

Premise Builder is a local-first requirements alignment tool for websites and small web applications.

It separates:

- **Fact, View, Care, and Unknown** as premise axes;
- the perspective represented by an answer from the person who recorded it;
- reported contributions from the project-level resolution; and
- an explicitly confirmed Base from scoped Override patches and the derived Unified Context.

The English MVP contains 42 recognition-first questions across 10 categories. It supports multiple local projects, role-based contribution provenance, review filters, Base confirmation, ordered Overrides, deterministic conflict reporting, JSON import, and Base, Override, Unified, and AI Context exports.

## Privacy boundary

Project names, participants, answers, notes, imported files, and generated contexts remain in browser storage on the current device and origin. The application has no project-data backend, account system, analytics, tracking, remote fonts, or third-party runtime scripts.

Public static assets—including source code, schemas, manifests, rules, mappings, and question wording—are not private project data.

## Local build

```sh
npm run check
npm run serve
```

`npm run check` validates JavaScript, runs the deterministic tests, and writes the deployable static site to `dist/`.

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
