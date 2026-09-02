import fs from "node:fs";
import vm from "node:vm";

const REQUIRED_EXTENSION_FILES = [
  "manifest.json",
  "resize.js",
  "pochipochi-bridge.js",
  "pochipochi.js",
  "map-list.js",
  "resize.css",
  "pochipochi.css",
  "map-list.css",
  "options.html",
  "options.css",
  "options.js",
  "_locales/ja/messages.json",
  "_locales/en/messages.json",
  "icon16.png",
  "icon32.png",
  "icon48.png",
  "icon128.png",
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
  "store-assets/screenshot-editor-640x400.png",
  "store-assets/small-promo-440x280.png",
  "artwork/icon.svg",
  ".github/workflows/ci.yml",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/ISSUE_TEMPLATE/question.yml",
  ".github/pull_request_template.md",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const path of REQUIRED_PROJECT_FILES) {
  assert(fs.existsSync(path), `Missing required file: ${path}`);
}

const makefileSource = fs.readFileSync("Makefile", "utf8");
const sourcesMatch = makefileSource.match(/^SOURCES := (.+)$/m);
assert(
  sourcesMatch,
  "Makefile must define a SOURCES variable listing the packaged files"
);
const localesMatch = makefileSource.match(/^LOCALES := (.+)$/m);
assert(
  localesMatch,
  "Makefile must define a LOCALES variable listing the packaged locale files"
);
// ロケールはディレクトリ構造ごと同梱するため、フラットに詰めるSOURCESとは別の変数で管理する。
const packagedSources = [
  ...sourcesMatch[1].split(/\s+/),
  ...localesMatch[1].split(/\s+/),
];
for (const path of REQUIRED_EXTENSION_FILES) {
  assert(
    packagedSources.includes(path),
    `Makefile SOURCES or LOCALES must include ${path} so it ships in the packaged extension`
  );
}

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
assert(manifest.manifest_version === 3, "manifest_version must be 3");
assert(
  /^\d+\.\d+\.\d+$/.test(manifest.version),
  "manifest version must use MAJOR.MINOR.PATCH"
);
assert(
  manifest.version === "1.4.2",
  "the release package must remain version 1.4.2"
);
assert(
  manifest.default_locale === "ja",
  "default_locale must stay ja so the store falls back to the Japanese listing"
);
assert(
  manifest.name === "__MSG_extName__",
  "the extension name must come from _locales so the store listing can be localized"
);
assert(
  manifest.description === "__MSG_extDescription__",
  "the extension description must come from _locales so the store summary can be localized"
);

// ストアの商品名・概要は_localesから配信されるため、両ロケールで同じキーが揃っている必要がある。
const LOCALE_CODES = ["ja", "en"];
const LOCALE_MESSAGE_KEYS = ["extName", "extDescription"];
// Chrome ウェブストアの概要欄の上限。
const STORE_SUMMARY_MAX_LENGTH = 132;
for (const code of LOCALE_CODES) {
  const localePath = `_locales/${code}/messages.json`;
  const messages = JSON.parse(fs.readFileSync(localePath, "utf8"));
  for (const key of LOCALE_MESSAGE_KEYS) {
    assert(
      typeof messages[key]?.message === "string" &&
        messages[key].message.trim().length > 0,
      `${localePath} must define a non-empty message for ${key}`
    );
  }
  assert(
    messages.extDescription.message.length <= STORE_SUMMARY_MAX_LENGTH,
    `${localePath} extDescription must stay within ${STORE_SUMMARY_MAX_LENGTH} characters for the store summary`
  );
}

assert(
  JSON.stringify(manifest.permissions) === JSON.stringify(["storage"]),
  "only the storage permission is allowed"
);
assert(
  manifest.options_ui?.page === "options.html",
  "the extension management page must link to options.html"
);
assert(
  manifest.options_ui?.open_in_tab === true,
  "the options page must open in a full tab"
);
assert(
  !Object.hasOwn(manifest, "host_permissions") ||
    manifest.host_permissions.length === 0,
  "host_permissions must remain empty"
);
assert(
  Array.isArray(manifest.content_scripts) &&
    manifest.content_scripts.length === 4,
  "exactly four content script definitions are required"
);

const [resizeScript, pochipochiBridgeScript, pochipochiScript, mapListScript] =
  manifest.content_scripts;
assert(
  JSON.stringify(resizeScript.matches) ===
    JSON.stringify(["https://map-making.app/maps/*"]),
  "the resize content script matches must remain limited to Map Making App map paths"
);
assert(
  JSON.stringify(resizeScript.js) === JSON.stringify(["resize.js"]),
  "the resize content script entry point must be resize.js"
);
assert(
  JSON.stringify(resizeScript.css) === JSON.stringify(["resize.css"]),
  "the resize stylesheet must be resize.css"
);
assert(
  resizeScript.run_at === "document_idle",
  "the resize content script must run at document_idle"
);
assert(
  !Object.hasOwn(resizeScript, "world"),
  "resize.js must run in the isolated world"
);
assert(
  JSON.stringify(pochipochiBridgeScript.matches) ===
    JSON.stringify(["https://map-making.app/maps/*"]),
  "the Pochi-pochi storage bridge matches must remain limited to Map Making App map paths"
);
assert(
  JSON.stringify(pochipochiBridgeScript.js) ===
    JSON.stringify(["pochipochi-bridge.js"]),
  "the Pochi-pochi storage bridge entry point must be pochipochi-bridge.js"
);
assert(
  JSON.stringify(pochipochiBridgeScript.css) ===
    JSON.stringify(["pochipochi.css"]),
  "the Pochi-pochi stylesheet must be pochipochi.css"
);
assert(
  pochipochiBridgeScript.run_at === "document_idle",
  "the Pochi-pochi storage bridge must run at document_idle"
);
assert(
  !Object.hasOwn(pochipochiBridgeScript, "world"),
  "pochipochi-bridge.js must run in the isolated world"
);
assert(
  JSON.stringify(pochipochiScript.matches) ===
    JSON.stringify(["https://map-making.app/maps/*"]),
  "MAIN world script matches must remain limited to Map Making App map paths"
);
assert(
  JSON.stringify(pochipochiScript.js) === JSON.stringify(["pochipochi.js"]),
  "MAIN world script entry point must be pochipochi.js"
);
assert(
  pochipochiScript.run_at === "document_idle",
  "MAIN world script must run at document_idle"
);
assert(
  pochipochiScript.world === "MAIN",
  "pochipochi.js must run in MAIN world to use the editor's location API"
);
assert(
  JSON.stringify(mapListScript.matches) ===
    JSON.stringify(["https://map-making.app/"]),
  "the top page content script must remain limited to the map list page"
);
assert(
  JSON.stringify(mapListScript.js) === JSON.stringify(["map-list.js"]),
  "top page content script entry point must be map-list.js"
);
assert(
  JSON.stringify(mapListScript.css) === JSON.stringify(["map-list.css"]),
  "top page content stylesheet must be map-list.css"
);
assert(
  mapListScript.run_at === "document_start",
  "the top page script must run at document_start so the native list never flashes before the folder view"
);
assert(
  !Object.hasOwn(mapListScript, "world"),
  "map-list.js must run in the isolated world"
);

for (const path of Object.values(manifest.icons ?? {})) {
  assert(fs.existsSync(path), `Missing icon referenced by manifest: ${path}`);
}

const resizeSource = fs.readFileSync("resize.js", "utf8");
const pochipochiBridgeSource = fs.readFileSync("pochipochi-bridge.js", "utf8");
const pochipochiSource = fs.readFileSync("pochipochi.js", "utf8");
const mapListSource = fs.readFileSync("map-list.js", "utf8");
const resizeStyles = fs.readFileSync("resize.css", "utf8");
const pochipochiStyles = fs.readFileSync("pochipochi.css", "utf8");
const mapListStyles = fs.readFileSync("map-list.css", "utf8");
const optionsHtml = fs.readFileSync("options.html", "utf8");
const optionsStyles = fs.readFileSync("options.css", "utf8");
const optionsSource = fs.readFileSync("options.js", "utf8");
new vm.Script(resizeSource, { filename: "resize.js" });
new vm.Script(pochipochiBridgeSource, { filename: "pochipochi-bridge.js" });
new vm.Script(pochipochiSource, { filename: "pochipochi.js" });
new vm.Script(mapListSource, { filename: "map-list.js" });
new vm.Script(optionsSource, { filename: "options.js" });

assert(
  resizeSource.includes("/^\\/maps\\/\\d+\\/?$/"),
  "runtime path check must remain limited to numeric map IDs"
);
assert(
  resizeSource.includes("const MIN_PERCENT = 25"),
  "minimum screen width must remain 25%"
);
assert(
  resizeSource.includes("const MAX_PERCENT = 75"),
  "maximum screen width must remain 75%"
);
assert(
  !resizeSource.includes('handle.addEventListener("keydown"'),
  "the resize handle must not register keyboard controls"
);
assert(
  !resizeSource.includes("handle.tabIndex"),
  "the pointer-only resize handle must not enter the tab order"
);
assert(
  resizeSource.includes('window.matchMedia("(min-width: 801px)")'),
  "the resize handle must only be enabled at viewport widths of 801px or more"
);
assert(
  resizeStyles.includes("@media (min-width: 801px)"),
  "editor layout overrides must only apply at viewport widths of 801px or more"
);
assert(
  resizeSource.includes(
    "minmax(0, ${leftPercent}fr) minmax(0, ${100 - leftPercent}fr)"
  ),
  "grid tracks must allow shrinking below their intrinsic minimum width"
);
assert(
  /\.page-map-editor\s*>\s*\*\s*\{[^}]*min-width:\s*0\s*!important/s.test(
    resizeStyles
  ),
  "direct editor grid items must allow shrinking inside narrow tracks"
);
assert(
  resizeStyles.includes(".page-map-editor > .mma-resizable-work-area"),
  "work-area must remain identifiable as the responsive container"
);
assert(
  /\.page-map-editor\s*\{[^}]*overflow-x:\s*clip/s.test(resizeStyles),
  "the editor must clip horizontal overflow before it reaches the page"
);
assert(
  /\.page-map-editor\s*>\s*\.mma-resizable-work-area\s*\{[^}]*overflow-x:\s*auto\s*!important/s.test(
    resizeStyles
  ),
  "horizontal overflow must remain scrollable inside the work area"
);
assert(
  resizeStyles.includes(
    "@container mma-resizable-work-area (max-width: 640px)"
  ),
  "narrow work areas must use a container query"
);
assert(
  resizeStyles.includes('"date"') && resizeStyles.includes('"actions"'),
  "date and actions must stack into separate rows in narrow work areas"
);
assert(
  /\.page-map-editor\s+\.map-meta\s*,[^{]*\.map-meta__actions\s*,[^{]*\.map-meta__import\s*\{[^}]*flex-wrap:\s*nowrap/s.test(
    resizeStyles
  ),
  "the map metadata bar must never wrap its buttons/text onto new lines"
);
assert(
  /\.page-map-editor\s+\.map-meta\s*\{[^}]*overflow-x:\s*auto/s.test(
    resizeStyles
  ),
  "the map metadata bar must scroll horizontally instead of wrapping"
);

const forbiddenPatterns = [
  ["fetch", /\bfetch\s*\(/],
  ["XMLHttpRequest", /\bXMLHttpRequest\b/],
  ["WebSocket", /\bWebSocket\b/],
  ["sendBeacon", /\bsendBeacon\s*\(/],
  ["eval", /\beval\s*\(/],
  ["new Function", /\bnew\s+Function\s*\(/],
];

for (const [name, pattern] of forbiddenPatterns) {
  assert(!pattern.test(resizeSource), `resize.js must not use ${name}`);
  assert(
    !pattern.test(pochipochiBridgeSource),
    `pochipochi-bridge.js must not use ${name}`
  );
  assert(!pattern.test(pochipochiSource), `pochipochi.js must not use ${name}`);
  assert(!pattern.test(mapListSource), `map-list.js must not use ${name}`);
  assert(!pattern.test(optionsSource), `options.js must not use ${name}`);
}

assert(
  mapListSource.includes("const TARGET_PATH = /^\\/$/"),
  "the top page runtime path check must remain limited to the exact map list path"
);
assert(
  mapListSource.includes(
    "const NATIVE_LIST_SELECTOR = '[data-replace=\"InteractiveMapList\"]'"
  ),
  "the folder view must attach only to the site's own map list container"
);
assert(
  mapListSource.includes("HEADINGS_KEY"),
  "folder definitions must be namespaced in extension storage"
);
assert(
  mapListSource.includes("BOOTING_CLASS") &&
    mapListStyles.includes(".mma-map-list-booting"),
  "the native list must stay hidden until the folder view has rendered"
);
assert(
  mapListSource.includes('document.readyState !== "loading"'),
  "attaching must wait for the parsed document so the #data block and updates section are available"
);
assert(
  mapListSource.includes("FAVORITES_KEY"),
  "favorites must be namespaced in extension storage"
);
assert(
  mapListSource.includes("COUNTRIES_KEY"),
  "country chips must be namespaced in extension storage"
);
assert(
  mapListSource.includes("TAGS_KEY"),
  "map tags must be namespaced in extension storage"
);
assert(
  mapListSource.includes("findNativeEditButton"),
  "edit/delete must be delegated to the site's own settings dialog"
);
assert(
  mapListSource.includes("findNativeCreateMapForm"),
  "new map creation must be delegated to the site's own create-map form"
);
assert(
  !/document\.createElement\(\s*["']form["']\s*\)/.test(mapListSource),
  "map-list.js must not construct its own submission form; it must reuse the site's native one"
);
assert(
  mapListSource.includes("mma-map-list__native-hidden"),
  "the native list must only be hidden visually, not removed"
);
assert(
  mapListStyles.includes(".mma-map-list__native-hidden"),
  "the native-hidden class must be defined in map-list.css"
);
assert(
  mapListSource.includes('const UPDATES_SECTION_SELECTOR = "section.updates"'),
  "the footer must be built from the site's own updates section"
);
assert(
  mapListSource.includes("attachFooter"),
  "the footer (Updates toggle, CTAs, logout links, credit) must be assembled on attach"
);
assert(
  mapListSource.includes("movedFooterNodes"),
  "nodes moved into the footer must be tracked so they can be restored on detach"
);
assert(
  mapListSource.includes("openUpdatesPopup"),
  "the collapsed Updates changelog must be viewable again through a popup"
);
assert(
  mapListSource.includes("detachFooter"),
  "the footer must be reverted (native nodes restored) on detach"
);
assert(
  /viewMode === "native"\) \{[\s\S]{0,120}detachFooter\(\)/.test(mapListSource),
  "switching to the native view must fully restore the footer, not just unhide the native map list"
);
assert(
  mapListSource.includes('".updates__version"') &&
    mapListSource.includes(".ctas"),
  "the footer must include the ReAnna credit line and the manual/Discord CTAs"
);
assert(
  mapListStyles.includes(".mma-map-list__footer"),
  "the footer must have its own layout styling"
);
assert(
  mapListStyles.includes(
    ".page-map-list:has(section.updates.mma-map-list-updates-hidden)"
  ),
  "the Your Maps column must reclaim the width freed up by collapsing the native Updates column"
);
assert(
  mapListStyles.includes("flex: 1 1 100px") &&
    mapListStyles.includes("min-width: 0"),
  "map card titles must be able to shrink and ellipsize instead of overflowing narrow columns"
);
assert(
  mapListSource.includes("document.body.append(footerEl)"),
  "the footer must attach to the end of the page, not a width-constrained container"
);
assert(
  mapListStyles.includes(".mma-map-list__board") &&
    mapListStyles.includes("grid-template-columns: 1fr 1fr"),
  "folder sections must be arranged in a two-column grid"
);
assert(
  mapListStyles.includes(".mma-map-list__section--right"),
  "the unassigned section must be pinned to the right column of the folder grid"
);
assert(
  mapListSource.includes(
    'unassignedSection.classList.add("mma-map-list__section--right")'
  ),
  "the unassigned section must always be routed to the right-column class"
);

assert(
  pochipochiSource.includes(
    'const PANORAMA_SELECTOR = ".location-preview__panorama"'
  ),
  "pochi-pochi mode must watch the supplied panorama DOM"
);
assert(
  pochipochiSource.includes('const MAP_SELECTOR = ".map-embed"'),
  "pochi-pochi mode must capture clicks from the supplied map DOM"
);
assert(
  pochipochiSource.includes("deleteButton.click()"),
  "pochi-pochi mode must fire the site's delete button before map click propagation"
);
assert(
  pochipochiSource.includes("panoramaRemoved"),
  "disappearing Street View DOM must be detected"
);
assert(
  pochipochiSource.includes("!document.querySelector(PANORAMA_SELECTOR)"),
  "panorama replacement must not be mistaken for closing Street View"
);
assert(
  pochipochiSource.includes("protectLocation(currentLocation)"),
  "closing Street View must protect the current location"
);
assert(
  pochipochiSource.includes(
    'document.addEventListener("click", handleLocationDelete, true)'
  ),
  "Delete must be excluded from Street View close protection"
);
assert(
  pochipochiSource.includes("transientLocationKey === visibleLocation.key"),
  "turning the mode off must delete only the final newly selected location"
);
assert(
  pochipochiSource.includes("mapEditor.getLocationsInBBox(bounds)"),
  "all loaded locations must be protected before enabling pochi-pochi mode"
);
assert(
  pochipochiSource.includes("!protectExistingLocations()"),
  "pochi-pochi mode must fail closed when existing locations cannot be enumerated"
);
assert(
  /const INFO_URL =\s*"https:\/\/app\.geoguessr-waiwai\.workers\.dev\/map-making-app-tools\/"/.test(
    pochipochiSource
  ),
  "the info icon must link to the product landing page"
);
assert(
  pochipochiSource.includes('infoLink.target = "_blank"'),
  "the info link must open in a new tab"
);
assert(
  pochipochiSource.includes('infoLink.rel = "noopener noreferrer"'),
  "the new-tab info link must isolate its opener"
);
assert(
  pochipochiBridgeSource.includes("getPochipochiSettings(url)"),
  "URL defaults must be read from extension-local storage"
);
assert(
  pochipochiBridgeSource.includes("chrome.storage.local.set"),
  "URL defaults must be saved to extension-local storage"
);
assert(
  resizeSource.includes("resizeFeatureEnabled &&"),
  "the screen width feature must be independently configurable"
);
assert(
  resizeSource.includes('"mma-resize-feature-enabled"'),
  "resize-only CSS must be gated by a document class"
);
assert(
  resizeStyles.includes("html.mma-resize-feature-enabled .page-map-editor"),
  "screen layout CSS must be inactive when resizing is disabled"
);
assert(
  pochipochiBridgeSource.includes("POCHIPOCHI_DEFAULT_KEY"),
  "the global Pochi-pochi default must be supported"
);
assert(
  pochipochiBridgeSource.includes("hasUrlSetting"),
  "the per-URL Pochi-pochi setting must override the global default"
);
assert(
  pochipochiSource.includes("let pochiFeatureEnabled = false"),
  "Pochi-pochi controls must wait for the stored feature setting"
);
assert(
  pochipochiSource.includes("INITIALIZATION_MAX_ATTEMPTS = 40"),
  "stored automatic ON must wait for the editor location index"
);
assert(
  pochipochiSource.includes("retryStoredModeEnable"),
  "stored automatic ON must retry after editor initialization"
);
assert(
  pochipochiSource.includes("setModeEnabled(true, false)"),
  "automatic ON retries must not show a premature error state"
);
assert(
  pochipochiSource.includes('control.dataset.initializing = "true"'),
  "Pochi-pochi controls must remain hidden during automatic initialization"
);
assert(
  pochipochiStyles.includes(
    '.mma-pochipochi-control[data-initializing="true"]'
  ),
  "initializing Pochi-pochi controls must not be rendered"
);
assert(
  optionsHtml.includes('id="resize-enabled"'),
  "the options page must show the screen width switch"
);
assert(
  optionsHtml.includes('id="pochipochi-enabled"'),
  "the options page must show the Pochi-pochi feature switch"
);
assert(
  optionsHtml.includes('id="pochipochi-default-enabled"'),
  "the options page must show the Pochi-pochi default switch"
);
assert(
  optionsHtml.includes('id="map-list-enabled"'),
  "the options page must show the folder view switch"
);
assert(
  optionsHtml.includes('id="map-list-new-tab"'),
  "the options page must show the open-in-new-tab switch"
);
assert(
  optionsHtml.includes('id="url-settings-search"'),
  "the options page must provide partial URL search"
);
assert(
  optionsHtml.includes('id="url-settings-list"'),
  "the options page must list per-URL settings"
);
assert(
  optionsHtml.includes('id="url-settings-delete-all"'),
  "the options page must provide bulk deletion for per-URL settings"
);
assert(
  optionsHtml.includes('id="delete-all-dialog"'),
  "bulk deletion must require a confirmation dialog"
);
assert(
  optionsSource.includes("url.toLocaleLowerCase().includes(query)"),
  "URL search must use case-insensitive partial matching"
);
assert(
  optionsSource.includes("chrome.storage.local.remove(keys)"),
  "confirmed bulk deletion must remove every per-URL key"
);
assert(
  /\.url-settings-list\s*\{[^}]*max-height:\s*320px[^}]*overflow-y:\s*auto/s.test(
    optionsStyles
  ),
  "the per-URL list must use a bounded scroll area"
);
assert(
  optionsSource.includes('key: "mma-feature-screen-resize-enabled"'),
  "the options page must control screen width adjustment"
);
assert(
  optionsSource.includes('key: "mma-feature-pochipochi-enabled"'),
  "the options page must control Pochi-pochi mode"
);
assert(
  optionsSource.includes('key: "mma-pochipochi-default-enabled"'),
  "the options page must control the global Pochi-pochi default"
);
assert(
  optionsSource.includes('key: "mma-feature-map-list-enabled"'),
  "the options page must control the folder view feature"
);
assert(
  optionsSource.includes('key: "mma-map-list-new-tab-enabled"'),
  "the options page must control whether map links open in a new tab"
);
assert(
  optionsHtml.includes('id="language"') &&
    optionsSource.includes('LANGUAGE_KEY = "mma-language"'),
  "the options page must offer the language switch"
);
assert(
  mapListSource.includes("createLanguageSwitch"),
  "the folder view footer must offer the language switch"
);
assert(
  mapListSource.includes("defaultLanguage") &&
    optionsSource.includes("defaultLanguage"),
  "an unset language must fall back to the browser language (Japanese browsers get Japanese, everyone else English)"
);
assert(
  mapListSource.includes("MESSAGES = {") && mapListSource.includes("en: {"),
  "the folder view must ship Japanese and English strings"
);

// t("key")とdata-i18n="key"で使う文言が、日本語・英語の両方に定義されているか確認する。
// フォーマッタが長い文字列を次の行へ折り返すことがあるため、コロンの後ろは同じ行に限定しない。
for (const key of new Set(
  [...mapListSource.matchAll(/\bt\("(\w+)"/g)].map((match) => match[1])
)) {
  const defined = [...mapListSource.matchAll(new RegExp(`\\n {6}${key}:`, "g"))]
    .length;
  assert(
    defined >= 2,
    `the folder view must define "${key}" in both the Japanese and English message tables`
  );
}
for (const key of new Set(
  [...optionsHtml.matchAll(/data-i18n(?:-placeholder)?="(\w+)"/g)].map(
    (match) => match[1]
  )
)) {
  const defined = [...optionsSource.matchAll(new RegExp(`\\n {6}${key}:`, "g"))]
    .length;
  assert(
    defined >= 2,
    `the options page must define "${key}" in both the Japanese and English message tables`
  );
}
assert(
  mapListSource.includes("NEW_TAB_KEY") &&
    mapListSource.includes('link.target = "_blank"'),
  "map cards must open in a new tab when the setting is on"
);
assert(
  pochipochiBridgeSource.includes("SETTINGS_READY_EVENT"),
  "the isolated-world storage bridge must announce when it is ready"
);
assert(
  pochipochiSource.includes("SETTINGS_READY_EVENT, requestStoredSetting"),
  "the MAIN-world control must retry after the storage bridge is ready"
);
assert(
  pochipochiSource.includes("requestStoredSetting()"),
  "the saved URL default must be requested when the control mounts"
);
assert(
  pochipochiSource.includes(
    'document.addEventListener("click", handleMapClick, true)'
  ),
  "map clicks must be handled in the capture phase"
);
assert(
  pochipochiSource.includes("const DRAG_THRESHOLD_PX = 6"),
  "map drags must use an explicit movement threshold"
);
assert(
  pochipochiSource.includes(
    'document.addEventListener("pointermove", handleMapPointerMove, true)'
  ),
  "map pointer movement must be tracked in the capture phase"
);
assert(
  pochipochiSource.includes("if (skipNextMapClick)"),
  "the click following a map drag must skip deletion"
);
assert(
  !pochipochiSource.includes("stopPropagation"),
  "pochi-pochi mode must not stop the site's map click propagation"
);
assert(
  !pochipochiSource.includes("preventDefault"),
  "pochi-pochi mode must not cancel the site's map click"
);
assert(
  pochipochiSource.includes('label.textContent = "ぽちぽちモード"'),
  "pochi-pochi mode toggle must keep its requested label"
);
assert(
  pochipochiStyles.includes("top: 7px"),
  "pochi-pochi mode must be positioned 7px from the top"
);

console.log(`Validation passed for version ${manifest.version}.`);
