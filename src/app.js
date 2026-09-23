import {
  AUTHORITY_LABELS,
  AUTHORIZED_STATUSES,
  PATCH_SCHEMA_REF,
  RESOLVED_STATUSES,
  ROLE_LABELS,
  acceptedAuthoritiesForQuestion,
  clone,
  confirmBase,
  createBlankResponse,
  createId,
  createProjectState,
  defaultAuthorityForRole,
  eligibleDeciders,
  hasValue,
  humanize,
  markDraftChanged,
  normalizeLanguageTag,
  orderedQuestions,
  participantKindForRole,
  rebuildDocument,
  stateFromImportedDocument,
  valuesEqual
} from "./core.js";
import { BrowserStore } from "./storage.js";
import { applyPatches, encodePointerSegment, readPointer } from "./merge.js";
import { downloadText, exportFilename, generateAIContext, readJsonFile } from "./import-export.js";
import { validateAnswer, validateDocument, validatePatch } from "./validation.js";

const TEMPLATE_ID = "web-small-app";
const bootData = globalThis.__PREMISE_BUILDER_DATA__;
const store = new BrowserStore();
const elements = Object.fromEntries([
  "loadingView", "errorView", "homeView", "setupView", "workspaceView", "brandHomeButton", "topImportButton",
  "languageSwitcher",
  "templateList", "importButton", "importFileInput", "projectList", "projectEmptyState", "storageState",
  "cancelSetupButton", "cancelSetupInlineButton", "setupTemplateName", "projectForm", "projectName", "projectPhase", "contentLanguage",
  "recorderLabel", "recorderRole", "recorderDecisionOwner", "differentPerspective", "perspectiveFields",
  "perspectiveLabel", "perspectiveRole", "allProjectsButton", "workspaceProjectName", "workspaceProjectMeta",
  "saveState", "deleteProjectButton", "workspaceGrid", "categoryPanel", "categoryList", "overallProgress",
  "questionsView", "reviewView", "overridesView", "exportView", "questionCategory", "questionProgress", "progressBar",
  "contributionSelect", "newContributionButton", "removeContributionButton", "contextSummary", "perspectiveSelect",
  "recorderSelect", "speakingAsSelect", "captureMethodSelect", "authoritySelect", "confirmationSelect",
  "addParticipantButton", "questionHelp", "questionPrompt", "answerControl", "answerNote", "resolutionSelect",
  "resolutionSourceSelect", "resolutionDeciderSelect", "resolutionHint", "validationMessage", "previousQuestion",
  "leaveUnresolvedButton", "nextQuestion", "reviewSearch", "filterAxis", "filterStatus", "filterCategory",
  "filterEnforcement", "filterPriority", "filterPerspective", "filterRecorder", "filterCapture", "filterAuthority", "filterConfirmation",
  "unresolvedList", "conflictList", "reviewRows", "confirmBaseButton", "baseWarning", "overrideBaseState",
  "overrideNeedsBase", "patchForm", "patchLabel", "patchScope", "patchCreatedBy", "patchExpiresAt", "patchOperation",
  "existingTargetFields", "patchTargetItem", "patchPreviousValue", "newItemFields", "patchNewItemId",
  "patchNewItemLabel", "patchNewItemCategory", "patchNewItemAxis", "patchNewItemKind", "patchNewItemEnforcement",
  "patchValueField", "patchValue", "patchReason", "createPatchButton", "patchValidation", "patchCount", "patchList",
  "diffState", "diffRows", "exportBaseWarning", "exportBaseButton", "patchExportSelect", "exportPatchButton",
  "exportUnifiedButton", "exportMarkdownButton", "copyMarkdownButton", "exportPreviewSelect", "exportPreview",
  "documentStatus", "statusCounts", "axisCounts", "summaryNext", "jsonPreview", "deleteDialog", "deleteProjectName",
  "confirmDeleteButton", "participantDialog", "participantForm", "participantLabel", "participantRole",
  "cancelParticipantButton", "privacyDialog", "formatDialog", "toast"
].map((id) => [id, document.getElementById(id)]));

let bundle;
let uiLocale = "ja";
let chromeLocale = {};
let chromeStrings = {};
let chromeText = {};
let chromeLabels = {};
let chromeMessages = {};
let questions = [];
let categoryById = new Map();
let mappingByQuestion = new Map();
let questionByItem = new Map();
let state = null;
let patches = [];
let currentQuestionIndex = 0;
let activeWorkspaceView = "questions";
let pendingDeleteId = null;
let saveTimer = null;
let toastTimer = null;
let registeredTools = false;

bootstrap();

function bootstrap() {
  try {
    if (!bootData?.templates?.[TEMPLATE_ID]) throw new Error("Bundled template data is missing");
    const firstPathSegment = globalThis.location.pathname.split("/").filter(Boolean)[0];
    uiLocale = bootData.locales?.[firstPathSegment]
      ? firstPathSegment
      : bootData.templates[TEMPLATE_ID].manifest.defaultLocale;
    chromeLocale = bootData.locales?.[uiLocale] || bootData.locales?.en || { locale: "en", direction: "ltr" };
    chromeStrings = chromeLocale.strings || {};
    chromeText = chromeLocale.text || {};
    chromeLabels = chromeLocale.labels || {};
    chromeMessages = chromeLocale.messages || {};
    document.documentElement.lang = chromeLocale.locale;
    document.documentElement.dir = chromeLocale.direction;
    document.title = chromeStrings["meta.title"] || "Premise Builder — Requirements Alignment for Web Projects";
    document.querySelector('meta[name="description"]').content = chromeStrings["meta.description"] || "Align requirements, roles, constraints, and unknowns before work begins.";
    for (const node of document.querySelectorAll("[data-i18n]")) {
      if (chromeStrings[node.dataset.i18n]) node.textContent = chromeStrings[node.dataset.i18n];
    }
    translateStaticTree(document.body);
    renderLanguageSwitcher();
    configureBundle(TEMPLATE_ID, uiLocale);
    wireEvents();
    const routeMatch = globalThis.location.pathname.match(/^\/(?:[a-z0-9-]+\/)?new\/([A-Za-z0-9_.-]+)\/?$/);
    if (routeMatch && bootData.templates[routeMatch[1]]) {
      configureBundle(routeMatch[1], uiLocale);
      showSetup();
    } else showHome();
    registerWebMcpTools();
  } catch (error) {
    console.error(error);
    showOnly(elements.errorView);
  }
}

function renderLanguageSwitcher() {
  const pathParts = globalThis.location.pathname.split("/").filter(Boolean);
  if (bootData.locales?.[pathParts[0]]) pathParts.shift();
  const suffix = pathParts.length ? `/${pathParts.join("/")}/` : "/";
  elements.languageSwitcher.replaceChildren();
  const localeOrder = bootData.templates?.[TEMPLATE_ID]?.manifest?.locales || Object.keys(bootData.locales || {});
  for (const localeId of localeOrder) {
    const locale = bootData.locales?.[localeId];
    if (!locale) continue;
    const link = document.createElement("a");
    link.href = `/${localeId}${suffix}`;
    link.lang = localeId;
    link.textContent = locale.name || localeId;
    link.setAttribute("aria-current", localeId === uiLocale ? "page" : "false");
    elements.languageSwitcher.append(link);
  }
}

function assertTemplateCompatibility() {
  const { manifest, locale, mappings, rules } = bundle;
  if (
    manifest.id !== TEMPLATE_ID ||
    locale.templateId !== manifest.id ||
    mappings.templateId !== manifest.id ||
    rules.templateId !== manifest.id ||
    locale.templateVersion !== manifest.version ||
    mappings.version !== manifest.version ||
    rules.version !== manifest.version ||
    locale.questions.length !== manifest.questionCount
  ) throw new Error("The bundled template files do not share one compatible version");
}

function configureBundle(templateId, locale = uiLocale) {
  const selected = bootData.templates[templateId];
  if (!selected) throw new Error(`Unsupported template: ${templateId}`);
  bundle = { ...selected, locale: selected.locales?.[locale] || selected.locale };
  assertTemplateCompatibility();
  questions = orderedQuestions(bundle);
  categoryById = new Map(bundle.locale.categories.map((category) => [category.id, category]));
  mappingByQuestion = new Map(bundle.mappings.mappings.map((mapping) => [mapping.questionId, mapping]));
  questionByItem = new Map(bundle.mappings.mappings.map((mapping) => [mapping.itemId, mapping.questionId]));
}

function t(key, values = {}, fallback = key) {
  let text = chromeMessages[key] || fallback;
  for (const [name, value] of Object.entries(values)) text = text.replaceAll(`{${name}}`, String(value));
  return text;
}

function labelFor(group, value, fallback = humanize(value)) {
  return chromeLabels[group]?.[value] || fallback;
}

function translateText(value) {
  return chromeText[value] || value;
}

function translateIssue(entry) {
  return t(`validation.${entry.code}`, {}, translateText(entry.message));
}

function translateStaticTree(root) {
  if (!root || !Object.keys(chromeText).length) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return ["SCRIPT", "STYLE", "PRE", "CODE"].includes(node.parentElement?.tagName)
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    }
  });
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const source = node.nodeValue.trim();
    if (!source || !chromeText[source]) continue;
    const start = node.nodeValue.match(/^\s*/)?.[0] || "";
    const end = node.nodeValue.match(/\s*$/)?.[0] || "";
    node.nodeValue = `${start}${chromeText[source]}${end}`;
  }
  for (const element of root.querySelectorAll("[aria-label], [placeholder], [title]")) {
    for (const attribute of ["aria-label", "placeholder", "title"]) {
      const source = element.getAttribute(attribute);
      if (source && chromeText[source]) element.setAttribute(attribute, chromeText[source]);
    }
  }
}

function wireEvents() {
  elements.brandHomeButton.addEventListener("click", showHome);
  elements.templateList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-template-id]");
    if (!button) return;
    configureBundle(button.dataset.templateId);
    showSetup();
  });
  elements.cancelSetupButton.addEventListener("click", showHome);
  elements.cancelSetupInlineButton.addEventListener("click", showHome);
  elements.allProjectsButton.addEventListener("click", showHome);
  elements.topImportButton.addEventListener("click", chooseImportFile);
  elements.importButton.addEventListener("click", chooseImportFile);
  elements.importFileInput.addEventListener("change", async () => {
    const [file] = elements.importFileInput.files;
    elements.importFileInput.value = "";
    if (file) await handleImport(file);
  });
  for (const eventName of ["dragenter", "dragover"]) {
    elements.importButton.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.importButton.classList.add("drag-active");
    });
  }
  for (const eventName of ["dragleave", "drop"]) {
    elements.importButton.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.importButton.classList.remove("drag-active");
    });
  }
  elements.importButton.addEventListener("drop", async (event) => {
    const [file] = event.dataTransfer.files;
    if (file) await handleImport(file);
  });

  elements.differentPerspective.addEventListener("change", () => {
    const different = elements.differentPerspective.checked;
    elements.perspectiveFields.hidden = !different;
    elements.perspectiveLabel.required = different;
  });
  elements.recorderRole.addEventListener("change", () => replacePresetLabel(elements.recorderLabel, elements.recorderRole.value));
  elements.perspectiveRole.addEventListener("change", () => replacePresetLabel(elements.perspectiveLabel, elements.perspectiveRole.value));
  elements.projectForm.addEventListener("submit", createProjectFromForm);

  for (const tab of document.querySelectorAll("[data-workspace-view]")) {
    tab.addEventListener("click", () => switchWorkspaceView(tab.dataset.workspaceView));
  }
  elements.categoryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category-id]");
    if (!button) return;
    const first = visibleQuestions().find((question) => question.category === button.dataset.categoryId);
    if (first) openQuestion(first.questionId, true);
  });
  elements.previousQuestion.addEventListener("click", () => navigateQuestion(-1));
  elements.nextQuestion.addEventListener("click", () => navigateQuestion(1));
  elements.leaveUnresolvedButton.addEventListener("click", leaveQuestionUnresolved);
  elements.contributionSelect.addEventListener("change", selectContribution);
  elements.newContributionButton.addEventListener("click", startNewContribution);
  elements.removeContributionButton.addEventListener("click", removeActiveContribution);
  elements.answerNote.addEventListener("input", () => commitContribution());
  elements.perspectiveSelect.addEventListener("change", handleContextChange);
  elements.recorderSelect.addEventListener("change", handleContextChange);
  elements.speakingAsSelect.addEventListener("change", handleContextChange);
  elements.captureMethodSelect.addEventListener("change", handleContextChange);
  elements.authoritySelect.addEventListener("change", handleContextChange);
  elements.confirmationSelect.addEventListener("change", handleContextChange);
  elements.resolutionSelect.addEventListener("change", applyResolutionFromControls);
  elements.resolutionSourceSelect.addEventListener("change", applyResolutionFromControls);
  elements.resolutionDeciderSelect.addEventListener("change", applyResolutionFromControls);
  elements.addParticipantButton.addEventListener("click", () => elements.participantDialog.showModal());
  elements.cancelParticipantButton.addEventListener("click", () => elements.participantDialog.close());
  elements.participantForm.addEventListener("submit", addParticipant);

  for (const id of ["reviewSearch", "filterAxis", "filterStatus", "filterCategory", "filterEnforcement", "filterPriority", "filterPerspective", "filterRecorder", "filterCapture", "filterAuthority", "filterConfirmation"]) {
    elements[id].addEventListener(id === "reviewSearch" ? "input" : "change", renderReviewRows);
  }
  elements.reviewRows.addEventListener("click", (event) => {
    const button = event.target.closest("[data-edit-question]");
    if (button) openQuestion(button.dataset.editQuestion, true);
  });
  elements.confirmBaseButton.addEventListener("click", handleConfirmBase);

  elements.patchOperation.addEventListener("change", renderPatchOperationFields);
  elements.patchTargetItem.addEventListener("change", renderPatchExpectedValue);
  elements.patchForm.addEventListener("submit", createPatchFromForm);
  elements.patchList.addEventListener("click", handlePatchListAction);
  elements.patchExportSelect.addEventListener("change", renderExportPreview);
  elements.exportPreviewSelect.addEventListener("change", renderExportPreview);
  elements.exportBaseButton.addEventListener("click", exportBase);
  elements.exportPatchButton.addEventListener("click", exportPatch);
  elements.exportUnifiedButton.addEventListener("click", exportUnified);
  elements.exportMarkdownButton.addEventListener("click", exportMarkdown);
  elements.copyMarkdownButton.addEventListener("click", copyMarkdown);

  elements.deleteProjectButton.addEventListener("click", () => openDeleteDialog(state?.document.meta.documentId));
  elements.confirmDeleteButton.addEventListener("click", confirmDeleteProject);
  for (const trigger of document.querySelectorAll("[data-open-dialog]")) {
    trigger.addEventListener("click", () => document.getElementById(trigger.dataset.openDialog).showModal());
  }
}

function replacePresetLabel(input, role) {
  const knownLabels = new Set([
    ...Object.values(ROLE_LABELS),
    ...Object.keys(ROLE_LABELS).map((value) => labelFor("role", value, ROLE_LABELS[value]))
  ]);
  if (!input.value.trim() || knownLabels.has(input.value.trim())) {
    input.value = labelFor("role", role, ROLE_LABELS[role] || humanize(role));
  }
}

function showOnly(target) {
  for (const view of [elements.loadingView, elements.errorView, elements.homeView, elements.setupView, elements.workspaceView]) {
    view.hidden = view !== target;
  }
}

function showHome() {
  if (state) persistNow();
  showOnly(elements.homeView);
  renderTemplateList();
  renderProjectList();
  elements.templateList.querySelector("button")?.focus({ preventScroll: true });
}

function renderTemplateList() {
  elements.templateList.replaceChildren();
  for (const entry of bootData.registry) {
    const template = bootData.templates[entry.id];
    if (!template) continue;
    const templateLocale = template.locales?.[uiLocale] || template.locale;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "action-card action-card-primary";
    button.dataset.templateId = entry.id;
    const icon = document.createElement("span");
    icon.className = "action-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "＋";
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = templateLocale.template.name;
    const detail = document.createElement("small");
    detail.textContent = templateLocale.template.summary;
    copy.append(title, detail);
    button.append(icon, copy);
    elements.templateList.append(button);
  }
}

function showSetup() {
  showOnly(elements.setupView);
  elements.projectForm.reset();
  elements.contentLanguage.value = uiLocale;
  elements.recorderLabel.value = labelFor("role", "developer", "Developer");
  elements.perspectiveLabel.value = labelFor("role", "end_user", "End user");
  elements.perspectiveFields.hidden = true;
  elements.perspectiveLabel.required = false;
  elements.setupTemplateName.textContent = bundle.locale.template.name;
  elements.projectName.focus({ preventScroll: true });
}

function createProjectFromForm(event) {
  event.preventDefault();
  const input = {
    projectName: elements.projectName.value.trim(),
    phase: elements.projectPhase.value,
    contentLanguage: normalizeLanguageTag(elements.contentLanguage.value),
    recorderLabel: elements.recorderLabel.value.trim(),
    recorderRole: elements.recorderRole.value,
    recorderIsDecisionOwner: elements.recorderDecisionOwner.checked,
    perspectiveMode: elements.differentPerspective.checked ? "different" : "same_recorder",
    perspectiveLabel: elements.perspectiveLabel.value.trim(),
    perspectiveRole: elements.perspectiveRole.value
  };
  if (!input.projectName || !input.recorderLabel) return;
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/.test(input.contentLanguage)) {
    elements.contentLanguage.setCustomValidity(t("language.invalid", {}, "Use a language tag such as en, ja, es, or pt-br."));
    elements.contentLanguage.reportValidity();
    elements.contentLanguage.setCustomValidity("");
    return;
  }
  if (input.perspectiveMode === "different" && !input.perspectiveLabel) return;
  state = createProjectState(input, bundle);
  patches = [];
  currentQuestionIndex = 0;
  persistNow();
  showWorkspace();
  toast(t("project.created", {}, "Local project created. Nothing was sent to a server."));
}

function showWorkspace() {
  if (!state) return showHome();
  showOnly(elements.workspaceView);
  const requestedIndex = questions.findIndex((question) => question.questionId === state.currentQuestionId);
  currentQuestionIndex = requestedIndex >= 0 ? requestedIndex : 0;
  elements.workspaceProjectName.textContent = state.document.meta.projectName;
  elements.workspaceProjectMeta.textContent = t("project.meta", {
    template: state.document.meta.template.id,
    version: state.document.meta.template.version,
    language: state.document.meta.contentLanguage,
    revision: state.baseDocument?.meta.revision || state.document.meta.revision
  }, `${state.document.meta.template.id} ${state.document.meta.template.version} · ${state.document.meta.contentLanguage} · revision ${state.baseDocument?.meta.revision || state.document.meta.revision}`);
  renderAll();
  switchWorkspaceView(activeWorkspaceView, false);
}

function openWorkspace(documentId) {
  const workspace = store.loadWorkspace(documentId);
  if (!workspace?.state) {
    toast(t("project.openFailed", {}, "That local project could not be opened."));
    renderProjectList();
    return;
  }
  configureBundle(workspace.state.document.meta.template.id, uiLocale);
  state = workspace.state;
  if (state.baseDocument && state.baseConfirmationKnown === undefined) {
    state.baseConfirmationKnown = Boolean(state.baseDocument.meta.confirmedAt);
    state.baseConfirmedAt = state.baseDocument.meta.confirmedAt || null;
  }
  if (state.importedAt === undefined) state.importedAt = null;
  patches = workspace.patches;
  activeWorkspaceView = "questions";
  showWorkspace();
}

function renderProjectList() {
  const projects = store.listProjects();
  if (state && !projects.some((project) => project.documentId === state.document.meta.documentId)) {
    projects.unshift({
      documentId: state.document.meta.documentId,
      projectName: state.document.meta.projectName,
      templateId: state.document.meta.template.id,
      revision: state.baseDocument?.meta.revision || state.document.meta.revision,
      status: "session_only",
      updatedAt: state.document.meta.updatedAt,
      sessionOnly: true
    });
  }
  elements.projectList.replaceChildren();
  elements.projectEmptyState.hidden = projects.length > 0;
  const durableCount = projects.filter((project) => !project.sessionOnly).length;
  elements.storageState.textContent = store.available
    ? t("storage.count", { count: durableCount }, `${durableCount} saved locally`)
    : t("storage.sessionOnly", {}, "Session only — export recommended");
  elements.storageState.classList.toggle("error", !store.available);
  for (const project of projects) {
    const item = document.createElement("li");
    item.className = "project-row";
    const open = document.createElement("button");
    open.type = "button";
    open.className = "project-open";
    open.addEventListener("click", () => project.sessionOnly ? showWorkspace() : openWorkspace(project.documentId));
    const name = document.createElement("strong");
    name.textContent = project.projectName;
    const meta = document.createElement("span");
    meta.textContent = t("project.listMeta", {
      template: project.templateId,
      revision: project.revision,
      updated: formatDate(project.updatedAt)
    }, `${project.templateId} · revision ${project.revision} · updated ${formatDate(project.updatedAt)}`);
    open.append(name, meta);
    const actions = document.createElement("div");
    actions.className = "projectbar-actions";
    const status = document.createElement("span");
    status.className = "project-state-tag";
    status.textContent = labelFor("projectStatus", project.status);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button danger-text";
    remove.textContent = translateText("Delete");
    remove.addEventListener("click", () => openDeleteDialog(project.documentId, project.projectName));
    actions.append(status, remove);
    item.append(open, actions);
    elements.projectList.append(item);
  }
}

function renderAll() {
  renderCategoryList();
  renderQuestion();
  renderSummary();
  renderReview();
  renderOverrides();
  renderExport();
}

function switchWorkspaceView(view, focus = true) {
  if (!state) return;
  if (activeWorkspaceView === "questions" && view !== "questions") commitContribution();
  activeWorkspaceView = view;
  const views = { questions: elements.questionsView, review: elements.reviewView, overrides: elements.overridesView, export: elements.exportView };
  for (const [name, panel] of Object.entries(views)) panel.hidden = name !== view;
  elements.categoryPanel.hidden = view !== "questions";
  elements.workspaceGrid.dataset.activeView = view;
  for (const tab of document.querySelectorAll("[data-workspace-view]")) {
    const active = tab.dataset.workspaceView === view;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-current", active ? "page" : "false");
  }
  if (view === "review") renderReview();
  if (view === "overrides") renderOverrides();
  if (view === "export") renderExport();
  renderSummary();
  if (focus) views[view].querySelector("h1")?.focus?.({ preventScroll: false });
}

function answerValueForVisibility(questionId) {
  const response = state.responses[questionId];
  if (!response) return null;
  const source = response.contributions[response.resolution.sourceContributionId];
  if (source && hasValue(source.value)) return source.value;
  const latest = Object.values(response.contributions).filter((entry) => hasValue(entry.value)).at(-1);
  return latest?.value ?? null;
}

function isQuestionVisible(question) {
  const rules = bundle.rules.rules.filter((rule) => rule.type === "visibility" && rule.targetQuestionIds?.includes(question.questionId));
  if (!rules.length) return true;
  return rules.some((rule) => {
    const condition = rule.showWhen;
    const value = answerValueForVisibility(condition.questionId);
    if (condition.operator === "contains_any") return Array.isArray(value) && condition.values.some((entry) => value.includes(entry));
    if (condition.operator === "contains") return Array.isArray(value) && value.includes(condition.value);
    return rule.defaultVisible;
  });
}

function visibleQuestions() {
  return questions.filter(isQuestionVisible);
}

function responseFor(questionId) {
  if (!state.responses[questionId]) state.responses[questionId] = createBlankResponse();
  return state.responses[questionId];
}

function currentQuestion() {
  return questions[currentQuestionIndex];
}

function activeContribution(response = responseFor(currentQuestion().questionId)) {
  return response.activeContributionId ? response.contributions[response.activeContributionId] : null;
}

function renderCategoryList() {
  const visible = visibleQuestions();
  const activeCategory = currentQuestion().category;
  const answeredCount = visible.filter((question) => questionHasProgress(question.questionId)).length;
  const percent = visible.length ? Math.round((answeredCount / visible.length) * 100) : 0;
  elements.overallProgress.textContent = `${percent}%`;
  elements.overallProgress.style.setProperty("--progress", `${percent}%`);
  elements.categoryList.replaceChildren();
  for (const [index, category] of bundle.locale.categories.entries()) {
    const categoryQuestions = visible.filter((question) => question.category === category.id);
    const completed = categoryQuestions.filter((question) => questionHasProgress(question.questionId)).length;
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-button${category.id === activeCategory ? " active" : ""}`;
    button.dataset.categoryId = category.id;
    button.setAttribute("aria-current", category.id === activeCategory ? "step" : "false");
    const number = document.createElement("span");
    number.className = "category-number";
    number.textContent = String(index + 1).padStart(2, "0");
    const label = document.createElement("span");
    label.className = "category-label";
    label.textContent = category.label;
    const progress = document.createElement("span");
    progress.className = "category-state";
    progress.textContent = `${completed}/${categoryQuestions.length}`;
    button.append(number, label, progress);
    item.append(button);
    elements.categoryList.append(item);
  }
}

function questionHasProgress(questionId) {
  const response = state.responses[questionId];
  if (!response) return false;
  return Object.values(response.contributions).some((entry) => hasValue(entry.value)) || response.resolution.status !== "unspecified";
}

function openQuestion(questionId, focus = false) {
  commitContribution();
  const index = questions.findIndex((question) => question.questionId === questionId);
  if (index < 0) return;
  currentQuestionIndex = index;
  state.currentQuestionId = questionId;
  const response = responseFor(questionId);
  const contribution = activeContribution(response);
  if (contribution) state.context = clone(contribution.context);
  activeWorkspaceView = "questions";
  switchWorkspaceView("questions", false);
  renderCategoryList();
  renderQuestion({ focus });
  scheduleSave();
}

function renderQuestion({ focus = false } = {}) {
  const question = currentQuestion();
  const visible = visibleQuestions();
  const visibleIndex = visible.findIndex((candidate) => candidate.questionId === question.questionId);
  if (visibleIndex < 0 && visible.length) {
    currentQuestionIndex = questions.findIndex((candidate) => candidate.questionId === visible[0].questionId);
    return renderQuestion({ focus });
  }
  const category = categoryById.get(question.category);
  const response = responseFor(question.questionId);
  const contribution = activeContribution(response);
  if (contribution) state.context = clone(contribution.context);
  state.currentQuestionId = question.questionId;
  elements.questionCategory.textContent = category.label;
  elements.questionProgress.textContent = t("question.progress", {
    current: visibleIndex + 1,
    total: visible.length,
    id: question.questionId
  }, `Question ${visibleIndex + 1} of ${visible.length} · ${question.questionId}`);
  elements.progressBar.style.width = `${((visibleIndex + 1) / visible.length) * 100}%`;
  elements.questionHelp.textContent = question.help;
  elements.questionPrompt.textContent = question.prompt;
  elements.answerNote.value = contribution?.note || "";
  renderContributionSelect(response);
  renderContextControls();
  renderAnswerControl(question, contribution?.value ?? null);
  renderResolutionControls(response);
  elements.previousQuestion.disabled = visibleIndex === 0;
  elements.nextQuestion.textContent = visibleIndex === visible.length - 1
    ? (chromeStrings["question.review"] || "Review premise")
    : (chromeStrings["question.next"] || "Next question");
  elements.validationMessage.textContent = "";
  elements.validationMessage.classList.remove("success");
  elements.answerControl.removeAttribute("aria-invalid");
  if (focus) elements.questionPrompt.focus({ preventScroll: false });
}

function renderContributionSelect(response) {
  const previous = response.activeContributionId || "__new__";
  elements.contributionSelect.replaceChildren();
  const draft = document.createElement("option");
  draft.value = "__new__";
  draft.textContent = Object.keys(response.contributions).length
    ? t("contribution.new", {}, "New contribution")
    : t("contribution.newEmpty", {}, "New contribution — not yet answered");
  elements.contributionSelect.append(draft);
  for (const [id, contribution] of Object.entries(response.contributions)) {
    const option = document.createElement("option");
    option.value = id;
    const perspective = state.document.participants[contribution.context.perspectiveRef]?.label || t("source.unknown", {}, "Unknown source");
    option.textContent = `${perspective} · ${labelFor("capture", contribution.context.captureMethod)}${hasValue(contribution.value) ? "" : ` · ${labelFor("projectStatus", "draft", "draft")}`}`;
    elements.contributionSelect.append(option);
  }
  elements.contributionSelect.value = previous;
  elements.removeContributionButton.hidden = !response.activeContributionId;
}

function renderContextControls() {
  const entries = Object.entries(state.document.participants);
  fillSelect(elements.perspectiveSelect, entries.map(([value, participant]) => ({ value, label: participant.label })), state.context.perspectiveRef);
  fillSelect(elements.recorderSelect, entries.map(([value, participant]) => ({ value, label: participant.label })), state.context.recordedByRef);
  const perspective = state.document.participants[state.context.perspectiveRef] || entries[0]?.[1];
  if (!perspective) return;
  if (!perspective.roles.includes(state.context.speakingAs)) state.context.speakingAs = perspective.roles[0];
  fillSelect(elements.speakingAsSelect, perspective.roles.map((role) => ({
    value: role,
    label: labelFor("role", role, ROLE_LABELS[role] || humanize(role))
  })), state.context.speakingAs);
  elements.captureMethodSelect.value = state.context.captureMethod;
  elements.authoritySelect.value = state.context.authority;
  if (state.context.captureMethod === "inference") {
    state.context.confirmation = "unconfirmed";
    elements.confirmationSelect.value = "unconfirmed";
    elements.confirmationSelect.disabled = true;
  } else {
    elements.confirmationSelect.disabled = false;
    elements.confirmationSelect.value = state.context.confirmation;
  }
  const recorder = state.document.participants[state.context.recordedByRef];
  elements.contextSummary.textContent = t("context.summary", {
    perspective: perspective.label,
    recorder: recorder?.label || translateText("Unknown")
  }, `${perspective.label} · recorded by ${recorder?.label || "Unknown"}`);
}

function renderAnswerControl(question, value) {
  elements.answerControl.replaceChildren();
  elements.answerControl.setAttribute("aria-labelledby", "questionPrompt");
  elements.answerControl.setAttribute("aria-describedby", "validationMessage");
  if (question.responseType === "single-choice" || question.responseType === "multi-choice") {
    elements.answerControl.setAttribute("role", question.responseType === "single-choice" ? "radiogroup" : "group");
    const selected = new Set(Array.isArray(value) ? value : (hasValue(value) ? [value] : []));
    for (const choice of question.choices) {
      const label = document.createElement("label");
      label.className = "choice-label";
      const input = document.createElement("input");
      input.type = question.responseType === "single-choice" ? "radio" : "checkbox";
      input.name = "currentAnswer";
      input.value = choice.value;
      input.checked = selected.has(choice.value);
      input.addEventListener("change", () => handleChoiceChange(question, input, choice));
      const copy = document.createElement("span");
      copy.className = "choice-copy";
      const text = document.createElement("strong");
      text.textContent = choice.label;
      copy.append(text);
      if (choice.requiresNote) {
        const detail = document.createElement("small");
        detail.textContent = t("choice.addContext", {}, "Add context below");
        copy.append(detail);
      }
      label.append(input, copy);
      elements.answerControl.append(label);
    }
    return;
  }
  elements.answerControl.removeAttribute("role");
  const textarea = document.createElement("textarea");
  textarea.className = "text-answer";
  textarea.rows = question.responseType === "short-text" ? 3 : 6;
  textarea.maxLength = 8000;
  textarea.placeholder = question.placeholder || t("answer.placeholder", {}, "Add a concise answer.");
  textarea.value = typeof value === "string" ? value : "";
  textarea.setAttribute("aria-label", question.prompt);
  textarea.addEventListener("input", () => commitContribution());
  elements.answerControl.append(textarea);
}

function handleChoiceChange(question, changedInput, choice) {
  if (question.responseType === "multi-choice") {
    const inputs = [...elements.answerControl.querySelectorAll('input[name="currentAnswer"]')];
    if (choice.exclusive && changedInput.checked) {
      for (const input of inputs) if (input !== changedInput) input.checked = false;
    } else if (changedInput.checked) {
      for (const input of inputs) {
        const candidate = question.choices.find((entry) => entry.value === input.value);
        if (candidate?.exclusive) input.checked = false;
      }
    }
    const checked = inputs.filter((input) => input.checked);
    if (question.maxSelections && checked.length > question.maxSelections) {
      changedInput.checked = false;
      showValidation(t("answer.selectionLimit", { count: question.maxSelections }, `Choose no more than ${question.maxSelections} options.`));
      return;
    }
  }
  commitContribution({ announce: true });
}

function readAnswerValue(question) {
  if (question.responseType === "single-choice") return elements.answerControl.querySelector('input[name="currentAnswer"]:checked')?.value ?? null;
  if (question.responseType === "multi-choice") return [...elements.answerControl.querySelectorAll('input[name="currentAnswer"]:checked')].map((input) => input.value);
  const value = elements.answerControl.querySelector("textarea")?.value.trim() ?? "";
  return value || null;
}

function commitContribution({ announce = false } = {}) {
  if (!state || activeWorkspaceView !== "questions") return { valid: true, errors: [] };
  const question = currentQuestion();
  const response = responseFor(question.questionId);
  const value = readAnswerValue(question);
  const note = elements.answerNote.value.trim();
  const result = validateAnswer(question, value, note);
  let contributionId = response.activeContributionId;
  if (!contributionId && (hasValue(value) || note)) {
    contributionId = createId("pbc");
    response.activeContributionId = contributionId;
  }
  if (contributionId) {
    const previous = response.contributions[contributionId];
    const now = new Date().toISOString();
    response.contributions[contributionId] = {
      value: clone(value),
      note,
      context: clone(state.context),
      recordedAt: previous?.recordedAt || now,
      updatedAt: now
    };
    if (response.resolution.status === "confirmed" && response.resolution.sourceContributionId === contributionId && !valuesEqual(previous?.value, value)) {
      response.resolution.status = "provisional";
      response.resolution.decidedAt = now;
      if (announce) showValidation(t("answer.acceptedChanged", {}, "The accepted value changed, so the resolution returned to provisional."));
    }
    markAndRebuild();
    renderContributionSelect(response);
    renderResolutionControls(response);
    renderCategoryList();
    renderSummary();
  } else {
    scheduleSave();
  }
  if (!result.valid) showValidation(translateIssue(result.errors[0]));
  else if (announce) showValidation(t("answer.saved", {}, "Contribution saved locally. Its project resolution remains separate."), true);
  return result;
}

function selectContribution() {
  const response = responseFor(currentQuestion().questionId);
  const selected = elements.contributionSelect.value;
  response.activeContributionId = selected === "__new__" ? null : selected;
  const contribution = activeContribution(response);
  if (contribution) state.context = clone(contribution.context);
  renderQuestion();
  scheduleSave();
}

function startNewContribution() {
  const response = responseFor(currentQuestion().questionId);
  response.activeContributionId = null;
  renderQuestion();
  elements.perspectiveSelect.focus();
}

function removeActiveContribution() {
  const response = responseFor(currentQuestion().questionId);
  const id = response.activeContributionId;
  if (!id) return;
  if (!globalThis.confirm(t("contribution.removeConfirm", {}, "Remove this contribution from the local project?"))) return;
  delete response.contributions[id];
  if (response.resolution.sourceContributionId === id) {
    response.resolution = createBlankResponse().resolution;
  }
  response.activeContributionId = Object.keys(response.contributions)[0] || null;
  const next = activeContribution(response);
  if (next) state.context = clone(next.context);
  markAndRebuild();
  renderQuestion();
  renderAllSecondary();
  toast(t("contribution.removed", {}, "Contribution removed from this local project."));
}

function handleContextChange() {
  const perspective = state.document.participants[elements.perspectiveSelect.value];
  const perspectiveChanged = state.context.perspectiveRef !== elements.perspectiveSelect.value;
  state.context.perspectiveRef = elements.perspectiveSelect.value;
  state.context.recordedByRef = elements.recorderSelect.value;
  if (!perspective.roles.includes(elements.speakingAsSelect.value)) state.context.speakingAs = perspective.roles[0];
  else state.context.speakingAs = elements.speakingAsSelect.value;
  state.context.captureMethod = elements.captureMethodSelect.value;
  state.context.authority = perspectiveChanged ? defaultAuthorityForRole(state.context.speakingAs) : elements.authoritySelect.value;
  state.context.confirmation = state.context.captureMethod === "inference" ? "unconfirmed" : elements.confirmationSelect.value;
  const response = responseFor(currentQuestion().questionId);
  const contribution = activeContribution(response);
  if (contribution) {
    contribution.context = clone(state.context);
    contribution.updatedAt = new Date().toISOString();
    markAndRebuild();
  } else scheduleSave();
  renderContextControls();
  renderContributionSelect(response);
  renderResolutionControls(response);
  renderSummary();
}

function renderResolutionControls(response) {
  const deciders = eligibleDeciders(currentQuestion().questionId, state, bundle);
  elements.resolutionSelect.replaceChildren();
  for (const resolution of bundle.locale.resolutionStates) {
    const option = document.createElement("option");
    option.value = resolution.value;
    option.textContent = resolution.label;
    option.disabled = AUTHORIZED_STATUSES.has(resolution.value) && !deciders.length;
    elements.resolutionSelect.append(option);
  }
  elements.resolutionSelect.value = [...elements.resolutionSelect.options].some((option) => option.value === response.resolution.status && !option.disabled)
    ? response.resolution.status
    : "unspecified";

  const sources = Object.entries(response.contributions).filter(([, contribution]) => hasValue(contribution.value));
  const sourceOptions = [{ value: "", label: t("resolution.noValue", {}, "No resolved value") }, ...sources.map(([id, contribution]) => ({
    value: id,
    label: `${state.document.participants[contribution.context.perspectiveRef]?.label || translateText("Unknown")} · ${shortValue(contribution.value)}`
  }))];
  fillSelect(elements.resolutionSourceSelect, sourceOptions, response.resolution.sourceContributionId || "");
  const usesSource = ["confirmed", "provisional"].includes(elements.resolutionSelect.value);
  elements.resolutionSourceSelect.disabled = !usesSource;

  const deciderOptions = [{ value: "", label: t("resolution.noDecider", {}, "No decider recorded") }, ...deciders.map((id) => ({ value: id, label: state.document.participants[id].label }))];
  fillSelect(elements.resolutionDeciderSelect, deciderOptions, response.resolution.decidedByRefs[0] || "");
  elements.resolutionDeciderSelect.disabled = !RESOLVED_STATUSES.has(elements.resolutionSelect.value);
  updateResolutionHint(deciders);
}

function applyResolutionFromControls() {
  const requestedStatus = elements.resolutionSelect.value;
  const requestedSourceId = elements.resolutionSourceSelect.value || null;
  const requestedDeciderId = elements.resolutionDeciderSelect.value || null;
  const contributionResult = commitContribution();
  if (!contributionResult.valid) return;
  const question = currentQuestion();
  const response = responseFor(question.questionId);
  let sourceId = requestedSourceId;
  const deciderId = requestedDeciderId;
  if (["confirmed", "provisional"].includes(requestedStatus) && !sourceId) {
    const active = activeContribution(response);
    if (active && hasValue(active.value)) sourceId = response.activeContributionId;
    else {
      showValidation(t("resolution.chooseContribution", {}, "Choose a contribution before using an answer as the project premise."));
      renderResolutionControls(response);
      return;
    }
  }
  if (AUTHORIZED_STATUSES.has(requestedStatus) && !deciderId) {
    showValidation(t("resolution.chooseDecider", {}, "Choose an authorized participant to confirm this resolution."));
    renderResolutionControls(response);
    return;
  }
  const usesSource = ["confirmed", "provisional"].includes(requestedStatus);
  response.resolution = {
    status: requestedStatus,
    sourceContributionId: usesSource ? sourceId : null,
    decidedByRefs: deciderId ? [deciderId] : [],
    decidedAt: RESOLVED_STATUSES.has(requestedStatus) ? new Date().toISOString() : null,
    note: response.resolution.note || ""
  };
  markAndRebuild();
  renderResolutionControls(response);
  renderCategoryList();
  renderAllSecondary();
  showValidation(t("resolution.saved", {}, "Project resolution saved separately from the source contribution."), true);
}

function updateResolutionHint(deciders) {
  const selected = bundle.locale.resolutionStates.find((entry) => entry.value === elements.resolutionSelect.value);
  const accepted = acceptedAuthoritiesForQuestion(currentQuestion().questionId, bundle)
    .map((value) => labelFor("authority", value, AUTHORITY_LABELS[value] || humanize(value)));
  const authorityList = typeof Intl.ListFormat === "function"
    ? new Intl.ListFormat(uiLocale || "en", { style: "long", type: "disjunction" }).format(accepted)
    : accepted.join(", ");
  if (!deciders.length) elements.resolutionHint.textContent = t("resolution.noQualifiedDecider", {
    authorities: authorityList
  }, `No qualifying decider is recorded yet. Accepted authority: ${authorityList}.`);
  else elements.resolutionHint.textContent = selected?.description || t("resolution.chooseUse", {}, "Choose how this input should be used.");
}

function leaveQuestionUnresolved() {
  const result = commitContribution();
  if (!result.valid) return;
  const response = responseFor(currentQuestion().questionId);
  response.resolution = { status: "unspecified", sourceContributionId: null, decidedByRefs: [], decidedAt: null, note: "" };
  markAndRebuild();
  showValidation(t("resolution.leftOpen", {}, "Left unresolved. An AI should not assume a value."), true);
  navigateQuestion(1, false);
}

function navigateQuestion(direction, validateCurrent = true) {
  if (validateCurrent) {
    const result = commitContribution();
    if (!result.valid && direction > 0) return;
  }
  const visible = visibleQuestions();
  const visibleIndex = visible.findIndex((question) => question.questionId === currentQuestion().questionId);
  const nextIndex = Math.min(visible.length - 1, Math.max(0, visibleIndex + direction));
  if (nextIndex === visibleIndex && direction > 0) {
    switchWorkspaceView("review");
    return;
  }
  openQuestion(visible[nextIndex].questionId, true);
}

function addParticipant(event) {
  event.preventDefault();
  const label = elements.participantLabel.value.trim();
  const role = elements.participantRole.value;
  if (!label) return;
  const id = createId("participant");
  state.document.participants[id] = {
    kind: participantKindForRole(role),
    label,
    labelLanguage: bundle.locale.locale,
    roles: [role]
  };
  state.context.perspectiveRef = id;
  state.context.speakingAs = role;
  state.context.authority = defaultAuthorityForRole(role);
  state.context.captureMethod = role === "end_user" ? "interview" : "direct_input";
  state.context.confirmation = "directly_reported";
  markAndRebuild();
  elements.participantForm.reset();
  elements.participantDialog.close();
  renderQuestion();
  renderAllSecondary();
  toast(t("participant.added", { label }, `${label} was added to this local project.`));
}

function renderAllSecondary() {
  renderSummary();
  renderReview();
  renderOverrides();
  renderExport();
}

function renderSummary() {
  if (!state) return;
  const counts = { confirmed: 0, provisional: 0, proposal: 0, unresolved: 0 };
  const axes = { fact: 0, view: 0, care: 0, unknown: 0 };
  for (const item of Object.values(state.document.items)) {
    if (item.resolution.status === "confirmed") counts.confirmed += 1;
    else if (item.resolution.status === "provisional") counts.provisional += 1;
    else if (item.resolution.status === "proposal_requested") counts.proposal += 1;
    else counts.unresolved += 1;
    axes[item.axis] = (axes[item.axis] || 0) + 1;
  }
  elements.statusCounts.replaceChildren();
  for (const [label, value] of Object.entries(counts)) {
    const chip = document.createElement("div");
    chip.className = "count-chip";
    const number = document.createElement("strong");
    number.textContent = String(value);
    const caption = document.createElement("span");
    caption.textContent = labelFor("status", label === "proposal" ? "proposal_requested" : label, humanize(label));
    chip.append(number, caption);
    elements.statusCounts.append(chip);
  }
  const total = Object.values(axes).reduce((sum, value) => sum + value, 0) || 1;
  elements.axisCounts.replaceChildren();
  for (const [axis, value] of Object.entries(axes)) {
    const row = document.createElement("div");
    row.className = "axis-row";
    const label = document.createElement("span");
    label.textContent = labelFor("axis", axis);
    const bar = document.createElement("span");
    bar.className = "axis-bar";
    const fill = document.createElement("i");
    fill.style.width = `${(value / total) * 100}%`;
    bar.append(fill);
    const count = document.createElement("b");
    count.textContent = String(value);
    row.append(label, bar, count);
    elements.axisCounts.append(row);
  }
  const openConflicts = state.document.conflicts.filter((entry) => entry.status === "open").length;
  elements.documentStatus.className = "document-status";
  if (openConflicts) {
    elements.documentStatus.textContent = t("status.conflicts", { count: openConflicts }, `${openConflicts} conflict${openConflicts === 1 ? "" : "s"}`);
    elements.documentStatus.classList.add("conflict");
  } else if (!state.baseDocument) {
    elements.documentStatus.textContent = t("status.draft", {}, "Draft");
    elements.documentStatus.classList.add("draft");
  } else if (state.dirtySinceBase) {
    elements.documentStatus.textContent = t("status.pending", {}, "Changes pending");
    elements.documentStatus.classList.add("draft");
  } else elements.documentStatus.textContent = t("status.base", { revision: state.baseDocument.meta.revision }, `Base r${state.baseDocument.meta.revision}`);
  const next = visibleQuestions().find((question) => !questionHasProgress(question.questionId));
  elements.summaryNext.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = next
    ? t("summary.next", {}, "Next unresolved question")
    : t("summary.complete", {}, "Questionnaire pass complete");
  const detail = document.createElement("span");
  if (next) detail.textContent = next.prompt;
  else if (!state.baseDocument) detail.textContent = t("summary.reviewBeforeBase", {}, "Review the premise before confirming a Base.");
  else if (state.dirtySinceBase) detail.textContent = t("summary.reviewChanges", {}, "Review changes before confirming the next Base revision.");
  else detail.textContent = t("summary.baseReady", { revision: state.baseDocument.meta.revision }, `Base r${state.baseDocument.meta.revision} is confirmed. You can export it or create an Override.`);
  elements.summaryNext.append(strong, detail);
  elements.jsonPreview.textContent = JSON.stringify(state.document, null, 2);
}

function setupReviewFilters() {
  const participants = Object.entries(state.document.participants).map(([value, participant]) => ({ value, label: participant.label }));
  fillFilter(elements.filterAxis, ["fact", "view", "care", "unknown"].map((value) => ({ value, label: labelFor("axis", value) })));
  fillFilter(elements.filterStatus, bundle.locale.resolutionStates.map(({ value, label }) => ({ value, label })).concat({ value: "conflict", label: labelFor("status", "conflict") }));
  fillFilter(elements.filterCategory, bundle.locale.categories.map((category) => ({ value: category.id, label: category.label })));
  fillFilter(elements.filterEnforcement, ["hard", "soft", "advisory"].map((value) => ({ value, label: labelFor("enforcement", value) })));
  fillFilter(elements.filterPriority, ["must", "should", "could"].map((value) => ({ value, label: labelFor("priority", value) })));
  fillFilter(elements.filterPerspective, participants);
  fillFilter(elements.filterRecorder, participants);
  fillFilter(elements.filterCapture, ["direct_input", "interview", "observation", "inference", "document_import", "data_import", "other"].map((value) => ({ value, label: labelFor("capture", value) })));
  fillFilter(elements.filterAuthority, Object.entries(AUTHORITY_LABELS).map(([value, label]) => ({ value, label: labelFor("authority", value, label) })));
  fillFilter(elements.filterConfirmation, ["directly_reported", "source_confirmed", "unconfirmed", "disputed", "imported_unverified"].map((value) => ({ value, label: labelFor("confirmation", value) })));
}

function renderReview() {
  if (!state) return;
  setupReviewFilters();
  const unresolved = Object.entries(state.document.items).filter(([, item]) => ["unspecified", "proposal_requested", "conflict"].includes(item.resolution.status));
  const warningMessages = activeReviewWarnings();
  renderAttentionList(elements.unresolvedList, [...warningMessages, ...unresolved.slice(0, 8).map(([id, item]) => `${item.label} — ${labelFor("status", item.resolution.status)} (${id})`)], t("review.noUnresolved", {}, "No unresolved premises or deterministic warnings."));
  renderAttentionList(elements.conflictList, state.document.conflicts.filter((entry) => entry.status === "open").map((entry) => translateText(entry.message)), t("review.noConflict", {}, "No deterministic conflict detected."), true);
  elements.baseWarning.classList.add("notice-warn");
  elements.baseWarning.hidden = false;
  if (!state.baseDocument) elements.baseWarning.textContent = t("review.noBase", {}, "No Base has been confirmed yet. You may confirm a revision while unknowns remain visible.");
  else if (state.dirtySinceBase) elements.baseWarning.textContent = t("review.changed", {
    revision: state.baseDocument.meta.revision,
    next: state.baseDocument.meta.revision + 1
  }, `The questionnaire has changes after Base revision ${state.baseDocument.meta.revision}. Confirming creates revision ${state.baseDocument.meta.revision + 1}.`);
  else {
    elements.baseWarning.textContent = state.baseConfirmationKnown
      ? t("review.confirmed", { revision: state.baseDocument.meta.revision, time: formatDate(state.baseConfirmedAt) }, `Base revision ${state.baseDocument.meta.revision} was confirmed ${formatDate(state.baseConfirmedAt)}.`)
      : t("review.legacyImported", { revision: state.baseDocument.meta.revision, time: formatDate(state.importedAt) }, `Base revision ${state.baseDocument.meta.revision} was imported from a legacy document. Its original confirmation time was not recorded. Imported ${formatDate(state.importedAt)}.`);
    elements.baseWarning.classList.remove("notice-warn");
  }
  const nextRevision = state.baseDocument ? state.baseDocument.meta.revision + 1 : 1;
  elements.confirmBaseButton.disabled = Boolean(state.baseDocument && !state.dirtySinceBase);
  elements.confirmBaseButton.textContent = !state.baseDocument
    ? (chromeStrings["review.confirmBase"] || "Confirm Base revision")
    : state.dirtySinceBase
      ? t("base.confirmNextButton", { revision: nextRevision }, `Confirm as Base r${nextRevision}`)
      : t("base.confirmedButton", { revision: state.baseDocument.meta.revision }, `Base r${state.baseDocument.meta.revision} confirmed`);
  renderReviewRows();
}

function activeReviewWarnings() {
  return bundle.rules.rules
    .filter((rule) => rule.type === "review-warning" && evaluateCondition(rule.when))
    .map((rule) => bundle.locale.messages[rule.messageKey] || rule.messageKey);
}

function evaluateCondition(condition) {
  if (condition.all) return condition.all.every(evaluateCondition);
  const value = answerValueForVisibility(condition.questionId);
  if (condition.operator === "contains") return Array.isArray(value) && value.includes(condition.value);
  if (condition.operator === "not_contains") return !Array.isArray(value) || !value.includes(condition.value);
  if (condition.operator === "contains_any") return Array.isArray(value) && condition.values.some((entry) => value.includes(entry));
  if (condition.operator === "in") return condition.values.includes(value);
  if (condition.operator === "equals") return valuesEqual(value, condition.value);
  return false;
}

function renderAttentionList(container, messages, emptyMessage, error = false) {
  container.replaceChildren();
  const values = messages.length ? messages : [emptyMessage];
  for (const message of values) {
    const item = document.createElement("div");
    item.className = `attention-item${!messages.length ? " empty" : ""}${error && messages.length ? " error" : ""}`;
    item.textContent = message;
    container.append(item);
  }
}

function renderReviewRows() {
  if (!state) return;
  const filters = {
    search: elements.reviewSearch.value.trim().toLowerCase(), axis: elements.filterAxis.value, status: elements.filterStatus.value,
    category: elements.filterCategory.value, enforcement: elements.filterEnforcement.value, priority: elements.filterPriority.value, perspective: elements.filterPerspective.value,
    recorder: elements.filterRecorder.value, capture: elements.filterCapture.value, authority: elements.filterAuthority.value,
    confirmation: elements.filterConfirmation.value
  };
  const rows = Object.entries(state.document.items).filter(([id, item]) => {
    const contributions = Object.values(item.contributions);
    const haystack = `${id} ${item.label} ${item.rationale || ""} ${JSON.stringify(item.resolution.value)}`.toLowerCase();
    return (!filters.search || haystack.includes(filters.search)) &&
      (!filters.axis || item.axis === filters.axis) && (!filters.status || item.resolution.status === filters.status) &&
      (!filters.category || item.category === filters.category) && (!filters.enforcement || item.enforcement === filters.enforcement) &&
      (!filters.priority || item.priority === filters.priority) &&
      (!filters.perspective || contributions.some((entry) => entry.perspectiveRef === filters.perspective)) &&
      (!filters.recorder || contributions.some((entry) => entry.recordedByRef === filters.recorder)) &&
      (!filters.capture || contributions.some((entry) => entry.captureMethod === filters.capture)) &&
      (!filters.authority || contributions.some((entry) => entry.authority === filters.authority)) &&
      (!filters.confirmation || contributions.some((entry) => entry.confirmation === filters.confirmation));
  });
  elements.reviewRows.replaceChildren();
  if (!rows.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "no-results";
    cell.textContent = t("review.noResults", {}, "No premise items match these filters.");
    row.append(cell);
    elements.reviewRows.append(row);
    return;
  }
  for (const [itemId, item] of rows) {
    const row = document.createElement("tr");
    const titleCell = document.createElement("td");
    titleCell.dataset.label = translateText("Premise");
    const title = document.createElement("div");
    title.className = "item-title";
    const strong = document.createElement("strong");
    strong.textContent = item.label;
    const code = document.createElement("code");
    code.textContent = itemId;
    title.append(strong, code);
    if (item.rationale) {
      const note = document.createElement("span");
      note.className = "item-note";
      note.textContent = item.rationale;
      title.append(note);
    }
    titleCell.append(title);
    const axisCell = tagCell(translateText("Axis"), labelFor("axis", item.axis), `tag-${item.axis}`);
    const statusCell = tagCell(translateText("Status"), labelFor("status", item.resolution.status), item.resolution.status === "conflict" ? "tag-conflict" : "");
    const sourceCell = document.createElement("td");
    sourceCell.dataset.label = translateText("Source");
    sourceCell.className = "source-cell";
    const contributions = Object.values(item.contributions);
    if (!contributions.length) sourceCell.textContent = t("review.noContribution", {}, "No contribution");
    else {
      for (const contribution of contributions.slice(0, 2)) {
        const line = document.createElement("span");
        line.textContent = `${state.document.participants[contribution.perspectiveRef]?.label || translateText("Unknown")} → ${state.document.participants[contribution.recordedByRef]?.label || translateText("Unknown")}`;
        const detail = document.createElement("small");
        detail.textContent = `${labelFor("capture", contribution.captureMethod)} · ${labelFor("confirmation", contribution.confirmation)}`;
        sourceCell.append(line, detail);
      }
      if (contributions.length > 2) {
        const more = document.createElement("small");
        more.textContent = t("review.more", { count: contributions.length - 2 }, `+${contributions.length - 2} more`);
        sourceCell.append(more);
      }
    }
    const valueCell = document.createElement("td");
    valueCell.dataset.label = translateText("Resolution");
    valueCell.textContent = shortValue(item.resolution.value, 110);
    const editCell = document.createElement("td");
    editCell.dataset.label = translateText("Action");
    const questionId = questionByItem.get(itemId);
    if (questionId) {
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "button button-secondary review-edit";
      edit.dataset.editQuestion = questionId;
      edit.textContent = t("review.edit", {}, "Edit");
      editCell.append(edit);
    }
    row.append(titleCell, axisCell, statusCell, sourceCell, valueCell, editCell);
    elements.reviewRows.append(row);
  }
}

function tagCell(label, value, extraClass = "") {
  const cell = document.createElement("td");
  cell.dataset.label = label;
  const span = document.createElement("span");
  span.className = `tag ${extraClass}`.trim();
  span.textContent = value;
  cell.append(span);
  return cell;
}

function handleConfirmBase() {
  if (state.baseDocument && !state.dirtySinceBase) return;
  const nextRevision = state.baseDocument ? state.baseDocument.meta.revision + 1 : 1;
  const prompt = state.baseDocument
    ? t("base.confirmNext", { revision: nextRevision }, `Confirm the current changes as Base revision ${nextRevision}? The existing Base will be replaced.`)
    : t("base.confirmFirst", { revision: nextRevision }, `Confirm Base revision ${nextRevision}? It becomes the baseline for exports and Overrides.`);
  if (!globalThis.confirm(prompt)) return;
  confirmBase(state, bundle);
  persistNow();
  renderAllSecondary();
  elements.workspaceProjectMeta.textContent = t("project.meta", {
    template: state.document.meta.template.id,
    version: state.document.meta.template.version,
    language: state.document.meta.contentLanguage,
    revision: state.baseDocument.meta.revision
  }, `${state.document.meta.template.id} ${state.document.meta.template.version} · ${state.document.meta.contentLanguage} · revision ${state.baseDocument.meta.revision}`);
  toast(t("base.confirmedToast", { revision: state.baseDocument.meta.revision }, `Base revision ${state.baseDocument.meta.revision} confirmed locally.`));
}

function renderOverrides() {
  if (!state) return;
  const hasBase = Boolean(state.baseDocument);
  elements.overrideNeedsBase.hidden = hasBase;
  elements.createPatchButton.disabled = !hasBase;
  elements.overrideBaseState.textContent = hasBase
    ? t("status.base", { revision: state.baseDocument.meta.revision }, `Base r${state.baseDocument.meta.revision}`)
    : t("base.required", {}, "Base required");
  elements.overrideBaseState.className = `status-pill${hasBase ? "" : " warn"}`;
  const patchParticipants = state.baseDocument?.participants || state.document.participants;
  const participants = Object.entries(patchParticipants).map(([value, participant]) => ({ value, label: participant.label }));
  fillSelect(elements.patchCreatedBy, participants, elements.patchCreatedBy.value || state.context.recordedByRef);
  fillSelect(elements.patchNewItemCategory, bundle.locale.categories.map((category) => ({ value: category.id, label: category.label })), elements.patchNewItemCategory.value || bundle.locale.categories[0].id);
  const sourceDocument = currentMerge().unified || state.baseDocument || state.document;
  const items = Object.entries(sourceDocument.items).map(([value, item]) => ({ value, label: `${item.label} · ${value}` }));
  fillSelect(elements.patchTargetItem, items, elements.patchTargetItem.value || items[0]?.value);
  renderPatchOperationFields();
  renderPatchList();
  renderDiff();
}

function renderPatchOperationFields() {
  const operation = elements.patchOperation.value;
  const adding = operation === "add";
  elements.existingTargetFields.hidden = adding;
  elements.newItemFields.hidden = !adding;
  elements.patchValueField.hidden = operation === "remove";
  renderPatchExpectedValue();
}

function renderPatchExpectedValue() {
  if (!state?.baseDocument || elements.patchOperation.value === "add") {
    elements.patchPreviousValue.textContent = "—";
    return;
  }
  const source = currentMerge().unified;
  const itemId = elements.patchTargetItem.value;
  const path = elements.patchOperation.value === "remove"
    ? `/items/${encodePointerSegment(itemId)}`
    : `/items/${encodePointerSegment(itemId)}/resolution/value`;
  const result = readPointer(source, path);
  elements.patchPreviousValue.textContent = result.exists ? JSON.stringify(result.value, null, 2) : t("patch.targetMissing", {}, "Target not found");
}

function currentMerge() {
  if (!state?.baseDocument) return { unified: null, conflicts: [], rows: [] };
  return applyPatches(state.baseDocument, patches);
}

function createPatchFromForm(event) {
  event.preventDefault();
  if (!state.baseDocument) return;
  const label = elements.patchLabel.value.trim();
  const reason = elements.patchReason.value.trim();
  const createdByRef = elements.patchCreatedBy.value;
  const operationType = elements.patchOperation.value;
  if (!label || !reason || !createdByRef) return showPatchValidation(t("patch.requiredFields", {}, "Add an Override label, creator, and reason."));
  const now = new Date().toISOString();
  let operation;
  try {
    if (operationType === "add") {
      const itemId = elements.patchNewItemId.value.trim();
      const itemLabel = elements.patchNewItemLabel.value.trim();
      if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,119}$/.test(itemId) || ["__proto__", "prototype", "constructor"].includes(itemId) || !itemLabel) throw new Error(t("patch.invalidItem", {}, "Add a safe, stable item ID and label for the new premise."));
      const value = parseLooseValue(elements.patchValue.value);
      const enforcement = elements.patchNewItemEnforcement.value;
      operation = {
        changeId: createId("chg"), op: "add", path: `/items/${encodePointerSegment(itemId)}`,
        value: {
          label: itemLabel, labelLanguage: bundle.locale.locale, category: elements.patchNewItemCategory.value,
          axis: elements.patchNewItemAxis.value, kind: elements.patchNewItemKind.value, scope: "project",
          enforcement, priority: enforcement === "hard" ? "must" : "should", contributions: {},
          resolution: { status: "provisional", value, decidedByRefs: [createdByRef], decisionMethod: "working_selection", decidedAt: now },
          dependencies: [], updatedAt: now
        },
        reason, createdAt: now
      };
    } else {
      const itemId = elements.patchTargetItem.value;
      if (!itemId) throw new Error(t("patch.chooseItem", {}, "Choose a premise item to change."));
      const source = currentMerge().unified;
      const path = operationType === "remove" ? `/items/${encodePointerSegment(itemId)}` : `/items/${encodePointerSegment(itemId)}/resolution/value`;
      const current = readPointer(source, path);
      if (!current.exists) throw new Error(t("patch.targetGone", {}, "The selected target is no longer available."));
      operation = { changeId: createId("chg"), op: operationType, path, previousValue: clone(current.value), reason, createdAt: now };
      if (operationType === "replace") operation.value = parseLooseValue(elements.patchValue.value);
    }
  } catch (error) {
    return showPatchValidation(error.message);
  }
  const patch = {
    schemaRef: PATCH_SCHEMA_REF,
    format: "premise-builder-patch",
    formatVersion: "0.1.0",
    protocolVersion: "0.1.0",
    documentType: "override",
    meta: {
      patchId: createId("pbp"), baseDocumentId: state.baseDocument.meta.documentId,
      baseRevision: state.baseDocument.meta.revision, label, contentLanguage: state.document.meta.contentLanguage,
      createdByRef, scope: elements.patchScope.value,
      ...(elements.patchExpiresAt.value ? { expiresAt: new Date(elements.patchExpiresAt.value).toISOString() } : {}),
      createdAt: now, updatedAt: now
    },
    operations: [operation]
  };
  const validation = validatePatch(patch);
  if (!validation.valid) return showPatchValidation(translateIssue(validation.errors[0]));
  patches.push(patch);
  state.patchIds = patches.map((entry) => entry.meta.patchId);
  elements.patchForm.reset();
  elements.patchScope.value = "user";
  elements.patchOperation.value = "replace";
  persistNow();
  renderOverrides();
  renderExport();
  showPatchValidation(t("patch.created", {}, "Override created and applied locally."), true);
}

function parseLooseValue(raw) {
  const value = raw.trim();
  if (!value) throw new Error(t("patch.valueRequired", {}, "Enter a new value."));
  try { return JSON.parse(value); } catch { return value; }
}

function showPatchValidation(message, success = false) {
  elements.patchValidation.textContent = message;
  elements.patchValidation.classList.toggle("success", success);
}

function renderPatchList() {
  elements.patchCount.textContent = t("patch.count", { count: patches.length }, `${patches.length} patch${patches.length === 1 ? "" : "es"}`);
  elements.patchList.replaceChildren();
  if (!patches.length) {
    const empty = document.createElement("div");
    empty.className = "empty-diff";
    empty.textContent = t("patch.none", {}, "No Overrides yet.");
    elements.patchList.append(empty);
    return;
  }
  for (const [index, patch] of patches.entries()) {
    const card = document.createElement("article");
    card.className = "patch-card";
    const head = document.createElement("div");
    head.className = "patch-card-head";
    const title = document.createElement("strong");
    title.textContent = `${index + 1}. ${patch.meta.label}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "patch-remove";
    remove.dataset.patchAction = "remove";
    remove.dataset.patchId = patch.meta.patchId;
    remove.textContent = t("patch.remove", {}, "Remove");
    head.append(title, remove);
    const meta = document.createElement("span");
    meta.textContent = `${labelFor("scope", patch.meta.scope)} · Base r${patch.meta.baseRevision}${patch.meta.expiresAt ? ` · ${t("patch.expires", { time: formatDate(patch.meta.expiresAt) }, `expires ${formatDate(patch.meta.expiresAt)}`)}` : ""}`;
    const path = document.createElement("code");
    path.textContent = `${patch.operations[0].op} ${patch.operations[0].path}`;
    const order = document.createElement("div");
    order.className = "inline-actions";
    for (const [action, label, disabled] of [["up", t("patch.moveUp", {}, "Move up"), index === 0], ["down", t("patch.moveDown", {}, "Move down"), index === patches.length - 1]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "text-button";
      button.dataset.patchAction = action;
      button.dataset.patchId = patch.meta.patchId;
      button.disabled = disabled;
      button.textContent = label;
      order.append(button);
    }
    card.append(head, meta, path, order);
    elements.patchList.append(card);
  }
}

function handlePatchListAction(event) {
  const button = event.target.closest("[data-patch-action]");
  if (!button) return;
  const index = patches.findIndex((patch) => patch.meta.patchId === button.dataset.patchId);
  if (index < 0) return;
  if (button.dataset.patchAction === "remove") patches.splice(index, 1);
  if (button.dataset.patchAction === "up" && index > 0) [patches[index - 1], patches[index]] = [patches[index], patches[index - 1]];
  if (button.dataset.patchAction === "down" && index < patches.length - 1) [patches[index + 1], patches[index]] = [patches[index], patches[index + 1]];
  state.patchIds = patches.map((patch) => patch.meta.patchId);
  persistNow();
  renderOverrides();
  renderExport();
}

function renderDiff() {
  const merge = currentMerge();
  elements.diffRows.replaceChildren();
  if (!state.baseDocument || !merge.rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-diff";
    empty.textContent = state.baseDocument
      ? t("diff.empty", {}, "Create an Override to compare Base and Unified values.")
      : t("diff.baseRequired", {}, "A confirmed Base is required for comparison.");
    elements.diffRows.append(empty);
    elements.diffState.textContent = t("diff.none", {}, "No differences");
    elements.diffState.className = "status-pill";
    return;
  }
  elements.diffState.textContent = merge.conflicts.length
    ? t("status.conflicts", { count: merge.conflicts.length }, `${merge.conflicts.length} conflict${merge.conflicts.length === 1 ? "" : "s"}`)
    : t("diff.applied", { count: merge.rows.length }, `${merge.rows.length} applied`);
  elements.diffState.className = `status-pill${merge.conflicts.length ? " conflict" : ""}`;
  for (const row of merge.rows) {
    const card = document.createElement("article");
    card.className = `diff-row${row.conflict ? " conflict" : ""}`;
    const identity = diffCell(translateText("Change"), `${labelFor("operation", row.operation.op)}\n${row.operation.path}\n${row.patch.meta.label}`);
    const base = diffCell(translateText("Before"), shortValue(row.before, 500));
    const requested = diffCell("Override", row.operation.op === "remove" ? `[${labelFor("operation", "remove")}]` : shortValue(row.requested, 500));
    const result = diffCell(row.conflict ? labelFor("status", "conflict") : (row.skippedReason ? translateText("Not applied") : "Unified"), translateText(row.conflict?.message || row.skippedReason || shortValue(row.after, 500)));
    card.append(identity, base, requested, result);
    elements.diffRows.append(card);
  }
}

function diffCell(label, value) {
  const cell = document.createElement("div");
  cell.className = "diff-cell";
  const heading = document.createElement("span");
  heading.textContent = label;
  const code = document.createElement("code");
  code.textContent = value;
  cell.append(heading, code);
  return cell;
}

function renderExport() {
  if (!state) return;
  const hasBase = Boolean(state.baseDocument);
  elements.exportBaseButton.disabled = !hasBase;
  elements.exportUnifiedButton.disabled = !hasBase;
  elements.exportMarkdownButton.disabled = !hasBase;
  elements.copyMarkdownButton.disabled = !hasBase;
  elements.exportBaseWarning.hidden = hasBase && !state.dirtySinceBase;
  if (!hasBase) elements.exportBaseWarning.textContent = t("export.noBase", {}, "Confirm a Base revision in Review before exporting authoritative project context.");
  else if (state.dirtySinceBase) elements.exportBaseWarning.textContent = t("export.pending", { revision: state.baseDocument.meta.revision }, `Exports use confirmed Base revision ${state.baseDocument.meta.revision}; later questionnaire changes are not included until you confirm a new revision.`);
  fillSelect(elements.patchExportSelect, patches.length ? patches.map((patch) => ({ value: patch.meta.patchId, label: patch.meta.label })) : [{ value: "", label: t("export.noOverride", {}, "No Override available") }], elements.patchExportSelect.value || patches[0]?.meta.patchId || "");
  elements.exportPatchButton.disabled = !patches.length;
  renderExportPreview();
}

function renderExportPreview() {
  if (!state) return;
  const format = elements.exportPreviewSelect.value;
  const base = state.baseDocument || state.document;
  if (format === "base") elements.exportPreview.textContent = JSON.stringify(base, null, 2);
  else if (format === "unified") elements.exportPreview.textContent = state.baseDocument ? JSON.stringify(currentMerge().unified, null, 2) : t("export.confirmFirst", {}, "Confirm a Base revision first.");
  else elements.exportPreview.textContent = state.baseDocument ? generateAIContext(currentMerge().unified, patches) : t("export.confirmFirst", {}, "Confirm a Base revision first.");
}

function exportBase() {
  if (!state.baseDocument) return;
  downloadText(exportFilename(state.baseDocument, "base", "json"), `${JSON.stringify(state.baseDocument, null, 2)}\n`);
  toast(t("export.baseDone", {}, "Base JSON created locally."));
}

function exportPatch() {
  const patch = patches.find((entry) => entry.meta.patchId === elements.patchExportSelect.value);
  if (!patch) return;
  downloadText(`${state.document.meta.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "premise"}.override.${patch.meta.patchId}.json`, `${JSON.stringify(patch, null, 2)}\n`);
  toast(t("export.patchDone", {}, "Override JSON created locally."));
}

function exportUnified() {
  if (!state.baseDocument) return;
  const unified = currentMerge().unified;
  downloadText(exportFilename(unified, "unified", "json"), `${JSON.stringify(unified, null, 2)}\n`);
  toast(t("export.unifiedDone", {}, "Unified JSON created locally."));
}

function exportMarkdown() {
  if (!state.baseDocument) return;
  const unified = currentMerge().unified;
  downloadText(exportFilename(unified, "AI_CONTEXT", "md"), generateAIContext(unified, patches), "text/markdown");
  toast(t("export.markdownDone", {}, "AI Context Markdown created locally."));
}

async function copyMarkdown() {
  if (!state.baseDocument) return;
  try {
    await navigator.clipboard.writeText(generateAIContext(currentMerge().unified, patches));
    toast(t("export.copied", {}, "AI Context copied to the clipboard."));
  } catch {
    toast(t("export.copyFailed", {}, "Clipboard access was unavailable. Download the Markdown file instead."));
  }
}

function chooseImportFile() {
  elements.importFileInput.click();
}

async function handleImport(file) {
  try {
    const imported = await readJsonFile(file);
    if (imported.format === "premise-builder-patch") return importPatch(imported);
    const importBundle = bootData.templates[imported.meta?.template?.id];
    if (!importBundle) throw new Error(t("import.unsupportedTemplate", {}, "This template is not supported by the current application."));
    const validation = validateDocument(imported, importBundle);
    if (!validation.valid) throw new Error(translateIssue(validation.errors[0]));
    configureBundle(imported.meta.template.id, uiLocale);
    const document = clone(imported);
    if (store.hasProject(document.meta.documentId)) {
      document.meta.documentId = createId("pb");
      document.meta.projectName = `${document.meta.projectName} ${t("import.copySuffix", {}, "(imported copy)")}`;
    }
    state = stateFromImportedDocument(document, bundle);
    patches = [];
    persistNow();
    activeWorkspaceView = "review";
    showWorkspace();
    toast(t("import.done", {}, "Premise document imported as a new local project."));
  } catch (error) {
    toast(t("import.stopped", { reason: translateText(error.message) }, `Import stopped: ${error.message}`));
  }
}

function importPatch(patch) {
  const validation = validatePatch(patch);
  if (!validation.valid) throw new Error(translateIssue(validation.errors[0]));
  let targetState = state;
  let targetPatches = patches;
  if (!targetState?.baseDocument || targetState.baseDocument.meta.documentId !== patch.meta.baseDocumentId) {
    const project = store.listProjects().find((entry) => {
      const workspace = store.loadWorkspace(entry.documentId);
      return workspace?.state?.baseDocument?.meta.documentId === patch.meta.baseDocumentId;
    });
    if (!project) throw new Error(t("import.noBase", {}, "No local Base matches this Override."));
    const workspace = store.loadWorkspace(project.documentId);
    targetState = workspace.state;
    targetPatches = workspace.patches;
  }
  if (targetPatches.some((entry) => entry.meta.patchId === patch.meta.patchId)) throw new Error(t("import.duplicateOverride", {}, "This Override is already stored with the project."));
  targetPatches.push(clone(patch));
  targetState.patchIds = targetPatches.map((entry) => entry.meta.patchId);
  store.saveWorkspace(targetState, targetPatches);
  state = targetState;
  patches = targetPatches;
  configureBundle(state.document.meta.template.id, uiLocale);
  activeWorkspaceView = "overrides";
  showWorkspace();
  toast(t("import.overrideDone", {}, "Override imported. Any Base mismatch is shown as a conflict."));
}

function openDeleteDialog(documentId, projectName = null) {
  if (!documentId) return;
  pendingDeleteId = documentId;
  const project = store.listProjects().find((entry) => entry.documentId === documentId);
  elements.deleteProjectName.textContent = projectName || project?.projectName || state?.document.meta.projectName || translateText("this project");
  elements.deleteDialog.showModal();
}

function confirmDeleteProject() {
  if (!pendingDeleteId) return;
  const result = store.hasProject(pendingDeleteId) ? store.deleteProject(pendingDeleteId) : { ok: true };
  if (state?.document.meta.documentId === pendingDeleteId) {
    state = null;
    patches = [];
  }
  pendingDeleteId = null;
  showHome();
  toast(result.ok ? t("delete.done", {}, "The selected local project was deleted.") : result.error);
}

function markAndRebuild() {
  markDraftChanged(state);
  rebuildDocument(state, bundle);
  scheduleSave();
}

function scheduleSave() {
  if (!state) return;
  elements.saveState.textContent = store.available
    ? t("storage.saving", {}, "Saving locally…")
    : t("storage.sessionOnly", {}, "Session only — export recommended");
  elements.saveState.classList.toggle("error", !store.available);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistNow, 350);
}

function persistNow() {
  clearTimeout(saveTimer);
  if (!state) return;
  const result = store.saveWorkspace(state, patches);
  elements.saveState.textContent = result.ok ? t("storage.saved", {}, "Saved in this browser") : result.error;
  elements.saveState.classList.toggle("error", !result.ok);
}

function fillSelect(select, options, selectedValue) {
  select.replaceChildren();
  for (const item of options) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    select.append(option);
  }
  if (options.some((item) => item.value === selectedValue)) select.value = selectedValue;
}

function fillFilter(select, options) {
  const current = select.value;
  select.replaceChildren();
  const all = document.createElement("option");
  all.value = "";
  all.textContent = t("filter.all", {}, "All");
  select.append(all);
  for (const item of options) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    select.append(option);
  }
  if ([...select.options].some((option) => option.value === current)) select.value = current;
}

function shortValue(value, limit = 72) {
  if (value === null || value === undefined || value === "") return "—";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
}

function formatDate(value) {
  if (!value) return t("time.unknown", {}, "unknown time");
  try { return new Intl.DateTimeFormat(uiLocale || "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  catch { return value; }
}

function showValidation(message, success = false) {
  elements.validationMessage.textContent = message;
  elements.validationMessage.classList.toggle("success", success);
  elements.answerControl.toggleAttribute("aria-invalid", Boolean(message) && !success);
}

function toast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 4800);
}

function registerWebMcpTools() {
  if (registeredTools || !document.modelContext?.registerTool) return;
  registeredTools = true;
  const lifecycle = new AbortController();
  registerTool({
    name: "read_premise_document",
    title: "Read premise document",
    description: "Read the current browser-local Premise Builder document without changing it.",
    inputSchema: { type: "object", additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute() { return { document: state?.document || null }; }
  }, lifecycle);
  registerTool({
    name: "read_unified_context",
    title: "Read unified premise context",
    description: "Read the locally derived Base plus ordered Overrides without changing project data.",
    inputSchema: { type: "object", additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute() { return { unified: state?.baseDocument ? currentMerge().unified : null }; }
  }, lifecycle);
  registerTool({
    name: "create_local_premise_project",
    title: "Create local premise project",
    description: "Create a browser-local web-small-app requirements project.",
    inputSchema: {
      type: "object",
      properties: {
        projectName: { type: "string", minLength: 1, maxLength: 200 },
        phase: { enum: ["new_build", "redesign", "extension", "repair"] },
        contentLanguage: { type: "string", minLength: 2, maxLength: 35 },
        recorderLabel: { type: "string", minLength: 1, maxLength: 240 },
        recorderRole: { enum: ["developer", "requester", "decision_owner", "designer", "maintainer", "security_compliance"] },
        recorderIsDecisionOwner: { type: "boolean" }
      },
      required: ["projectName", "phase", "contentLanguage", "recorderLabel", "recorderRole"],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: true },
    execute(input) {
      if (!input?.projectName?.trim()) throw new TypeError("projectName is required");
      state = createProjectState({
        ...input, projectName: input.projectName.trim(), contentLanguage: normalizeLanguageTag(input.contentLanguage),
        recorderIsDecisionOwner: input.recorderIsDecisionOwner === true, perspectiveMode: "same_recorder",
        perspectiveLabel: "", perspectiveRole: input.recorderRole
      }, bundle);
      patches = [];
      persistNow();
      showWorkspace();
      return { documentId: state.document.meta.documentId, currentQuestionId: state.currentQuestionId };
    }
  }, lifecycle);
}

function registerTool(tool, lifecycle) {
  try {
    void Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal }))
      .catch((error) => console.warn(`Could not register ${tool.name}`, error));
  } catch (error) {
    console.warn(`Could not register ${tool.name}`, error);
  }
}
