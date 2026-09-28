import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PATCH_SCHEMA_REF, createProjectState, createId, confirmBase, rebuildDocument, stateFromImportedDocument } from "../src/core.js";
import { validateAnswer, validateDocument, validatePatch } from "../src/validation.js";
import { applyPatches } from "../src/merge.js";
import { generateAIContext } from "../src/import-export.js";

const read = (path) => JSON.parse(readFileSync(new URL(`../templates/game-development/${path}`, import.meta.url), "utf8"));
const manifest = read("manifest.json");
const mappings = read("mappings.json");
const rules = read("rules.json");
const bundles = Object.fromEntries(manifest.locales.map((locale) => [locale, { manifest, mappings, rules, locale: read(`questions/${locale}.json`) }]));
const makeState = (bundle) => createProjectState({ projectName: "Game regression", phase: "new_build", contentLanguage: "ja", recorderLabel: "Creator", recorderRole: "developer", recorderIsDecisionOwner: true, perspectiveMode: "same_recorder" }, bundle);

test("game template covers every category with stable, unique localized choices and mappings", () => {
  assert.equal(manifest.questionCount, 40);
  assert.equal(new Set(mappings.mappings.map((m) => m.itemId)).size, 40);
  for (const bundle of Object.values(bundles)) {
    assert.equal(bundle.locale.questions.length, 40);
    assert.equal(new Set(bundle.locale.questions.map((q) => q.questionId)).size, 40);
    assert.deepEqual(bundle.locale.categories.map((c) => c.id), manifest.categoryOrder);
    for (const [index, question] of bundle.locale.questions.entries()) {
      const english = bundles.en.locale.questions[index];
      assert.equal(question.questionId, english.questionId);
      assert.ok(manifest.categoryOrder.includes(question.category));
      assert.equal(mappings.mappings.filter((m) => m.questionId === question.questionId).length, 1);
      const shape = (q) => (q.choices || []).map(({ label, ...stable }) => stable);
      assert.deepEqual(shape(question), shape(english));
      assert.ok(question.prompt && question.help);
      if (question.choices) {
        assert.equal(new Set(question.choices.map((c) => c.value)).size, question.choices.length);
        const value = question.responseType === "multi-choice" ? ["other"] : "other";
        assert.equal(validateAnswer(question, value).valid, false);
        assert.equal(validateAnswer(question, value, "A concrete explanation").valid, true);
      }
    }
  }
});

test("game answers survive confirmation, cross-language imports, Unified and AI Context export", () => {
  const state = makeState(bundles.ja);
  for (const question of bundles.ja.locale.questions) {
    const contributionId = createId("pbc");
    const now = new Date().toISOString();
    const value = question.choices ? question.responseType === "multi-choice" ? [question.choices[0].value] : question.choices[0].value : "遊びの根拠と完成条件";
    state.responses[question.questionId] = {
      contributions: { [contributionId]: { value, note: "検証用の日本語メモ", context: structuredClone(state.context), recordedAt: now, updatedAt: now } },
      activeContributionId: contributionId,
      resolution: { status: "confirmed", sourceContributionId: contributionId, decidedByRefs: [state.context.perspectiveRef], decidedAt: now, note: "" }
    };
  }
  const base = confirmBase(state, bundles.ja);
  assert.equal(validateDocument(base, bundles.ja).valid, true);
  assert.equal(Object.keys(base.items).length, 40);
  const now = new Date().toISOString();
  const patch = {
    schemaRef: PATCH_SCHEMA_REF, format: "premise-builder-patch", formatVersion: "0.1.0", protocolVersion: "0.1.0", documentType: "override",
    meta: { patchId: createId("pbp"), baseDocumentId: base.meta.documentId, baseRevision: base.meta.revision, label: "Demo milestone", contentLanguage: "en", createdByRef: state.context.perspectiveRef, scope: "release", createdAt: now, updatedAt: now },
    operations: [{ changeId: createId("chg"), op: "replace", path: "/items/project.intent.release_goal/resolution/value", previousValue: "prototype", value: "demo", reason: "Prepare a playable demo", createdAt: now }]
  };
  assert.equal(validatePatch(patch).valid, true);
  const patched = applyPatches(base, [patch]);
  assert.equal(patched.conflicts.length, 0);
  assert.equal(patched.unified.items["project.intent.release_goal"].resolution.value, "demo");
  assert.equal(base.items["project.intent.release_goal"].resolution.value, "prototype");
  for (const bundle of Object.values(bundles)) {
    const imported = stateFromImportedDocument(JSON.parse(JSON.stringify(base)), bundle);
    rebuildDocument(imported, bundle);
    for (const [id, item] of Object.entries(base.items)) {
      assert.deepEqual(imported.document.items[id].contributions, item.contributions);
      assert.deepEqual(imported.document.items[id].resolution, item.resolution);
      assert.equal(imported.document.items[id].axis, item.axis);
    }
    const result = applyPatches(imported.baseDocument, []);
    assert.equal(validateDocument(result.unified, bundle).valid, true);
    assert.equal(result.unified.derivedFrom.baseConfirmedAt, base.meta.confirmedAt);
    assert.match(generateAIContext(result.unified), /game-development/);
    assert.match(generateAIContext(result.unified), /検証用の日本語メモ/);
  }
});

test("unknown game choices remain unresolved and exclusive choices cannot be combined", () => {
  const state = makeState(bundles.en);
  const question = bundles.en.locale.questions.find((q) => q.questionId === "game.players.platforms");
  assert.equal(validateAnswer(question, ["browser", "unknown"]).valid, false);
  assert.equal(validateAnswer(question, ["browser", "none"]).valid, false);
  const id = createId("pbc");
  const now = new Date().toISOString();
  state.responses[question.questionId] = {
    contributions: { [id]: { value: ["unknown"], note: "", context: state.context, recordedAt: now, updatedAt: now } },
    resolution: { status: "confirmed", sourceContributionId: id, decidedByRefs: [state.context.perspectiveRef], decidedAt: now }
  };
  rebuildDocument(state, bundles.en);
  assert.equal(state.document.items[question.questionId].resolution.status, "unspecified");
  assert.equal(state.document.items[question.questionId].axis, "unknown");
});
