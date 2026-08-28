import fs from "node:fs";
import vm from "node:vm";

const REQUIRED_EXTENSION_FILES = [
  "manifest.json",
  "content.js",
  "page.js",
  "map-list.js",
  "content.css",
  "map-list.css",
  "options.html",
  "options.css",
  "options.js",
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

const makefileSource = fs.readFileSync("Makefile", "utf8");
const sourcesMatch = makefileSource.match(/^SOURCES := (.+)$/m);
assert(sourcesMatch, "Makefile must define a SOURCES variable listing the packaged files");
const packagedSources = sourcesMatch[1].split(/\s+/);
for (const path of REQUIRED_EXTENSION_FILES) {
  assert(packagedSources.includes(path), `Makefile SOURCES must include ${path} so it ships in the packaged extension`);
}

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
assert(manifest.manifest_version === 3, "manifest_version must be 3");
assert(/^\d+\.\d+\.\d+$/.test(manifest.version), "manifest version must use MAJOR.MINOR.PATCH");
assert(manifest.version === "1.4.0", "the release package must remain version 1.4.0");
assert(JSON.stringify(manifest.permissions) === JSON.stringify(["storage"]), "only the storage permission is allowed");
assert(manifest.options_ui?.page === "options.html", "the extension management page must link to options.html");
assert(manifest.options_ui?.open_in_tab === true, "the options page must open in a full tab");
assert(!Object.hasOwn(manifest, "host_permissions") || manifest.host_permissions.length === 0, "host_permissions must remain empty");
assert(Array.isArray(manifest.content_scripts) && manifest.content_scripts.length === 3, "exactly three content script definitions are required");

const [contentScript, pageScript, mapListScript] = manifest.content_scripts;
assert(JSON.stringify(contentScript.matches) === JSON.stringify(["https://map-making.app/maps/*"]), "content script matches must remain limited to Map Making App map paths");
assert(JSON.stringify(contentScript.js) === JSON.stringify(["content.js"]), "content script entry point must be content.js");
assert(JSON.stringify(contentScript.css) === JSON.stringify(["content.css"]), "content stylesheet must be content.css");
assert(contentScript.run_at === "document_idle", "content script must run at document_idle");
assert(JSON.stringify(pageScript.matches) === JSON.stringify(["https://map-making.app/maps/*"]), "MAIN world script matches must remain limited to Map Making App map paths");
assert(JSON.stringify(pageScript.js) === JSON.stringify(["page.js"]), "MAIN world script entry point must be page.js");
assert(pageScript.run_at === "document_idle", "MAIN world script must run at document_idle");
assert(pageScript.world === "MAIN", "page.js must run in MAIN world to use the editor's location API");
assert(JSON.stringify(mapListScript.matches) === JSON.stringify(["https://map-making.app/"]), "the top page content script must remain limited to the map list page");
assert(JSON.stringify(mapListScript.js) === JSON.stringify(["map-list.js"]), "top page content script entry point must be map-list.js");
assert(JSON.stringify(mapListScript.css) === JSON.stringify(["map-list.css"]), "top page content stylesheet must be map-list.css");
assert(mapListScript.run_at === "document_start", "the top page script must run at document_start so the native list never flashes before the folder view");
assert(!Object.hasOwn(mapListScript, "world"), "map-list.js must run in the isolated world");

for (const path of Object.values(manifest.icons ?? {})) {
  assert(fs.existsSync(path), `Missing icon referenced by manifest: ${path}`);
}

const contentSource = fs.readFileSync("content.js", "utf8");
const pageSource = fs.readFileSync("page.js", "utf8");
const mapListSource = fs.readFileSync("map-list.js", "utf8");
const contentStyles = fs.readFileSync("content.css", "utf8");
const mapListStyles = fs.readFileSync("map-list.css", "utf8");
const optionsHtml = fs.readFileSync("options.html", "utf8");
const optionsStyles = fs.readFileSync("options.css", "utf8");
const optionsSource = fs.readFileSync("options.js", "utf8");
new vm.Script(contentSource, { filename: "content.js" });
new vm.Script(pageSource, { filename: "page.js" });
new vm.Script(mapListSource, { filename: "map-list.js" });
new vm.Script(optionsSource, { filename: "options.js" });

assert(contentSource.includes("/^\\/maps\\/\\d+\\/?$/"), "runtime path check must remain limited to numeric map IDs");
assert(contentSource.includes('const MIN_PERCENT = 25'), "minimum screen width must remain 25%");
assert(contentSource.includes('const MAX_PERCENT = 75'), "maximum screen width must remain 75%");
assert(!contentSource.includes('handle.addEventListener("keydown"'), "the resize handle must not register keyboard controls");
assert(!contentSource.includes("handle.tabIndex"), "the pointer-only resize handle must not enter the tab order");
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
assert(
  contentSource.includes('const MAP_IMPORT_BREAKPOINT_PX = 500'),
  "map import visibility must use the 500px breakpoint"
);
assert(
  contentSource.includes('width < MAP_IMPORT_BREAKPOINT_PX'),
  "map import must only be hidden below the breakpoint"
);
assert(
  /\.page-map-editor\.mma-narrow-map\s+\.map-meta__import\s*\{[^}]*display:\s*none/s.test(contentStyles),
  "map import must be hidden while the map is narrow"
);
assert(
  contentSource.includes('const MAP_TOTAL_BREAKPOINT_PX = 300'),
  "map total visibility must use the 300px breakpoint"
);
assert(
  contentSource.includes('width < MAP_TOTAL_BREAKPOINT_PX'),
  "map total must only be hidden below the breakpoint"
);
assert(
  /\.page-map-editor\.mma-compact-map\s+\.map-meta__total\s*\{[^}]*display:\s*none/s.test(contentStyles),
  "map total must be hidden while the map is compact"
);
assert(
  contentSource.includes('const MAP_COUNT_SELECTOR = ".map-meta__count"'),
  "map count must be detected using the supplied selector"
);
assert(
  contentSource.includes('const MAP_COUNT_BREAKPOINT_OFFSET_PX = 60'),
  "map count must increase responsive breakpoints by 60px"
);
assert(
  contentSource.includes('MAP_IMPORT_BREAKPOINT_PX + breakpointOffset') &&
    contentSource.includes('MAP_TOTAL_BREAKPOINT_PX + breakpointOffset'),
  "map count breakpoint offset must apply to both map metadata controls"
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
  assert(!pattern.test(pageSource), `page.js must not use ${name}`);
  assert(!pattern.test(mapListSource), `map-list.js must not use ${name}`);
  assert(!pattern.test(optionsSource), `options.js must not use ${name}`);
}

assert(mapListSource.includes("const TARGET_PATH = /^\\/$/"), "the top page runtime path check must remain limited to the exact map list path");
assert(mapListSource.includes('const NATIVE_LIST_SELECTOR = \'[data-replace="InteractiveMapList"]\''), "the folder view must attach only to the site's own map list container");
assert(mapListSource.includes("HEADINGS_KEY"), "folder definitions must be namespaced in extension storage");
assert(mapListSource.includes("BOOTING_CLASS") && mapListStyles.includes(".mma-map-list-booting"), "the native list must stay hidden until the folder view has rendered");
assert(mapListSource.includes('document.readyState !== "loading"'), "attaching must wait for the parsed document so the #data block and updates section are available");
assert(mapListSource.includes("FAVORITES_KEY"), "favorites must be namespaced in extension storage");
assert(mapListSource.includes("COUNTRIES_KEY"), "country chips must be namespaced in extension storage");
assert(mapListSource.includes("TAGS_KEY"), "map tags must be namespaced in extension storage");
assert(mapListSource.includes("findNativeEditButton"), "edit/delete must be delegated to the site's own settings dialog");
assert(mapListSource.includes('findNativeActionButton("New map")'), "new map creation must be delegated to the site's own button");
assert(mapListSource.includes("mma-map-list__native-hidden"), "the native list must only be hidden visually, not removed");
assert(mapListStyles.includes(".mma-map-list__native-hidden"), "the native-hidden class must be defined in map-list.css");
assert(mapListSource.includes('const UPDATES_SECTION_SELECTOR = "section.updates"'), "the footer must be built from the site's own updates section");
assert(mapListSource.includes("attachFooter"), "the footer (Updates toggle, CTAs, logout links, credit) must be assembled on attach");
assert(mapListSource.includes("movedFooterNodes"), "nodes moved into the footer must be tracked so they can be restored on detach");
assert(mapListSource.includes("openUpdatesPopup"), "the collapsed Updates changelog must be viewable again through a popup");
assert(mapListSource.includes("detachFooter"), "the footer must be reverted (native nodes restored) on detach");
assert(
  /viewMode === "native"\) \{[\s\S]{0,120}detachFooter\(\)/.test(mapListSource),
  "switching to the native view must fully restore the footer, not just unhide the native map list"
);
assert(mapListSource.includes('".updates__version"') && mapListSource.includes(".ctas"), "the footer must include the ReAnna credit line and the manual/Discord CTAs");
assert(mapListStyles.includes(".mma-map-list__footer"), "the footer must have its own layout styling");
assert(
  mapListStyles.includes(".page-map-list:has(section.updates.mma-map-list-updates-hidden)"),
  "the Your Maps column must reclaim the width freed up by collapsing the native Updates column"
);
assert(mapListStyles.includes("flex: 1 1 100px") && mapListStyles.includes("min-width: 0"), "map card titles must be able to shrink and ellipsize instead of overflowing narrow columns");
assert(mapListSource.includes("document.body.append(footerEl)"), "the footer must attach to the end of the page, not a width-constrained container");
assert(mapListStyles.includes(".mma-map-list__board") && mapListStyles.includes("grid-template-columns: 1fr 1fr"), "folder sections must be arranged in a two-column grid");
assert(mapListStyles.includes(".mma-map-list__section--right"), "the unassigned section must be pinned to the right column of the folder grid");
assert(mapListSource.includes('unassignedSection.classList.add("mma-map-list__section--right")'), "the unassigned section must always be routed to the right-column class");

assert(pageSource.includes('const PANORAMA_SELECTOR = ".location-preview__panorama"'), "pochi-pochi mode must watch the supplied panorama DOM");
assert(pageSource.includes('const MAP_SELECTOR = ".map-embed"'), "pochi-pochi mode must capture clicks from the supplied map DOM");
assert(pageSource.includes("deleteButton.click()"), "pochi-pochi mode must fire the site's delete button before map click propagation");
assert(pageSource.includes("panoramaRemoved"), "disappearing Street View DOM must be detected");
assert(pageSource.includes("!document.querySelector(PANORAMA_SELECTOR)"), "panorama replacement must not be mistaken for closing Street View");
assert(pageSource.includes("protectLocation(currentLocation)"), "closing Street View must protect the current location");
assert(pageSource.includes('document.addEventListener("click", handleLocationDelete, true)'), "Delete must be excluded from Street View close protection");
assert(pageSource.includes("transientLocationKey === visibleLocation.key"), "turning the mode off must delete only the final newly selected location");
assert(pageSource.includes("mapEditor.getLocationsInBBox(bounds)"), "all loaded locations must be protected before enabling pochi-pochi mode");
assert(pageSource.includes("!protectExistingLocations()"), "pochi-pochi mode must fail closed when existing locations cannot be enumerated");
assert(pageSource.includes('const INFO_URL = "https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/"'), "the info icon must link to the product landing page");
assert(pageSource.includes('infoLink.target = "_blank"'), "the info link must open in a new tab");
assert(pageSource.includes('infoLink.rel = "noopener noreferrer"'), "the new-tab info link must isolate its opener");
assert(contentSource.includes("getPochipochiSettings(url)"), "URL defaults must be read from extension-local storage");
assert(contentSource.includes("chrome.storage.local.set"), "URL defaults must be saved to extension-local storage");
assert(contentSource.includes("resizeFeatureEnabled &&"), "the screen width feature must be independently configurable");
assert(contentSource.includes('"mma-resize-feature-enabled"'), "resize-only CSS must be gated by a document class");
assert(contentStyles.includes("html.mma-resize-feature-enabled .page-map-editor"), "screen layout CSS must be inactive when resizing is disabled");
assert(contentSource.includes("POCHIPOCHI_DEFAULT_KEY"), "the global Pochi-pochi default must be supported");
assert(contentSource.includes("hasUrlSetting"), "the per-URL Pochi-pochi setting must override the global default");
assert(pageSource.includes("let pochiFeatureEnabled = false"), "Pochi-pochi controls must wait for the stored feature setting");
assert(pageSource.includes("INITIALIZATION_MAX_ATTEMPTS = 40"), "stored automatic ON must wait for the editor location index");
assert(pageSource.includes("retryStoredModeEnable"), "stored automatic ON must retry after editor initialization");
assert(pageSource.includes("setModeEnabled(true, false)"), "automatic ON retries must not show a premature error state");
assert(pageSource.includes('control.dataset.initializing = "true"'), "Pochi-pochi controls must remain hidden during automatic initialization");
assert(contentStyles.includes('.mma-pochipochi-control[data-initializing="true"]'), "initializing Pochi-pochi controls must not be rendered");
assert(optionsHtml.includes('id="resize-enabled"'), "the options page must show the screen width switch");
assert(optionsHtml.includes('id="pochipochi-enabled"'), "the options page must show the Pochi-pochi feature switch");
assert(optionsHtml.includes('id="pochipochi-default-enabled"'), "the options page must show the Pochi-pochi default switch");
assert(optionsHtml.includes('id="map-list-enabled"'), "the options page must show the folder view switch");
assert(optionsHtml.includes('id="map-list-new-tab"'), "the options page must show the open-in-new-tab switch");
assert(optionsHtml.includes('id="url-settings-search"'), "the options page must provide partial URL search");
assert(optionsHtml.includes('id="url-settings-list"'), "the options page must list per-URL settings");
assert(optionsHtml.includes('id="url-settings-delete-all"'), "the options page must provide bulk deletion for per-URL settings");
assert(optionsHtml.includes('id="delete-all-dialog"'), "bulk deletion must require a confirmation dialog");
assert(optionsSource.includes("url.toLocaleLowerCase().includes(query)"), "URL search must use case-insensitive partial matching");
assert(optionsSource.includes("chrome.storage.local.remove(keys)"), "confirmed bulk deletion must remove every per-URL key");
assert(/\.url-settings-list\s*\{[^}]*max-height:\s*320px[^}]*overflow-y:\s*auto/s.test(optionsStyles), "the per-URL list must use a bounded scroll area");
assert(optionsSource.includes('key: "mma-feature-screen-resize-enabled"'), "the options page must control screen width adjustment");
assert(optionsSource.includes('key: "mma-feature-pochipochi-enabled"'), "the options page must control Pochi-pochi mode");
assert(optionsSource.includes('key: "mma-pochipochi-default-enabled"'), "the options page must control the global Pochi-pochi default");
assert(optionsSource.includes('key: "mma-feature-map-list-enabled"'), "the options page must control the folder view feature");
assert(optionsSource.includes('key: "mma-map-list-new-tab-enabled"'), "the options page must control whether map links open in a new tab");
assert(
  mapListSource.includes("NEW_TAB_KEY") && mapListSource.includes('link.target = "_blank"'),
  "map cards must open in a new tab when the setting is on"
);
assert(contentSource.includes("SETTINGS_READY_EVENT"), "the isolated-world storage bridge must announce when it is ready");
assert(pageSource.includes("SETTINGS_READY_EVENT, requestStoredSetting"), "the MAIN-world control must retry after the storage bridge is ready");
assert(pageSource.includes("requestStoredSetting()"), "the saved URL default must be requested when the control mounts");
assert(pageSource.includes('document.addEventListener("click", handleMapClick, true)'), "map clicks must be handled in the capture phase");
assert(pageSource.includes("const DRAG_THRESHOLD_PX = 6"), "map drags must use an explicit movement threshold");
assert(pageSource.includes('document.addEventListener("pointermove", handleMapPointerMove, true)'), "map pointer movement must be tracked in the capture phase");
assert(pageSource.includes("if (skipNextMapClick)"), "the click following a map drag must skip deletion");
assert(!pageSource.includes("stopPropagation"), "pochi-pochi mode must not stop the site's map click propagation");
assert(!pageSource.includes("preventDefault"), "pochi-pochi mode must not cancel the site's map click");
assert(pageSource.includes('label.textContent = "ぽちぽちモード"'), "pochi-pochi mode toggle must keep its requested label");
assert(contentStyles.includes("top: 7px"), "pochi-pochi mode must be positioned 7px from the top");

console.log(`Validation passed for version ${manifest.version}.`);
