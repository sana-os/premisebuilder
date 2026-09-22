import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { confirmBase, createProjectState, stateFromImportedDocument } from "../src/core.js";
import { applyPatches } from "../src/merge.js";
import { validateDocument } from "../src/validation.js";

const root = resolve(import.meta.dirname, "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const manifest = readJson("templates/web-small-app/manifest.json");
const mappings = readJson("templates/web-small-app/mappings.json");
const rules = readJson("templates/web-small-app/rules.json");
const english = readJson("templates/web-small-app/questions/en.json");
const japanese = readJson("templates/web-small-app/questions/ja.json");
const englishBundle = { manifest, mappings, rules, locale: english };
const japaneseBundle = { manifest, mappings, rules, locale: japanese };

function stableChoiceShape(question) {
  return (question.choices || []).map(({ value, requiresNote, exclusive }) => ({
    value,
    requiresNote: Boolean(requiresNote),
    exclusive: Boolean(exclusive)
  }));
}

function stableDocumentShape(document) {
  return {
    schemaRef: document.schemaRef,
    format: document.format,
    formatVersion: document.formatVersion,
    protocolVersion: document.protocolVersion,
    documentType: "base",
    handling: document.handling,
    participantIds: Object.keys(document.participants).sort(),
    participants: Object.fromEntries(Object.entries(document.participants).map(([id, participant]) => [id, {
      kind: participant.kind,
      roles: participant.roles
    }])),
    items: Object.fromEntries(Object.entries(document.items).map(([id, item]) => [id, {
      category: item.category,
      axis: item.axis,
      kind: item.kind,
      scope: item.scope,
      enforcement: item.enforcement,
      priority: item.priority,
      contributions: item.contributions,
      resolution: item.resolution,
      dependencies: item.dependencies,
      rationale: item.rationale
    }]))
  };
}

function withoutLegacyGenerationTimes(document) {
  const normalized = structuredClone(document);
  delete normalized.meta.updatedAt;
  if (normalized.derivedFrom) delete normalized.derivedFrom.generatedAt;
  return normalized;
}

test("English and Japanese question sets preserve every stable ID and choice value", () => {
  assert.equal(english.questions.length, 42);
  assert.equal(japanese.questions.length, 42);
  for (const [index, englishQuestion] of english.questions.entries()) {
    const japaneseQuestion = japanese.questions[index];
    assert.equal(japaneseQuestion.questionId, englishQuestion.questionId);
    assert.equal(japaneseQuestion.category, englishQuestion.category);
    assert.equal(japaneseQuestion.responseType, englishQuestion.responseType);
    assert.equal(japaneseQuestion.order, englishQuestion.order);
    assert.deepEqual(stableChoiceShape(japaneseQuestion), stableChoiceShape(englishQuestion));
  }
});

test("English Base imported through the Japanese edition re-exports without semantic drift", () => {
  const englishState = createProjectState({
    projectName: "English compatibility fixture",
    phase: "extension",
    contentLanguage: "en",
    recorderLabel: "Project owner",
    recorderRole: "developer",
    recorderIsDecisionOwner: true,
    perspectiveMode: "same_recorder",
    perspectiveLabel: "",
    perspectiveRole: "end_user"
  }, englishBundle);
  const englishBase = confirmBase(englishState, englishBundle);
  const englishUnified = applyPatches(englishBase, []).unified;
  const japaneseState = stateFromImportedDocument(englishUnified, japaneseBundle);

  assert.deepEqual(stableDocumentShape(japaneseState.baseDocument), stableDocumentShape(englishBase));
  assert.equal(japaneseState.baseDocument.meta.confirmedAt, englishBase.meta.confirmedAt);
  assert.equal(japaneseState.baseDocument.meta.updatedAt, englishBase.meta.updatedAt);
  assert.equal(japaneseState.baseConfirmationKnown, true);
  assert.match(japaneseState.importedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(japaneseState.baseDocument.meta.importedAt, japaneseState.importedAt);
  assert.equal(validateDocument(japaneseState.baseDocument, japaneseBundle).valid, true);
});

test("legacy import records import time without inventing confirmation time", () => {
  const legacy = readJson("examples/japanese-edition/fixtures/premise-builder-v0-2-japanese-edition.base.r1.legacy.json");
  assert.equal(legacy.meta.confirmedAt, undefined);
  const imported = stateFromImportedDocument(legacy, japaneseBundle);

  assert.equal(imported.baseConfirmedAt, null);
  assert.equal(imported.baseConfirmationKnown, false);
  assert.equal(imported.baseDocument.meta.confirmedAt, undefined);
  assert.match(imported.baseDocument.meta.importedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.notEqual(imported.baseDocument.meta.importedAt, legacy.meta.updatedAt);
  assert.equal(validateDocument(imported.baseDocument, japaneseBundle).valid, true);
});

test("the 42-answer Japanese fixture survives import and reconstruction", () => {
  const legacy = readJson("examples/japanese-edition/fixtures/premise-builder-v0-2-japanese-edition.base.r1.legacy.json");
  const imported = stateFromImportedDocument(legacy, japaneseBundle);

  assert.equal(Object.keys(imported.baseDocument.items).length, 42);
  assert.deepEqual(stableDocumentShape(imported.baseDocument), stableDocumentShape(legacy));
  assert.ok(Object.values(imported.baseDocument.items).some((item) => /[ぁ-んァ-ヶ一-龠]/u.test(item.rationale || "")));
});

test("the recorded Chrome round trip changed only legacy generation timestamps", () => {
  const base = readJson("examples/japanese-edition/fixtures/premise-builder-v0-2-japanese-edition.base.r1.legacy.json");
  const roundTripBase = readJson("examples/japanese-edition/fixtures/premise-builder-v0-2-japanese-edition.base.r1.chrome-roundtrip.legacy.json");
  const unified = readJson("examples/japanese-edition/fixtures/premise-builder-v0-2-japanese-edition.unified.r1.legacy.json");
  const roundTripUnified = readJson("examples/japanese-edition/fixtures/premise-builder-v0-2-japanese-edition.unified.r1.chrome-roundtrip.legacy.json");
  const markdown = readFileSync(resolve(root, "examples/japanese-edition/fixtures/premise-builder-v0-2-japanese-edition.AI_CONTEXT.r1.legacy.md"), "utf8");
  const roundTripMarkdown = readFileSync(resolve(root, "examples/japanese-edition/fixtures/premise-builder-v0-2-japanese-edition.AI_CONTEXT.r1.chrome-roundtrip.legacy.md"), "utf8");

  assert.deepEqual(withoutLegacyGenerationTimes(roundTripBase), withoutLegacyGenerationTimes(base));
  assert.deepEqual(withoutLegacyGenerationTimes(roundTripUnified), withoutLegacyGenerationTimes(unified));
  assert.equal(roundTripMarkdown.replace(/^Generated: .*$/m, "Generated: <normalized>"), markdown.replace(/^Generated: .*$/m, "Generated: <normalized>"));
});
