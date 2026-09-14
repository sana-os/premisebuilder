import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createProjectState } from "../src/core.js";

const root = resolve(import.meta.dirname, "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));

export const bundle = {
  manifest: readJson("templates/web-small-app/manifest.json"),
  locale: readJson("templates/web-small-app/questions/en.json"),
  mappings: readJson("templates/web-small-app/mappings.json"),
  rules: readJson("templates/web-small-app/rules.json")
};

export function makeState({ decisionOwner = true, differentPerspective = false } = {}) {
  return createProjectState({
    projectName: "Example web project",
    phase: "new_build",
    contentLanguage: "en",
    recorderLabel: "Implementing developer",
    recorderRole: "developer",
    recorderIsDecisionOwner: decisionOwner,
    perspectiveMode: differentPerspective ? "different" : "same_recorder",
    perspectiveLabel: "Primary end users",
    perspectiveRole: "end_user"
  }, bundle);
}
