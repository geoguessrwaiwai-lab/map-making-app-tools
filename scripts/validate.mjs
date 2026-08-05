import fs from "node:fs";
import vm from "node:vm";

const REQUIRED_EXTENSION_FILES = [
  "manifest.json",
  "content.js",
  "content.css",
  "icon16.png",
  "icon32.png",
  "icon48.png",
  "icon128.png"
];

const REQUIRED_PROJECT_FILES = [
  ...REQUIRED_EXTENSION_FILES,
  "README.md",
  "AGENTS.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "CHANGELOG.md",
  "LICENSE",
  "docs/MAINTAINING.md",
  "docs/CHROME_WEB_STORE_LISTING.md",
  "homepage/index.html",
  "homepage/privacy/index.html",
  "homepage/contact/index.html",
  "homepage/en/index.html",
  "homepage/en/privacy/index.html",
  "homepage/en/contact/index.html",
  "homepage/reset.css",
  "homepage/styles.css",
  "homepage/favicon.png",
  "homepage/assets/resizable-editor-demo.mp4",
  "homepage/assets/resizable-editor-demo-poster.jpg",
  "store-assets/screenshot-editor-640x400.png",
  "store-assets/small-promo-440x280.png",
  "artwork/icon.svg",
  ".github/workflows/ci.yml",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/ISSUE_TEMPLATE/question.yml",
  ".github/pull_request_template.md"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const path of REQUIRED_PROJECT_FILES) {
  assert(fs.existsSync(path), `Missing required file: ${path}`);
}

for (const htmlPath of [
  "homepage/index.html",
  "homepage/privacy/index.html",
  "homepage/contact/index.html",
  "homepage/en/index.html",
  "homepage/en/privacy/index.html",
  "homepage/en/contact/index.html"
]) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const resetIndex = html.indexOf('href="/reset.css"');
  const stylesIndex = html.indexOf('href="/styles.css"');
  assert(resetIndex !== -1, `${htmlPath} must include reset.css`);
  assert(stylesIndex !== -1, `${htmlPath} must include styles.css`);
  assert(resetIndex < stylesIndex, `${htmlPath} must load reset.css before styles.css`);
}

const LANGUAGE_PAGE_PAIRS = [
  ["homepage/index.html", 'href="/en/"'],
  ["homepage/privacy/index.html", 'href="/en/privacy/"'],
  ["homepage/contact/index.html", 'href="/en/contact/"'],
  ["homepage/en/index.html", 'href="/"'],
  ["homepage/en/privacy/index.html", 'href="/privacy/"'],
  ["homepage/en/contact/index.html", 'href="/contact/"']
];

for (const [htmlPath, counterpartLink] of LANGUAGE_PAGE_PAIRS) {
  const html = fs.readFileSync(htmlPath, "utf8");
  assert(html.includes(counterpartLink), `${htmlPath} must link to its translated counterpart`);
}

const demoVideo = fs.readFileSync("homepage/assets/resizable-editor-demo.mp4");
const demoPoster = fs.readFileSync("homepage/assets/resizable-editor-demo-poster.jpg");
assert(
  demoVideo.subarray(4, 8).toString("ascii") === "ftyp",
  "homepage demo video must use an MP4 container"
);
assert(
  demoPoster[0] === 0xff && demoPoster[1] === 0xd8,
  "homepage demo poster must be a JPEG image"
);

for (const htmlPath of ["homepage/index.html", "homepage/en/index.html"]) {
  const html = fs.readFileSync(htmlPath, "utf8");
  assert(
    html.includes('/assets/resizable-editor-demo.mp4'),
    `${htmlPath} must include the MP4 demo video`
  );
}

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
assert(manifest.manifest_version === 3, "manifest_version must be 3");
assert(/^\d+\.\d+\.\d+$/.test(manifest.version), "manifest version must use MAJOR.MINOR.PATCH");
assert(!Object.hasOwn(manifest, "permissions") || manifest.permissions.length === 0, "permissions must remain empty");
assert(!Object.hasOwn(manifest, "host_permissions") || manifest.host_permissions.length === 0, "host_permissions must remain empty");
assert(Array.isArray(manifest.content_scripts) && manifest.content_scripts.length === 1, "exactly one content script definition is required");

const [contentScript] = manifest.content_scripts;
assert(JSON.stringify(contentScript.matches) === JSON.stringify(["https://map-making.app/maps/*"]), "content script matches must remain limited to Map Making App map paths");
assert(JSON.stringify(contentScript.js) === JSON.stringify(["content.js"]), "content script entry point must be content.js");
assert(JSON.stringify(contentScript.css) === JSON.stringify(["content.css"]), "content stylesheet must be content.css");
assert(contentScript.run_at === "document_idle", "content script must run at document_idle");

for (const path of Object.values(manifest.icons ?? {})) {
  assert(fs.existsSync(path), `Missing icon referenced by manifest: ${path}`);
}

const contentSource = fs.readFileSync("content.js", "utf8");
const contentStyles = fs.readFileSync("content.css", "utf8");
new vm.Script(contentSource, { filename: "content.js" });

assert(contentSource.includes("/^\\/maps\\/\\d+\\/?$/"), "runtime path check must remain limited to numeric map IDs");
assert(contentSource.includes('const MIN_PERCENT = 25'), "minimum pane width must remain 25%");
assert(contentSource.includes('const MAX_PERCENT = 75'), "maximum pane width must remain 75%");
assert(
  contentSource.includes('window.matchMedia("(min-width: 801px)")'),
  "the resize handle must only be enabled at viewport widths of 801px or more"
);
assert(
  contentStyles.includes("@media (min-width: 801px)"),
  "editor layout overrides must only apply at viewport widths of 801px or more"
);
assert(
  contentSource.includes("minmax(0, ${leftPercent}fr) minmax(0, ${100 - leftPercent}fr)"),
  "grid tracks must allow shrinking below their intrinsic minimum width"
);
assert(
  /\.page-map-editor\s*>\s*\*\s*\{[^}]*min-width:\s*0\s*!important/s.test(contentStyles),
  "direct editor grid items must allow shrinking inside narrow tracks"
);
assert(
  contentStyles.includes(".page-map-editor > .mma-resizable-work-area"),
  "work-area must remain identifiable as the responsive container"
);
assert(
  /\.page-map-editor\s*\{[^}]*overflow-x:\s*clip/s.test(contentStyles),
  "the editor must clip horizontal overflow before it reaches the page"
);
assert(
  /\.page-map-editor\s*>\s*\.mma-resizable-work-area\s*\{[^}]*overflow-x:\s*auto\s*!important/s.test(contentStyles),
  "horizontal overflow must remain scrollable inside the work area"
);
assert(
  contentStyles.includes("@container mma-resizable-work-area (max-width: 640px)"),
  "narrow work areas must use a container query"
);
assert(
  contentStyles.includes('"date"') && contentStyles.includes('"actions"'),
  "date and actions must stack into separate rows in narrow work areas"
);

const forbiddenPatterns = [
  ["fetch", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["sendBeacon", /\bsendBeacon\s*\(/],
  ["eval", /\beval\s*\(/],
  ["new Function", /\bnew\s+Function\s*\(/]
];

for (const [name, pattern] of forbiddenPatterns) {
  assert(!pattern.test(contentSource), `content.js must not use ${name}`);
}

console.log(`Validation passed for version ${manifest.version}.`);
