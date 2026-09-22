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
const japaneseQuestions = JSON.parse(await readFile(resolve(root, "templates/web-small-app/questions/ja.json"), "utf8"));
const mappings = JSON.parse(await readFile(resolve(root, "templates/web-small-app/mappings.json"), "utf8"));
const questionIds = questions.questions.map((question) => question.questionId);
const mappingIds = mappings.mappings.map((mapping) => mapping.questionId);
if (new Set(questionIds).size !== manifest.questionCount || questionIds.length !== manifest.questionCount) {
  throw new Error("The English question IDs are not unique or do not match the manifest count");
}
if (mappingIds.length !== questionIds.length || questionIds.some((id) => !mappingIds.includes(id))) {
  throw new Error("Every public question must have exactly one language-neutral mapping");
}
if (japaneseQuestions.questions.length !== questions.questions.length) {
  throw new Error("The Japanese and English question sets have different lengths");
}
for (const [index, englishQuestion] of questions.questions.entries()) {
  const japaneseQuestion = japaneseQuestions.questions[index];
  if (englishQuestion.questionId !== japaneseQuestion.questionId || englishQuestion.responseType !== japaneseQuestion.responseType) {
    throw new Error(`Question identity differs between English and Japanese at index ${index}`);
  }
  const stableChoices = (question) => (question.choices || []).map(({ value, requiresNote, exclusive }) => ({ value, requiresNote: Boolean(requiresNote), exclusive: Boolean(exclusive) }));
  if (JSON.stringify(stableChoices(englishQuestion)) !== JSON.stringify(stableChoices(japaneseQuestion))) {
    throw new Error(`Choice semantics differ between English and Japanese: ${englishQuestion.questionId}`);
  }
}

for (const path of [
  "dist/index.html",
  "dist/en/index.html",
  "dist/en/new/web-small-app/index.html",
  "dist/ja/index.html",
  "dist/ja/new/web-small-app/index.html",
  "dist/app-data.js",
  "dist/_headers",
  "dist/schemas/premise-document.schema.v0.1.json"
]) await access(resolve(root, path));

const distFiles = await readdir(resolve(root, "dist"));
if (!distFiles.includes("robots.txt") || !distFiles.includes("sitemap.xml")) throw new Error("Public discovery files are missing");

console.log(`Static checks passed: ${manifest.questionCount} questions in English and Japanese, ${ids.length} unique interface IDs, no runtime network primitives.`);
