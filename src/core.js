export const FORMAT_VERSION = "0.1.0";
export const PROTOCOL_VERSION = "0.1.0";
export const DOCUMENT_SCHEMA_REF = "urn:premise-builder:schema:document:0.1.0";
export const PATCH_SCHEMA_REF = "urn:premise-builder:schema:patch:0.1.0";

export const RESOLUTION_STATUSES = [
  "confirmed",
  "provisional",
  "unspecified",
  "proposal_requested",
  "delegated",
  "not_applicable",
  "conflict"
];

export const RESOLVED_STATUSES = new Set(["confirmed", "provisional", "delegated", "not_applicable"]);
export const AUTHORIZED_STATUSES = new Set(["confirmed", "delegated", "not_applicable"]);

export const ROLE_LABELS = {
  developer: "Developer",
  end_user: "End user",
  requester: "Requester",
  decision_owner: "Decision owner",
  designer: "Designer",
  maintainer: "Maintainer",
  security_compliance: "Security or compliance",
  mixed: "Mixed group",
  unknown: "Unknown source"
};

export const AUTHORITY_LABELS = {
  decision_owner: "Decision owner",
  domain_authority: "Domain authority",
  implementation_authority: "Implementation authority",
  consulted: "Consulted",
  informant: "Informant",
  recorder_only: "Recorder only",
  unknown: "Unknown"
};

export function createId(prefix) {
  const random = crypto.randomUUID().replaceAll("-", "");
  return `${prefix}_${random.slice(0, 20)}`;
}

export function clone(value) {
  return structuredClone(value);
}

export function hasValue(value) {
  return value !== null && value !== undefined && value !== "" && (!Array.isArray(value) || value.length > 0);
}

export function valuesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function normalizeLanguageTag(value) {
  return value.trim().replaceAll("_", "-").toLowerCase();
}

export function humanize(value) {
  return String(value).replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function slugify(value) {
  const slug = String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug || "premise-project";
}

export function participantKindForRole(role) {
  if (role === "end_user" || role === "mixed") return "group";
  if (role === "unknown") return "unknown";
  return "role";
}

export function defaultAuthorityForRole(role) {
  if (role === "decision_owner") return "decision_owner";
  if (role === "developer" || role === "maintainer") return "implementation_authority";
  if (role === "designer" || role === "security_compliance") return "domain_authority";
  if (role === "end_user") return "informant";
  if (role === "requester" || role === "mixed") return "consulted";
  return "unknown";
}

export function createBlankResponse() {
  return {
    contributions: {},
    activeContributionId: null,
    resolution: {
      status: "unspecified",
      sourceContributionId: null,
      decidedByRefs: [],
      decidedAt: null,
      note: ""
    }
  };
}

export function acceptedAuthoritiesForQuestion(questionId, bundle) {
  const question = bundle.locale.questions.find((candidate) => candidate.questionId === questionId);
  const mapping = bundle.mappings.mappings.find((candidate) => candidate.questionId === questionId);
  const categoryPolicy = bundle.mappings.categoryProvenance[question.category];
  return mapping.provenanceOverride?.acceptedResolutionAuthorities || categoryPolicy.acceptedResolutionAuthorities;
}

export function eligibleDeciders(questionId, state, bundle) {
  const accepted = new Set(acceptedAuthoritiesForQuestion(questionId, bundle));
  const ids = new Set();
  for (const [participantId, participant] of Object.entries(state.document.participants)) {
    if (participant.roles.includes("decision_owner")) ids.add(participantId);
  }
  const response = state.responses[questionId];
  for (const contribution of Object.values(response?.contributions || {})) {
    if (accepted.has(contribution.context.authority)) ids.add(contribution.context.perspectiveRef);
  }
  return [...ids].filter((id) => state.document.participants[id]);
}

export function orderedQuestions(bundle) {
  const categoryOrder = new Map(bundle.manifest.categoryOrder.map((id, index) => [id, index]));
  return [...bundle.locale.questions].sort((left, right) => {
    const categoryDelta = categoryOrder.get(left.category) - categoryOrder.get(right.category);
    return categoryDelta || left.order - right.order;
  });
}

export function createProjectState(input, bundle) {
  const now = new Date().toISOString();
  const operatorRef = createId("participant");
  const operatorRoles = [...new Set([
    input.recorderRole,
    ...(input.recorderIsDecisionOwner ? ["decision_owner"] : [])
  ])];
  const participants = {
    [operatorRef]: {
      kind: "individual",
      label: input.recorderLabel,
      labelLanguage: bundle.locale.locale,
      roles: operatorRoles
    }
  };

  const operatorContext = {
    perspectiveRef: operatorRef,
    recordedByRef: operatorRef,
    speakingAs: input.recorderRole,
    captureMethod: "direct_input",
    authority: input.recorderIsDecisionOwner ? "decision_owner" : defaultAuthorityForRole(input.recorderRole),
    confirmation: "directly_reported"
  };

  let initialContext = { ...operatorContext };
  if (input.perspectiveMode === "different") {
    const perspectiveRef = createId("participant");
    participants[perspectiveRef] = {
      kind: participantKindForRole(input.perspectiveRole),
      label: input.perspectiveLabel,
      labelLanguage: bundle.locale.locale,
      roles: [input.perspectiveRole]
    };
    initialContext = {
      perspectiveRef,
      recordedByRef: operatorRef,
      speakingAs: input.perspectiveRole,
      captureMethod: "interview",
      authority: defaultAuthorityForRole(input.perspectiveRole),
      confirmation: "directly_reported"
    };
  }

  const document = {
    schemaRef: DOCUMENT_SCHEMA_REF,
    format: "premise-builder",
    formatVersion: FORMAT_VERSION,
    protocolVersion: bundle.manifest.protocolVersion,
    documentType: "base",
    meta: {
      documentId: createId("pb"),
      projectName: input.projectName,
      template: {
        id: bundle.manifest.id,
        family: bundle.manifest.family,
        version: bundle.manifest.version
      },
      contentLanguage: input.contentLanguage,
      revision: 1,
      createdAt: now,
      updatedAt: now
    },
    handling: {
      privacy: "private-by-default",
      storage: "browser-local-only",
      networkPolicy: "no-project-data-transmission",
      aiInterpretation: {
        governingInstructionPolicy: "never-override-host-instructions",
        unknownPolicy: "do-not-assume",
        conflictPolicy: "report-before-dependent-work",
        proposalPolicy: "requires-human-approval"
      }
    },
    participants,
    items: {},
    conflicts: []
  };

  const responses = {};
  const phaseQuestionId = "project.intent.current_phase";
  const phaseContributionId = createId("pbc");
  responses[phaseQuestionId] = createBlankResponse();
  responses[phaseQuestionId].contributions[phaseContributionId] = {
    value: input.phase,
    note: "",
    context: operatorContext,
    recordedAt: now,
    updatedAt: now
  };
  responses[phaseQuestionId].activeContributionId = phaseContributionId;
  responses[phaseQuestionId].resolution = {
    status: "provisional",
    sourceContributionId: phaseContributionId,
    decidedByRefs: [operatorRef],
    decidedAt: now,
    note: ""
  };

  const state = {
    stateVersion: 1,
    document,
    baseDocument: null,
    baseConfirmedAt: null,
    dirtySinceBase: true,
    responses,
    context: initialContext,
    currentQuestionId: orderedQuestions(bundle)[0].questionId,
    customItems: {},
    patchIds: []
  };
  rebuildDocument(state, bundle);
  return state;
}

function choiceEffect(mapping, value) {
  const values = Array.isArray(value) ? value : [value];
  const effects = values.map((entry) => mapping.choiceEffects?.[entry]).filter(Boolean);
  if (!effects.length) return {};
  const rank = { advisory: 0, soft: 1, hard: 2 };
  return effects.reduce((combined, effect, index) => {
    if (effect.enforcement && (index === 0 || rank[effect.enforcement] > rank[combined.enforcement || "advisory"])) {
      combined.enforcement = effect.enforcement;
    }
    if (effect.resolutionStatus) combined.resolutionStatus = effect.resolutionStatus;
    return combined;
  }, {});
}

function decisionMethodForStatus(status) {
  if (status === "confirmed" || status === "not_applicable") return "explicit_confirmation";
  if (status === "provisional") return "working_selection";
  if (status === "delegated") return "delegated_choice";
  if (status === "conflict") return "rule_derived";
  return "unresolved";
}

function conflictRecord(type, itemId, message, previousConflicts, participantIds = []) {
  const stableSuffix = `${type}_${itemId}`.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 100);
  const conflictId = `pbc_${stableSuffix}`;
  const previous = previousConflicts.find((entry) => entry.conflictId === conflictId && entry.status === "open");
  return {
    conflictId,
    type,
    itemIds: [itemId],
    ...(participantIds.length ? { participantIds: [...new Set(participantIds)] } : {}),
    message,
    status: "open",
    detectedAt: previous?.detectedAt || new Date().toISOString()
  };
}

export function rebuildDocument(state, bundle) {
  const mappingByQuestion = new Map(bundle.mappings.mappings.map((mapping) => [mapping.questionId, mapping]));
  const previousConflicts = state.document.conflicts || [];
  const items = clone(state.customItems || {});
  const conflicts = [];

  for (const question of orderedQuestions(bundle)) {
    const mapping = mappingByQuestion.get(question.questionId);
    const response = state.responses[question.questionId] || createBlankResponse();
    const contributions = {};
    let latestUpdate = state.document.meta.createdAt;

    for (const [contributionId, stored] of Object.entries(response.contributions || {})) {
      if (!hasValue(stored.value)) continue;
      const context = stored.context;
      const participant = state.document.participants[context.perspectiveRef];
      const recorder = state.document.participants[context.recordedByRef];
      if (!participant || !recorder) {
        conflicts.push(conflictRecord(
          "missing-participant",
          mapping.itemId,
          "A contribution references a participant that is not defined.",
          previousConflicts,
          [context.perspectiveRef, context.recordedByRef]
        ));
        continue;
      }
      if (!participant.roles.includes(context.speakingAs)) {
        conflicts.push(conflictRecord(
          "speaking-role-mismatch",
          mapping.itemId,
          "A contribution uses a speaking role that is not assigned to its perspective.",
          previousConflicts,
          [context.perspectiveRef]
        ));
        continue;
      }
      contributions[contributionId] = {
        perspectiveRef: context.perspectiveRef,
        recordedByRef: context.recordedByRef,
        speakingAs: context.speakingAs,
        captureMethod: context.captureMethod,
        authority: context.authority,
        confirmation: context.captureMethod === "inference" ? "unconfirmed" : context.confirmation,
        value: clone(stored.value),
        recordedAt: stored.recordedAt
      };
      if (stored.note) contributions[contributionId].note = stored.note;
      if (stored.updatedAt > latestUpdate) latestUpdate = stored.updatedAt;
    }

    const source = contributions[response.resolution.sourceContributionId];
    const sourceValue = source?.value ?? null;
    const effect = choiceEffect(mapping, sourceValue);
    let status = effect.resolutionStatus || response.resolution.status || "unspecified";
    const decidedByRefs = (response.resolution.decidedByRefs || []).filter((id) => state.document.participants[id]);
    const acceptedAuthorities = new Set(acceptedAuthoritiesForQuestion(question.questionId, bundle));
    const hasDecisionAuthority = decidedByRefs.some((participantId) => {
      if (state.document.participants[participantId]?.roles.includes("decision_owner")) return true;
      return Object.values(contributions).some(
        (contribution) => contribution.perspectiveRef === participantId && acceptedAuthorities.has(contribution.authority)
      );
    });

    if (AUTHORIZED_STATUSES.has(status) && !hasDecisionAuthority) {
      conflicts.push(conflictRecord(
        "resolution-authority-missing",
        mapping.itemId,
        "This resolution has no qualifying decision authority.",
        previousConflicts,
        decidedByRefs
      ));
      status = "conflict";
    }

    const distinctContributionValues = new Set(
      Object.values(contributions).map((contribution) => JSON.stringify(contribution.value))
    );
    if (distinctContributionValues.size > 1 && ["unspecified", "proposal_requested"].includes(status)) {
      conflicts.push(conflictRecord(
        "unresolved-perspective-divergence",
        mapping.itemId,
        "Different perspectives contributed unequal values and no project resolution has selected one.",
        previousConflicts,
        Object.values(contributions).map((contribution) => contribution.perspectiveRef)
      ));
      status = "conflict";
    }

    const resolved = RESOLVED_STATUSES.has(status);
    const resolutionValue = ["unspecified", "proposal_requested", "not_applicable", "conflict"].includes(status)
      ? null
      : (hasValue(sourceValue) ? clone(sourceValue) : null);
    const hasDecisionRecord = resolved && (status === "provisional" || hasDecisionAuthority);

    items[mapping.itemId] = {
      label: question.prompt,
      labelLanguage: bundle.locale.locale,
      category: question.category,
      axis: resolved ? mapping.axisWhenResolved : bundle.mappings.mappingDefaults.axisWhenUnresolved,
      kind: mapping.kind,
      scope: "project",
      enforcement: effect.enforcement || mapping.enforcement,
      priority: mapping.priority,
      contributions,
      resolution: {
        status,
        value: resolutionValue,
        decidedByRefs: hasDecisionRecord ? decidedByRefs : [],
        decisionMethod: decisionMethodForStatus(status),
        decidedAt: hasDecisionRecord ? (response.resolution.decidedAt || latestUpdate) : null,
        ...(response.resolution.note ? { note: response.resolution.note } : {})
      },
      dependencies: [],
      updatedAt: latestUpdate
    };

    if (question.questionId === "acceptance.validation.must_pass_scenarios" && Array.isArray(sourceValue)) {
      const labels = new Map(question.choices.map((choice) => [choice.value, choice.label]));
      items[mapping.itemId].acceptanceCriteria = sourceValue.map((value) => labels.get(value) || value);
    }
    if (question.questionId === "project.intent.success_evidence" && typeof sourceValue === "string" && sourceValue.trim()) {
      items[mapping.itemId].acceptanceCriteria = [sourceValue.trim()];
    }

    const sourceStored = response.contributions?.[response.resolution.sourceContributionId];
    if (sourceStored?.note) items[mapping.itemId].rationale = sourceStored.note.slice(0, 4000);
  }

  state.document.items = items;
  state.document.conflicts = conflicts;
  state.document.meta.updatedAt = new Date().toISOString();
  return state.document;
}

export function confirmBase(state, bundle) {
  rebuildDocument(state, bundle);
  const now = new Date().toISOString();
  const nextRevision = state.baseDocument ? state.baseDocument.meta.revision + 1 : 1;
  state.document.meta.revision = nextRevision;
  state.document.meta.updatedAt = now;
  state.document.documentType = "base";
  delete state.document.derivedFrom;
  state.baseDocument = clone(state.document);
  state.baseConfirmedAt = now;
  state.dirtySinceBase = false;
  return state.baseDocument;
}

export function markDraftChanged(state) {
  state.dirtySinceBase = true;
}

export function stateFromImportedDocument(importedDocument, bundle) {
  const document = clone(importedDocument);
  const importedUpdatedAt = document.meta.updatedAt;
  document.documentType = "base";
  delete document.derivedFrom;
  const mappingByItem = new Map(bundle.mappings.mappings.map((mapping) => [mapping.itemId, mapping]));
  const questionsById = new Map(bundle.locale.questions.map((question) => [question.questionId, question]));
  const responses = {};
  const customItems = {};
  let firstContext = null;

  for (const [itemId, item] of Object.entries(document.items)) {
    const mapping = mappingByItem.get(itemId);
    if (!mapping || !questionsById.has(mapping.questionId)) {
      customItems[itemId] = clone(item);
      continue;
    }
    const response = createBlankResponse();
    for (const [contributionId, contribution] of Object.entries(item.contributions)) {
      const context = {
        perspectiveRef: contribution.perspectiveRef,
        recordedByRef: contribution.recordedByRef,
        speakingAs: contribution.speakingAs,
        captureMethod: contribution.captureMethod,
        authority: contribution.authority,
        confirmation: contribution.confirmation
      };
      response.contributions[contributionId] = {
        value: clone(contribution.value),
        note: contribution.note || "",
        context,
        recordedAt: contribution.recordedAt,
        updatedAt: item.updatedAt
      };
      if (!firstContext) firstContext = context;
      if (valuesEqual(contribution.value, item.resolution.value)) response.resolution.sourceContributionId = contributionId;
    }
    response.activeContributionId = response.resolution.sourceContributionId || Object.keys(response.contributions)[0] || null;
    response.resolution = {
      status: item.resolution.status,
      sourceContributionId: response.resolution.sourceContributionId,
      decidedByRefs: clone(item.resolution.decidedByRefs),
      decidedAt: item.resolution.decidedAt,
      note: item.resolution.note || ""
    };
    responses[mapping.questionId] = response;
  }

  if (!firstContext) {
    const firstParticipantId = Object.keys(document.participants)[0];
    const participant = document.participants[firstParticipantId];
    firstContext = {
      perspectiveRef: firstParticipantId,
      recordedByRef: firstParticipantId,
      speakingAs: participant.roles[0],
      captureMethod: "document_import",
      authority: defaultAuthorityForRole(participant.roles[0]),
      confirmation: "imported_unverified"
    };
  }

  const state = {
    stateVersion: 1,
    document,
    baseDocument: clone(document),
    baseConfirmedAt: document.meta.updatedAt,
    dirtySinceBase: false,
    responses,
    context: firstContext,
    currentQuestionId: orderedQuestions(bundle)[0].questionId,
    customItems,
    patchIds: []
  };
  rebuildDocument(state, bundle);
  state.document.meta.revision = document.meta.revision;
  state.document.meta.updatedAt = importedUpdatedAt;
  state.baseDocument = clone(state.document);
  state.baseConfirmedAt = document.meta.updatedAt;
  state.dirtySinceBase = false;
  return state;
}
