import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createProjectState, createId, confirmBase, rebuildDocument, stateFromImportedDocument, evaluateRuleCondition } from "../src/core.js";
import { validateAnswer, validateDocument } from "../src/validation.js";
import { applyPatches } from "../src/merge.js";
import { generateAIContext } from "../src/import-export.js";

const read = (path) => JSON.parse(readFileSync(new URL(`../templates/ai-agent-adoption/${path}`, import.meta.url), "utf8"));
const manifest = read("manifest.json");
const mappings = read("mappings.json");
const rules = read("rules.json");
const bundles = Object.fromEntries(manifest.locales.map((locale) => [locale, { manifest, mappings, rules, locale: read(`questions/${locale}.json`) }]));
const makeState = (bundle) => createProjectState({ projectName: "Agent pilot", phase: "new_build", contentLanguage: "ja", recorderLabel: "Business owner", recorderRole: "requester", recorderIsDecisionOwner: true, perspectiveMode: "same_recorder" }, bundle);
function answer(state, question, value, status = "confirmed") {
  const id = createId("pbc");
  const now = new Date().toISOString();
  state.responses[question.questionId] = {
    contributions: { [id]: { value, note: "現場の確認・修正工数も含める", context: structuredClone(state.context), recordedAt: now, updatedAt: now } },
    activeContributionId: id,
    resolution: { status, sourceContributionId: id, decidedByRefs: [state.context.perspectiveRef], decidedAt: now, note: "" }
  };
}

test("agent template has 48 stable questions, localized choices and valid warning references", () => {
  assert.equal(manifest.questionCount, 48);
  assert.equal(manifest.categoryCount, 12);
  assert.equal(new Set(mappings.mappings.map((m) => m.itemId)).size, 48);
  for (const bundle of Object.values(bundles)) {
    assert.equal(bundle.locale.questions.length, 48);
    assert.equal(new Set(bundle.locale.questions.map((q) => q.questionId)).size, 48);
    assert.deepEqual(bundle.locale.categories.map((c) => c.id), manifest.categoryOrder);
    for (const [index, question] of bundle.locale.questions.entries()) {
      assert.ok(question.prompt && question.help);
      assert.equal(question.questionId, bundles.en.locale.questions[index].questionId);
      assert.equal(mappings.mappings.filter((m) => m.questionId === question.questionId).length, 1);
      const shape = (q) => (q.choices || []).map(({ label, ...stable }) => stable);
      assert.deepEqual(shape(question), shape(bundles.en.locale.questions[index]));
      if (question.choices) {
        assert.equal(new Set(question.choices.map((c) => c.value)).size, question.choices.length);
        const other = question.responseType === "multi-choice" ? ["other"] : "other";
        assert.equal(validateAnswer(question, other).valid, false);
        assert.equal(validateAnswer(question, other, "Explanation").valid, true);
      }
    }
    for (const rule of rules.rules.filter((r) => r.type === "review-warning")) {
      assert.ok(bundle.locale.messages[rule.messageKey]);
      for (const condition of rule.when.all) {
        const question = bundle.locale.questions.find((q) => q.questionId === condition.questionId);
        assert.ok(question);
        for (const value of condition.values || [condition.value]) assert.ok(question.choices.some((c) => c.value === value));
      }
    }
  }
});

test("agent expectations stay views and all answers survive Base/Unified cross-language reconstruction", () => {
  const state = makeState(bundles.ja);
  assert.equal(Object.keys(state.document.items).length, 48);
  for (const question of bundles.ja.locale.questions) {
    const value = question.choices ? question.responseType === "multi-choice" ? [question.choices[0].value] : question.choices[0].value : "1件あたりの総工数を比較する";
    answer(state, question, value);
  }
  const base = confirmBase(state, bundles.ja);
  assert.equal(validateDocument(base, bundles.ja).valid, true);
  assert.equal(base.items["agent.outcomes.hypothesis"].axis, "view");
  assert.equal(base.items["agent.outcomes.benefit"].axis, "view");
  assert.equal(base.items["agent.actions.approval"].axis, "care");
  const unified = applyPatches(base, []).unified;
  for (const document of [base, unified]) {
    for (const bundle of Object.values(bundles)) {
      const imported = stateFromImportedDocument(JSON.parse(JSON.stringify(document)), bundle);
      rebuildDocument(imported, bundle);
      assert.equal(validateDocument(imported.document, bundle).valid, true);
      for (const [id, item] of Object.entries(base.items)) {
        assert.deepEqual(imported.document.items[id].contributions, item.contributions);
        assert.deepEqual(imported.document.items[id].resolution, item.resolution);
        assert.equal(imported.document.items[id].axis, item.axis);
      }
      const markdown = generateAIContext(applyPatches(imported.baseDocument, []).unified);
      assert.match(markdown, /ai-agent-adoption/);
      assert.match(markdown, /現場の確認・修正工数も含める/);
    }
  }
});

test("agent unknown and proposal choices cannot be silently promoted to confirmed facts", () => {
  const question = bundles.en.locale.questions.find((q) => q.questionId === "agent.fit.alternatives");
  assert.equal(validateAnswer(question, ["agent", "unknown"]).valid, false);
  assert.equal(validateAnswer(question, ["agent", "none"]).valid, false);
  for (const [choice, status] of [["unknown", "unspecified"], ["proposal_requested", "proposal_requested"]]) {
    const state = makeState(bundles.en);
    answer(state, question, [choice]);
    rebuildDocument(state, bundles.en);
    assert.equal(state.document.items[question.questionId].resolution.status, status);
    assert.equal(state.document.items[question.questionId].resolution.value, null);
    assert.equal(state.document.items[question.questionId].axis, "unknown");
  }
});

test("agent review warnings detect mismatches and clear when the relevant premise changes", () => {
  const cases = [
    ["baseline", { "agent.outcomes.benefit": "time", "agent.workflow.baseline": "not_measured" }, "agent.workflow.baseline", "measured"],
    ["authority", { "agent.fit.autonomy": "advice", "agent.actions.effects": ["draft", "send"] }, "agent.actions.effects", ["draft"]],
    ["review", { "agent.fit.autonomy": "approve_each", "agent.people.review_capacity": "unassigned" }, "agent.people.review_capacity", "staffed"],
    ["release", { "agent.rollout.entry": "direct", "agent.evaluation.evidence": "not_run" }, "agent.rollout.entry", "sandbox"]
  ];
  for (const [key, answers, fixKey, fixValue] of cases) {
    const rule = rules.rules.find((rule) => rule.ruleId === `review.agent_${key}`);
    assert.equal(evaluateRuleCondition(rule.when, (id) => answers[id]), true);
    assert.equal(evaluateRuleCondition(rule.when, () => undefined), false);
    answers[fixKey] = fixValue;
    assert.equal(evaluateRuleCondition(rule.when, (id) => answers[id]), false);
  }
});

test("shared rule evaluator preserves existing Web and game review behavior", () => {
  const readTemplate = (id) => JSON.parse(readFileSync(new URL(`../templates/${id}/rules.json`, import.meta.url), "utf8"));
  const webRules = readTemplate("web-small-app").rules;
  const auth = webRules.find((r) => r.ruleId === "review.authentication_runtime");
  const inputs = { "scope.deliverables.required_surfaces": ["authentication"], "technology.runtime.mode": "fully_static", "technology.runtime.external_services": [] };
  assert.equal(evaluateRuleCondition(auth.when, (id) => inputs[id]), true);
  inputs["technology.runtime.external_services"] = ["authentication"];
  assert.equal(evaluateRuleCondition(auth.when, (id) => inputs[id]), false);
  const game = readTemplate("game-development").rules.find((r) => r.ruleId === "review.online_offline");
  assert.equal(evaluateRuleCondition(game.when, (id) => ({ "game.players.player_mode": ["online_coop"], "game.technology.network": "offline" })[id]), true);
});
