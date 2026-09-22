import test from "node:test";
import assert from "node:assert/strict";
import { PATCH_SCHEMA_REF, confirmBase, createId } from "../src/core.js";
import { applyPatches } from "../src/merge.js";
import { bundle, makeState } from "./fixtures.mjs";

function replacementPatch(base, previousValue) {
  const creator = Object.keys(base.participants)[0];
  const now = new Date().toISOString();
  return {
    schemaRef: PATCH_SCHEMA_REF,
    format: "premise-builder-patch",
    formatVersion: "0.1.0",
    protocolVersion: "0.1.0",
    documentType: "override",
    meta: {
      patchId: createId("pbp"),
      baseDocumentId: base.meta.documentId,
      baseRevision: base.meta.revision,
      label: "Runtime override",
      contentLanguage: "en",
      createdByRef: creator,
      scope: "environment",
      createdAt: now,
      updatedAt: now
    },
    operations: [{
      changeId: createId("chg"),
      op: "replace",
      path: "/items/project.current_phase/resolution/value",
      previousValue,
      value: "repair",
      reason: "Exercise deterministic replacement.",
      createdAt: now
    }]
  };
}

test("a matching replacement changes Unified and preserves Base", () => {
  const state = makeState();
  const base = confirmBase(state, bundle);
  const patch = replacementPatch(base, "new_build");
  const result = applyPatches(base, [patch]);
  assert.equal(result.unified.items["project.current_phase"].resolution.value, "repair");
  assert.equal(base.items["project.current_phase"].resolution.value, "new_build");
  assert.equal(result.unified.derivedFrom.baseConfirmedAt, base.meta.confirmedAt);
  assert.equal(result.unified.meta.updatedAt, patch.meta.updatedAt);
  assert.match(result.unified.derivedFrom.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(result.conflicts.length, 0);
});

test("a mismatched previous value becomes a visible conflict", () => {
  const state = makeState();
  const base = confirmBase(state, bundle);
  const patch = replacementPatch(base, "redesign");
  const result = applyPatches(base, [patch]);
  assert.equal(result.unified.items["project.current_phase"].resolution.value, "new_build");
  assert.equal(result.conflicts[0].type, "previous-value-mismatch");
  assert.equal(result.rows[0].applied, false);
});

test("an expired Override is retained in the diff but not applied", () => {
  const state = makeState();
  const base = confirmBase(state, bundle);
  const patch = replacementPatch(base, "new_build");
  patch.meta.expiresAt = "2000-01-01T00:00:00.000Z";
  const result = applyPatches(base, [patch]);
  assert.equal(result.unified.items["project.current_phase"].resolution.value, "new_build");
  assert.deepEqual(result.unified.derivedFrom.patchIds, []);
  assert.equal(result.rows[0].applied, false);
  assert.match(result.rows[0].skippedReason, /expired/i);
});

test("a reserved object path cannot mutate an object prototype", () => {
  const state = makeState();
  const base = confirmBase(state, bundle);
  const patch = replacementPatch(base, "new_build");
  patch.operations[0] = {
    ...patch.operations[0],
    op: "add",
    path: "/items/__proto__/polluted",
    value: true
  };
  delete patch.operations[0].previousValue;
  const result = applyPatches(base, [patch]);
  assert.equal(Object.prototype.polluted, undefined);
  assert.equal(result.rows[0].applied, false);
  assert.equal(result.conflicts[0].type, "missing-target");
});
