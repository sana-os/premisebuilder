import { AUTHORIZED_STATUSES, FORMAT_VERSION, PROTOCOL_VERSION, hasValue } from "./core.js";

function issue(code, path, message) {
  return { code, path, message };
}

const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export function validateAnswer(question, value, note = "") {
  const errors = [];
  if (question.responseType === "single-choice" && hasValue(value)) {
    if (!question.choices.some((choice) => choice.value === value)) {
      errors.push(issue("choice.invalid", question.questionId, "Choose one of the available answers."));
    }
  }
  if (question.responseType === "multi-choice") {
    if (!Array.isArray(value)) {
      if (hasValue(value)) errors.push(issue("answer.type", question.questionId, "This answer must be a list of choices."));
    } else {
      const allowed = new Set(question.choices.map((choice) => choice.value));
      if (value.some((entry) => !allowed.has(entry))) {
        errors.push(issue("choice.invalid", question.questionId, "One or more choices are not available."));
      }
      const exclusive = question.choices.find((choice) => choice.exclusive && value.includes(choice.value));
      if (exclusive && value.length > 1) {
        errors.push(issue("choice.exclusive", question.questionId, `“${exclusive.label}” cannot be combined with another choice.`));
      }
      if (question.maxSelections && value.length > question.maxSelections) {
        errors.push(issue("choice.limit", question.questionId, `Choose no more than ${question.maxSelections} options.`));
      }
    }
  }
  const selectedValues = Array.isArray(value) ? value : [value];
  const requiresNote = question.choices?.some((choice) => choice.requiresNote && selectedValues.includes(choice.value));
  if (requiresNote && !note.trim()) {
    errors.push(issue("note.required", question.questionId, "Add a short note for the selected answer."));
  }
  return { valid: errors.length === 0, errors };
}

export function validateDocument(document, bundle) {
  const errors = [];
  const warnings = [];
  if (!document || typeof document !== "object" || Array.isArray(document)) {
    return { valid: false, errors: [issue("document.type", "/", "The imported file is not a premise document.")], warnings };
  }
  if (document.format !== "premise-builder") errors.push(issue("document.format", "/format", "Unsupported document format."));
  if (document.formatVersion !== FORMAT_VERSION) errors.push(issue("document.version", "/formatVersion", "Unsupported format version."));
  if (document.protocolVersion !== PROTOCOL_VERSION) errors.push(issue("document.protocol", "/protocolVersion", "Unsupported protocol version."));
  if (!["base", "unified"].includes(document.documentType)) errors.push(issue("document.type", "/documentType", "Expected a Base or Unified document."));
  if (document.meta?.template?.id !== bundle.manifest.id) errors.push(issue("template.id", "/meta/template/id", "This template is not supported by the current application."));
  if (document.meta?.template?.version !== bundle.manifest.version) errors.push(issue("template.version", "/meta/template/version", "This template version is not supported."));
  if (!/^pb_[A-Za-z0-9_-]{6,120}$/.test(document.meta?.documentId || "")) errors.push(issue("document.id", "/meta/documentId", "The document ID is missing or invalid."));
  if (!document.meta?.projectName || typeof document.meta.projectName !== "string") errors.push(issue("project.name", "/meta/projectName", "The project name is missing."));
  if (!document.participants || typeof document.participants !== "object") errors.push(issue("participants.type", "/participants", "Participants are missing."));
  if (!document.items || typeof document.items !== "object") errors.push(issue("items.type", "/items", "Premise items are missing."));

  const participants = document.participants || {};
  if (!Object.keys(participants).length) errors.push(issue("participants.empty", "/participants", "At least one participant or role is required."));
  for (const [participantId, participant] of Object.entries(participants)) {
    if (UNSAFE_KEYS.has(participantId)) errors.push(issue("participant.id", `/participants/${participantId}`, "A participant ID uses a reserved key."));
    if (!/^participant_[A-Za-z0-9_-]{3,120}$/.test(participantId)) errors.push(issue("participant.id", `/participants/${participantId}`, "A participant ID is invalid."));
    if (!participant?.label || !Array.isArray(participant.roles) || !participant.roles.length) {
      errors.push(issue("participant.shape", `/participants/${participantId}`, "A participant label or role is missing."));
    }
  }

  for (const [itemId, item] of Object.entries(document.items || {})) {
    if (UNSAFE_KEYS.has(itemId)) errors.push(issue("item.id", `/items/${itemId}`, "A premise item ID uses a reserved key."));
    if (!item?.resolution || !item?.contributions) {
      errors.push(issue("item.shape", `/items/${itemId}`, "A premise item is incomplete."));
      continue;
    }
    for (const [contributionId, contribution] of Object.entries(item.contributions)) {
      const perspective = participants[contribution.perspectiveRef];
      const recorder = participants[contribution.recordedByRef];
      if (!perspective || !recorder) {
        errors.push(issue("contribution.participant", `/items/${itemId}/contributions/${contributionId}`, "A contribution references a missing participant."));
      } else if (!perspective.roles.includes(contribution.speakingAs)) {
        errors.push(issue("contribution.role", `/items/${itemId}/contributions/${contributionId}/speakingAs`, "The speaking role is not assigned to this perspective."));
      }
      if (contribution.captureMethod === "inference" && contribution.confirmation !== "unconfirmed") {
        errors.push(issue("contribution.inference", `/items/${itemId}/contributions/${contributionId}/confirmation`, "An inference must remain unconfirmed."));
      }
    }
    if (AUTHORIZED_STATUSES.has(item.resolution.status)) {
      if (!item.resolution.decidedAt || !item.resolution.decidedByRefs?.length) {
        errors.push(issue("resolution.authority", `/items/${itemId}/resolution`, "A confirmed, delegated, or not-applicable resolution requires a recorded decider."));
      }
    }
    for (const participantId of item.resolution.decidedByRefs || []) {
      if (!participants[participantId]) errors.push(issue("resolution.participant", `/items/${itemId}/resolution/decidedByRefs`, "A resolution references a missing participant."));
    }
  }

  if (document.documentType === "unified" && !document.derivedFrom) {
    errors.push(issue("unified.source", "/derivedFrom", "A Unified document must identify its Base and patches."));
  }
  if (document.conflicts?.some((conflict) => conflict.status === "open")) {
    warnings.push(issue("document.conflicts", "/conflicts", "The document contains open structural conflicts."));
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validatePatch(patch) {
  const errors = [];
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return { valid: false, errors: [issue("patch.type", "/", "The imported file is not an Override patch.")] };
  }
  if (patch.format !== "premise-builder-patch") errors.push(issue("patch.format", "/format", "Unsupported patch format."));
  if (patch.formatVersion !== FORMAT_VERSION || patch.protocolVersion !== PROTOCOL_VERSION) {
    errors.push(issue("patch.version", "/formatVersion", "Unsupported patch or protocol version."));
  }
  if (!/^pbp_[A-Za-z0-9_-]{6,120}$/.test(patch.meta?.patchId || "")) errors.push(issue("patch.id", "/meta/patchId", "The patch ID is missing or invalid."));
  if (!/^pb_[A-Za-z0-9_-]{6,120}$/.test(patch.meta?.baseDocumentId || "")) errors.push(issue("patch.base", "/meta/baseDocumentId", "The Base document ID is missing or invalid."));
  if (!Array.isArray(patch.operations) || !patch.operations.length) errors.push(issue("patch.operations", "/operations", "The patch has no operations."));
  for (const [index, operation] of (patch.operations || []).entries()) {
    const path = `/operations/${index}`;
    if (!["add", "replace", "remove"].includes(operation.op)) errors.push(issue("operation.op", `${path}/op`, "Unsupported patch operation."));
    if (!/^\/(items|participants)\/[A-Za-z0-9_.~-]+(?:\/[A-Za-z0-9_.~-]+)*$/.test(operation.path || "")) {
      errors.push(issue("operation.path", `${path}/path`, "The patch target must be under items or participants."));
    }
    const pathSegments = String(operation.path || "").split("/").slice(1).map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"));
    if (pathSegments.some((segment) => UNSAFE_KEYS.has(segment))) {
      errors.push(issue("operation.path", `${path}/path`, "The patch target contains a reserved object key."));
    }
    if (!operation.reason?.trim()) errors.push(issue("operation.reason", `${path}/reason`, "Every change needs a reason."));
    if (operation.op === "add" && !("value" in operation)) errors.push(issue("operation.value", `${path}/value`, "An add operation requires a value."));
    if (["replace", "remove"].includes(operation.op) && !("previousValue" in operation)) errors.push(issue("operation.previous", `${path}/previousValue`, "This operation requires the expected previous value."));
    if (operation.op === "replace" && !("value" in operation)) errors.push(issue("operation.value", `${path}/value`, "A replace operation requires a value."));
  }
  return { valid: errors.length === 0, errors };
}
