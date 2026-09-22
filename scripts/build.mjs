import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, "src"), dist, { recursive: true });
await cp(resolve(root, "templates"), resolve(dist, "templates"), { recursive: true });
await cp(resolve(root, "schemas"), resolve(dist, "schemas"), { recursive: true });

const templatesRoot = resolve(root, "templates");
const templateDirectories = (await readdir(templatesRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name));
const registry = [];
const localeRoutes = new Set();
const templateBundles = {};

const chromeLocaleRoot = resolve(root, "src/locales");
const chromeLocaleFiles = (await readdir(chromeLocaleRoot, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .sort((a, b) => a.name.localeCompare(b.name));
const chromeLocales = {};
for (const file of chromeLocaleFiles) {
  const locale = JSON.parse(await readFile(resolve(chromeLocaleRoot, file.name), "utf8"));
  if (!locale.locale || !["ltr", "rtl"].includes(locale.direction) || !locale.strings) {
    throw new Error(`Invalid application locale: ${file.name}`);
  }
  chromeLocales[locale.locale] = locale;
}
if (!chromeLocales.en) throw new Error("The canonical English application locale is missing");
const englishChromeKeys = Object.keys(chromeLocales.en.strings).sort();
for (const [localeId, locale] of Object.entries(chromeLocales)) {
  if (JSON.stringify(Object.keys(locale.strings).sort()) !== JSON.stringify(englishChromeKeys)) {
    throw new Error(`Application locale keys do not match English: ${localeId}`);
  }
}

for (const directory of templateDirectories) {
  const templateRoot = resolve(templatesRoot, directory.name);
  const manifest = JSON.parse(await readFile(resolve(templateRoot, "manifest.json"), "utf8"));
  if (manifest.id !== directory.name || !manifest.locales.includes(manifest.defaultLocale)) {
    throw new Error(`Invalid template manifest: ${directory.name}`);
  }
  const rules = JSON.parse(await readFile(resolve(templateRoot, manifest.rules), "utf8"));
  const mappings = JSON.parse(await readFile(resolve(templateRoot, manifest.mappings), "utf8"));
  const localizedQuestions = {};
  for (const locale of manifest.locales) {
    const questionPath = manifest.questionSet.replace("{locale}", locale);
    const questionSet = JSON.parse(await readFile(resolve(templateRoot, questionPath), "utf8"));
    if (
      questionSet.templateId !== manifest.id ||
      questionSet.templateVersion !== manifest.version ||
      questionSet.locale !== locale ||
      questionSet.questions.length !== manifest.questionCount
    ) {
      throw new Error(`Question set does not match ${manifest.id}/${locale}`);
    }
    localeRoutes.add(locale);
    localizedQuestions[locale] = questionSet;
    const routeDirectory = resolve(dist, locale, "new", manifest.id);
    await mkdir(routeDirectory, { recursive: true });
    await cp(resolve(root, "src/index.html"), resolve(routeDirectory, "index.html"));
  }
  registry.push({
    id: manifest.id,
    family: manifest.family,
    version: manifest.version,
    defaultLocale: manifest.defaultLocale,
    locales: manifest.locales
  });
  templateBundles[manifest.id] = {
    manifest,
    locale: localizedQuestions[manifest.defaultLocale],
    locales: localizedQuestions,
    rules,
    mappings
  };
}

for (const locale of [...localeRoutes].sort()) {
  const routeDirectory = resolve(dist, locale);
  await mkdir(routeDirectory, { recursive: true });
  await cp(resolve(root, "src/index.html"), resolve(routeDirectory, "index.html"));
}

await writeFile(resolve(dist, "templates/index.json"), `${JSON.stringify({ templates: registry }, null, 2)}\n`);
await writeFile(
  resolve(dist, "app-data.js"),
  `globalThis.__PREMISE_BUILDER_DATA__ = ${JSON.stringify({ registry, locales: chromeLocales, templates: templateBundles })};\n`
);
await writeFile(resolve(dist, "robots.txt"), "User-agent: *\nAllow: /\nSitemap: https://premisebuilder.info/sitemap.xml\n");
const sitemapUrls = [...localeRoutes].sort().flatMap((locale) => [
  `  <url><loc>https://premisebuilder.info/${locale}/</loc></url>`,
  ...registry.map((template) => `  <url><loc>https://premisebuilder.info/${locale}/new/${template.id}/</loc></url>`)
]);
await writeFile(
  resolve(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join("\n")}\n</urlset>\n`
);
await writeFile(
  resolve(dist, "_headers"),
  "/*\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()\n\n"
);

console.log("Built static site in dist/");
