import test from "node:test";
import assert from "node:assert/strict";
import { confirmBase, createId, rebuildDocument } from "../src/core.js";
import { bundle, makeState } from "./fixtures.mjs";

test("a new project produces every stable template item", () => {
  const state = makeState();
  assert.equal(Object.keys(state.document.items).length, bundle.manifest.questionCount);
  assert.equal(state.document.handling.storage, "browser-local-only");
  assert.equal(state.document.items["project.current_phase"].resolution.status, "provisional");
});

test("perspective and recorder remain distinct in an interview", () => {
  const state = makeState({ decisionOwner: false, differentPerspective: true });
  const questionId = "audience.context.primary_group";
  const contributionId = createId("pbc");
  state.responses[questionId] = {
    contributions: {
      [contributionId]: {
        value: "general_public",
        note: "Reported during an interview.",
        context: structuredClone(state.context),
        recordedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    activeContributionId: contributionId,
    resolution: { status: "unspecified", sourceContributionId: null, decidedByRefs: [], decidedAt: null, note: "" }
  };
  rebuildDocument(state, bundle);
  const contribution = Object.values(state.document.items["audience.primary_group"].contributions)[0];
  assert.notEqual(contribution.perspectiveRef, contribution.recordedByRef);
  assert.equal(contribution.speakingAs, "end_user");
  assert.equal(contribution.captureMethod, "interview");
});

test("an inference is exported as unconfirmed", () => {
  const state = makeState();
  const questionId = "audience.context.domain_familiarity";
  const contributionId = createId("pbc");
  state.responses[questionId] = {
    contributions: {
      [contributionId]: {
        value: "beginner",
        note: "Developer inference",
        context: { ...state.context, captureMethod: "inference", confirmation: "source_confirmed" },
        recordedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    activeContributionId: contributionId,
    resolution: { status: "unspecified", sourceContributionId: null, decidedByRefs: [], decidedAt: null, note: "" }
  };
  rebuildDocument(state, bundle);
  const contribution = Object.values(state.document.items["audience.domain_familiarity"].contributions)[0];
  assert.equal(contribution.confirmation, "unconfirmed");
});

test("confirming Base creates an immutable snapshot at revision one", () => {
  const state = makeState();
  const base = confirmBase(state, bundle);
  assert.equal(base.meta.revision, 1);
  assert.equal(base.meta.confirmedAt, state.baseConfirmedAt);
  assert.equal(state.baseConfirmationKnown, true);
  assert.match(base.meta.confirmedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(state.dirtySinceBase, false);
  assert.notEqual(base, state.document);
});
