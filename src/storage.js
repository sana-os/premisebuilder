const INDEX_KEY = "premise-builder:index";
const PROJECT_PREFIX = "premise-builder:project:";
const PATCH_PREFIX = "premise-builder:patch:";
const SETTINGS_KEY = "premise-builder:settings";

function parse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export class BrowserStore {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.available = this.checkAvailability();
    this.lastError = null;
  }

  checkAvailability() {
    try {
      const key = `premise-builder:probe:${Date.now()}`;
      this.storage.setItem(key, "1");
      this.storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  listProjects() {
    if (!this.available) return [];
    return parse(this.storage.getItem(INDEX_KEY), [])
      .filter((item) => item?.documentId && item?.projectName)
      .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
  }

  hasProject(documentId) {
    if (!this.available) return false;
    return this.storage.getItem(`${PROJECT_PREFIX}${documentId}`) !== null;
  }

  loadWorkspace(documentId) {
    if (!this.available) return null;
    const state = parse(this.storage.getItem(`${PROJECT_PREFIX}${documentId}`), null);
    if (!state) return null;
    const patches = (state.patchIds || [])
      .map((patchId) => parse(this.storage.getItem(`${PATCH_PREFIX}${patchId}`), null))
      .filter(Boolean);
    return { state, patches };
  }

  saveWorkspace(state, patches = []) {
    if (!this.available) return { ok: false, error: "Browser storage is unavailable." };
    try {
      const documentId = state.document.meta.documentId;
      const previousState = parse(this.storage.getItem(`${PROJECT_PREFIX}${documentId}`), null);
      state.patchIds = patches.map((patch) => patch.meta.patchId);
      this.storage.setItem(`${PROJECT_PREFIX}${documentId}`, JSON.stringify(state));
      for (const patch of patches) {
        this.storage.setItem(`${PATCH_PREFIX}${patch.meta.patchId}`, JSON.stringify(patch));
      }
      for (const previousPatchId of previousState?.patchIds || []) {
        if (!state.patchIds.includes(previousPatchId)) this.storage.removeItem(`${PATCH_PREFIX}${previousPatchId}`);
      }
      const index = this.listProjects().filter((item) => item.documentId !== documentId);
      index.unshift({
        documentId,
        projectName: state.document.meta.projectName,
        templateId: state.document.meta.template.id,
        templateVersion: state.document.meta.template.version,
        contentLanguage: state.document.meta.contentLanguage,
        revision: state.baseDocument?.meta.revision || state.document.meta.revision,
        status: state.baseDocument ? (state.dirtySinceBase ? "changes_pending" : "base_confirmed") : "draft",
        updatedAt: state.document.meta.updatedAt
      });
      this.storage.setItem(INDEX_KEY, JSON.stringify(index));
      this.lastError = null;
      return { ok: true };
    } catch (error) {
      this.lastError = error;
      return { ok: false, error: "The current session still works, but changes could not be saved locally." };
    }
  }

  deleteProject(documentId) {
    if (!this.available) return { ok: false, error: "Browser storage is unavailable." };
    try {
      const workspace = this.loadWorkspace(documentId);
      for (const patchId of workspace?.state?.patchIds || []) this.storage.removeItem(`${PATCH_PREFIX}${patchId}`);
      this.storage.removeItem(`${PROJECT_PREFIX}${documentId}`);
      const index = this.listProjects().filter((item) => item.documentId !== documentId);
      this.storage.setItem(INDEX_KEY, JSON.stringify(index));
      return { ok: true };
    } catch {
      return { ok: false, error: "The project could not be removed from browser storage." };
    }
  }

  saveSettings(settings) {
    if (!this.available) return false;
    try {
      this.storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch {
      return false;
    }
  }

  loadSettings() {
    if (!this.available) return { uiLocale: "en", defaultExportLocale: "en" };
    return parse(this.storage.getItem(SETTINGS_KEY), { uiLocale: "en", defaultExportLocale: "en" });
  }
}
