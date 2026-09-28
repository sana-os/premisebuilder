import { writeFile } from "node:fs/promises";
import { guide } from "../src/locales/guide.js";

function translate(value, index) {
  if (typeof value === "string") return value.split("|")[index];
  if (Array.isArray(value)) return value.map((entry) => translate(entry, index));
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, translate(entry, index)]));
}

// The other six locales are maintained directly in their JSON files.
for (const [index, locale] of ["en", "ja", "es"].entries()) {
  await writeFile(new URL(`../src/locales/guides/${locale}.json`, import.meta.url), `${JSON.stringify(translate(guide, index), null, 2)}\n`);
}
