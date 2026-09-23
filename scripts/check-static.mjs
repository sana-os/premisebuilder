import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const html = await readFile(resolve(root, "src/index.html"), "utf8");
const app = await readFile(resolve(root, "src/app.js"), "utf8");
const css = await readFile(resolve(root, "src/styles.css"), "utf8");
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
if (duplicateIds.length) throw new Error(`Duplicate HTML IDs: ${duplicateIds.join(", ")}`);

const elementBlock = app.match(/Object\.fromEntries\(\[([\s\S]*?)\]\.map/);
if (!elementBlock) throw new Error("Could not inspect the application element registry");
const referencedIds = [...elementBlock[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
const missingIds = referencedIds.filter((id) => !ids.includes(id));
if (missingIds.length) throw new Error(`Application references missing HTML IDs: ${missingIds.join(", ")}`);

if (!html.includes("connect-src 'none'")) throw new Error("The source document must block runtime network connections");
if (/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(app)) {
  throw new Error("The application source contains a runtime network primitive");
}
if (/\b(margin|padding|border)-(left|right)\s*:|\b(left|right)\s*:/.test(css)) {
  throw new Error("Use logical CSS properties so future RTL locales do not require structural rewrites");
}

const manifest = JSON.parse(await readFile(resolve(root, "templates/web-small-app/manifest.json"), "utf8"));
const questions = JSON.parse(await readFile(resolve(root, "templates/web-small-app/questions/en.json"), "utf8"));
const mappings = JSON.parse(await readFile(resolve(root, "templates/web-small-app/mappings.json"), "utf8"));
const questionIds = questions.questions.map((question) => question.questionId);
const mappingIds = mappings.mappings.map((mapping) => mapping.questionId);
if (new Set(questionIds).size !== manifest.questionCount || questionIds.length !== manifest.questionCount) {
  throw new Error("The English question IDs are not unique or do not match the manifest count");
}
if (mappingIds.length !== questionIds.length || questionIds.some((id) => !mappingIds.includes(id))) {
  throw new Error("Every public question must have exactly one language-neutral mapping");
}
const localizedQuestionSets = {};
for (const locale of manifest.locales) {
  const localized = JSON.parse(await readFile(resolve(root, `templates/web-small-app/questions/${locale}.json`), "utf8"));
  localizedQuestionSets[locale] = localized;
  if (localized.locale !== locale || localized.questions.length !== questions.questions.length) {
    throw new Error(`The ${locale} question set does not match the English question count or locale`);
  }
  for (const [index, englishQuestion] of questions.questions.entries()) {
    const localizedQuestion = localized.questions[index];
    if (
      englishQuestion.questionId !== localizedQuestion.questionId ||
      englishQuestion.category !== localizedQuestion.category ||
      englishQuestion.responseType !== localizedQuestion.responseType ||
      englishQuestion.order !== localizedQuestion.order
    ) throw new Error(`Question identity differs between English and ${locale} at index ${index}`);
    const stableChoices = (question) => (question.choices || []).map(({ value, requiresNote, exclusive }) => ({
      value,
      requiresNote: Boolean(requiresNote),
      exclusive: Boolean(exclusive)
    }));
    if (JSON.stringify(stableChoices(englishQuestion)) !== JSON.stringify(stableChoices(localizedQuestion))) {
      throw new Error(`Choice semantics differ between English and ${locale}: ${englishQuestion.questionId}`);
    }
  }
}

const chromeLocales = {};
for (const locale of manifest.locales) {
  chromeLocales[locale] = JSON.parse(await readFile(resolve(root, `src/locales/${locale}.json`), "utf8"));
}
const completeChromeReference = chromeLocales.ja;
for (const locale of manifest.locales.filter((locale) => locale !== "en")) {
  for (const group of ["text", "messages"]) {
    const expected = Object.keys(completeChromeReference[group] || {}).sort();
    const actual = Object.keys(chromeLocales[locale][group] || {}).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Application ${group} keys differ between Japanese and ${locale}`);
    }
  }
  const expectedLabelGroups = Object.keys(completeChromeReference.labels || {}).sort();
  const actualLabelGroups = Object.keys(chromeLocales[locale].labels || {}).sort();
  if (JSON.stringify(actualLabelGroups) !== JSON.stringify(expectedLabelGroups)) {
    throw new Error(`Application label groups differ between Japanese and ${locale}`);
  }
  for (const group of expectedLabelGroups) {
    const expected = Object.keys(completeChromeReference.labels[group]).sort();
    const actual = Object.keys(chromeLocales[locale].labels[group] || {}).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Application label keys differ for ${group} between Japanese and ${locale}`);
    }
  }
}

const requiredDistPaths = [
  "dist/index.html",
  "dist/app-data.js",
  "dist/_headers",
  "dist/schemas/premise-document.schema.v0.1.json"
];
for (const locale of manifest.locales) {
  requiredDistPaths.push(`dist/${locale}/index.html`, `dist/${locale}/new/web-small-app/index.html`);
}
for (const path of requiredDistPaths) await access(resolve(root, path));

const distFiles = await readdir(resolve(root, "dist"));
if (!distFiles.includes("robots.txt") || !distFiles.includes("sitemap.xml")) throw new Error("Public discovery files are missing");

console.log(`Static checks passed: ${manifest.questionCount} questions across ${manifest.locales.length} locales (${manifest.locales.join(", ")}), ${ids.length} unique interface IDs, no runtime network primitives.`);
