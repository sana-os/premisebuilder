import { clone, valuesEqual } from "./core.js";

const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function decodePointerSegment(segment) {
  return segment.replaceAll("~1", "/").replaceAll("~0", "~");
}

export function encodePointerSegment(segment) {
  return String(segment).replaceAll("~", "~0").replaceAll("/", "~1");
}

export function readPointer(root, path) {
  const segments = path.split("/").slice(1).map(decodePointerSegment);
  if (segments.some((segment) => UNSAFE_KEYS.has(segment))) return { exists: false, value: undefined };
  let value = root;
  for (const segment of segments) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, segment)) return { exists: false, value: undefined };
    value = value[segment];
  }
  return { exists: true, value };
}

function parentPointer(root, path) {
  const segments = path.split("/").slice(1).map(decodePointerSegment);
  if (segments.some((segment) => UNSAFE_KEYS.has(segment))) return { exists: false };
  const key = segments.pop();
  let parent = root;
  for (const segment of segments) {
    if (!parent || typeof parent !== "object" || !Object.hasOwn(parent, segment)) return { exists: false };
    parent = parent[segment];
  }
  return { exists: Boolean(parent && typeof parent === "object"), parent, key };
}

function patchConflict(type, patch, operation, message) {
  const itemId = operation?.path?.split("/")[2]?.replaceAll("~1", "/").replaceAll("~0", "~");
  return {
    conflictId: `pbc_patch_${(operation?.changeId || patch.meta.patchId).replace(/[^A-Za-z0-9_-]/g, "_")}`.slice(0, 124),
    type,
    itemIds: itemId ? [itemId] : [],
    message,
    status: "open",
    detectedAt: new Date().toISOString()
  };
}

export function applyPatches(baseDocument, patches = []) {
  const unified = clone(baseDocument);
  const baseConflicts = clone(baseDocument.conflicts || []);
  const conflicts = [];
  const rows = [];
  const appliedPatchIds = [];

  for (const patch of patches) {
    const meta = patch.meta;
    if (meta.expiresAt && new Date(meta.expiresAt).getTime() <= Date.now()) {
      for (const operation of patch.operations) {
        const before = readPointer(unified, operation.path).value;
        rows.push({
          patch,
          operation,
          before: clone(before),
          requested: clone(operation.value),
          after: clone(before),
          applied: false,
          conflict: null,
          skippedReason: "This Override has expired and was not applied."
        });
      }
      continue;
    }
    if (meta.baseDocumentId !== baseDocument.meta.documentId || meta.baseRevision !== baseDocument.meta.revision) {
      const conflict = patchConflict("base-mismatch", patch, null, `“${meta.label}” targets a different Base document or revision.`);
      conflicts.push(conflict);
      for (const operation of patch.operations) {
        rows.push({ patch, operation, before: undefined, requested: operation.value, after: undefined, applied: false, conflict });
      }
      continue;
    }
    if (!unified.participants[meta.createdByRef]) {
      const conflict = patchConflict("missing-participant", patch, null, `The creator of “${meta.label}” is not defined in the Base.`);
      conflicts.push(conflict);
      for (const operation of patch.operations) {
        rows.push({ patch, operation, before: undefined, requested: operation.value, after: undefined, applied: false, conflict });
      }
      continue;
    }
    appliedPatchIds.push(meta.patchId);

    for (const operation of patch.operations) {
      const beforeResult = readPointer(unified, operation.path);
      let conflict = null;
      if (operation.op === "add" && beforeResult.exists) {
        conflict = patchConflict("existing-target", patch, operation, `The add target ${operation.path} already exists.`);
      } else if (["replace", "remove"].includes(operation.op) && !beforeResult.exists) {
        conflict = patchConflict("missing-target", patch, operation, `The target ${operation.path} does not exist.`);
      } else if (["replace", "remove"].includes(operation.op) && !valuesEqual(beforeResult.value, operation.previousValue)) {
        conflict = patchConflict("previous-value-mismatch", patch, operation, `The current value at ${operation.path} no longer matches the patch expectation.`);
      }

      if (conflict) {
        conflicts.push(conflict);
        rows.push({ patch, operation, before: beforeResult.value, requested: operation.value, after: beforeResult.value, applied: false, conflict });
        continue;
      }

      const target = parentPointer(unified, operation.path);
      if (!target.exists) {
        conflict = patchConflict("missing-target", patch, operation, `The parent of ${operation.path} does not exist.`);
        conflicts.push(conflict);
        rows.push({ patch, operation, before: beforeResult.value, requested: operation.value, after: beforeResult.value, applied: false, conflict });
        continue;
      }

      if (operation.op === "remove") delete target.parent[target.key];
      else target.parent[target.key] = clone(operation.value);
      const afterResult = readPointer(unified, operation.path);
      rows.push({
        patch,
        operation,
        before: clone(beforeResult.value),
        requested: clone(operation.value),
        after: clone(afterResult.value),
        applied: true,
        conflict: null
      });
    }
  }

  unified.documentType = "unified";
  unified.derivedFrom = {
    baseDocumentId: baseDocument.meta.documentId,
    baseRevision: baseDocument.meta.revision,
    patchIds: appliedPatchIds,
    generatedAt: new Date().toISOString()
  };
  unified.meta.updatedAt = unified.derivedFrom.generatedAt;
  unified.conflicts = [...baseConflicts, ...conflicts];
  return { unified, conflicts, rows };
}
