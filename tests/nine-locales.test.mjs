import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createProjectState, confirmBase, stateFromImportedDocument } from "../src/core.js";
import { validateDocument } from "../src/validation.js";

const locales = ["en", "ja", "es", "zh-hans", "zh-hant", "pt-br", "fr", "de", "ar"];
const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const placeholders = (value) => [...value.matchAll(/\{[A-Za-z][A-Za-z0-9_]*\}/g)].map(([match]) => match).sort();

function sameStructure(reference, actual, path) {
  assert.equal(typeof actual, typeof reference, path);
  if (typeof reference === "string") {
    assert.ok(actual.trim(), `${path}: empty translation`);
    assert.deepEqual(placeholders(actual), placeholders(reference), `${path}: placeholders`);
  } else if (reference && typeof reference === "object") {
    assert.equal(Array.isArray(actual), Array.isArray(reference), path);
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(reference).sort(), `${path}: keys`);
    for (const key of Object.keys(reference)) sameStructure(reference[key], actual[key], `${path}.${key}`);
  } else assert.equal(actual, reference, path);
}

test("all nine locales include complete chrome, guides, and matching interpolation variables", () => {
  const chrome = read("src/locales/ja.json");
  const guide = read("src/locales/guides/en.json");
  for (const locale of locales) {
    const localized = read(`src/locales/${locale}.json`);
    assert.equal(localized.locale, locale);
    assert.equal(localized.direction, locale === "ar" ? "rtl" : "ltr");
    for (const group of locale === "en" ? ["strings"] : ["strings", "text", "labels", "messages"]) {
      sameStructure(chrome[group], localized[group], `${locale}.${group}`);
    }
    sameStructure(guide, read(`src/locales/guides/${locale}.json`), `${locale}.guide`);
  }
});

for (const template of ["web-small-app", "game-development", "ai-agent-adoption"]) {
  test(`${template}: nine-language coverage and cross-language data preservation`, () => {
    const manifest = read(`templates/${template}/manifest.json`);
    assert.deepEqual(manifest.locales, locales);
    const common = { manifest, rules: read(`templates/${template}/rules.json`), mappings: read(`templates/${template}/mappings.json`) };
    const english = read(`templates/${template}/questions/en.json`);
    const englishBundle = { ...common, locale: english };
    const state = createProjectState({
      projectName: "言語テスト · اختبار · Teste", phase: "new_build", contentLanguage: "ja",
      recorderLabel: "記録者", recorderRole: "developer", recorderIsDecisionOwner: true,
      perspectiveMode: "same_recorder", perspectiveLabel: "", perspectiveRole: "end_user"
    }, englishBundle);
    const base = confirmBase(state, englishBundle);
    for (const locale of locales) {
      const translated = read(`templates/${template}/questions/${locale}.json`);
      sameStructure(english, translated, `${template}.${locale}`);
      assert.equal(translated.locale, locale);
      assert.equal(translated.direction, locale === "ar" ? "rtl" : "ltr");
      const stableQuestion = ({ prompt, help, placeholder, choices, ...stable }) => ({
        ...stable, ...(choices ? { choices: choices.map(({ label, ...choice }) => choice) } : {})
      });
      assert.deepEqual(translated.questions.map(stableQuestion), english.questions.map(stableQuestion));
      assert.deepEqual(translated.categories.map(({ id }) => id), english.categories.map(({ id }) => id));
      assert.deepEqual(translated.resolutionStates.map(({ value }) => value), english.resolutionStates.map(({ value }) => value));
      const bundle = { ...common, locale: translated };
      const imported = stateFromImportedDocument(base, bundle).baseDocument;
      assert.equal(validateDocument(imported, bundle).valid, true);
      const storedContent = (items) => Object.fromEntries(Object.entries(items).map(([id, { label, labelLanguage, ...item }]) => [id, item]));
      assert.deepEqual(storedContent(imported.items), storedContent(base.items));
      assert.deepEqual(imported.participants, base.participants);
      assert.equal(imported.meta.contentLanguage, "ja");
      assert.equal(imported.meta.confirmedAt, base.meta.confirmedAt);
    }
  });
}
