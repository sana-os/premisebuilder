import test from "node:test";
import assert from "node:assert/strict";
import { confirmBase } from "../src/core.js";
import { validateDocument, validatePatch } from "../src/validation.js";
import { bundle, makeState } from "./fixtures.mjs";

test("a generated Base passes structural import validation", () => {
  const state = makeState();
  const base = confirmBase(state, bundle);
  const result = validateDocument(base, bundle);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test("an incompatible version is rejected before import", () => {
  const state = makeState();
  const base = confirmBase(state, bundle);
  base.formatVersion = "9.0.0";
  const result = validateDocument(base, bundle);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((entry) => entry.code === "document.version"));
});

test("a patch without operations is rejected", () => {
  const result = validatePatch({ format: "premise-builder-patch", formatVersion: "0.1.0", protocolVersion: "0.1.0", meta: {}, operations: [] });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((entry) => entry.code === "patch.operations"));
});

test("a patch targeting a reserved object key is rejected", () => {
  const result = validatePatch({
    format: "premise-builder-patch",
    formatVersion: "0.1.0",
    protocolVersion: "0.1.0",
    meta: {
      patchId: "pbp_reserved_key_test",
      baseDocumentId: "pb_reserved_key_test"
    },
    operations: [{
      changeId: "chg_reserved_key_test",
      op: "add",
      path: "/items/__proto__/polluted",
      value: true,
      reason: "Verify reserved-key rejection."
    }]
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((entry) => entry.code === "operation.path" && /reserved/.test(entry.message)));
});
