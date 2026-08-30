(() => {
  "use strict";

  const TARGET_PATH = /^\/$/;
  const NATIVE_LIST_SELECTOR = '[data-replace="InteractiveMapList"]';
  const UPDATES_SECTION_SELECTOR = "section.updates";
  const UPDATES_HIDDEN_CLASS = "mma-map-list-updates-hidden";
  const BOOTING_CLASS = "mma-map-list-booting";
  // 設定の読み込みが終わらない・一覧が見つからないときに、ページを隠したままにしないための保険。
  const BOOTING_TIMEOUT_MS = 2000;
  const FEATURE_KEY = "mma-feature-map-list-enabled";
  const VIEW_MODE_KEY = "mma-map-list-view-mode";
  const NEW_TAB_KEY = "mma-map-list-new-tab-enabled";
  const LANGUAGE_KEY = "mma-language";
  const HEADINGS_KEY = "mma-map-list-headings";
  const FAVORITES_KEY = "mma-map-list-favorites";
  const COUNTRIES_KEY = "mma-map-list-countries";
  const TAGS_KEY = "mma-map-list-tags";
  const SHOW_LOCATION_COUNT_KEY = "mma-map-list-show-location-count";
  const SHOW_COUNTRY_KEY = "mma-map-list-show-country";
  const PENDING_HEADING_KEY = "mma-map-list-pending-new-map-heading";
  const UNASSIGNED_ID = "__unassigned__";
  const FAVORITES_ID = "__favorites__";
  const LABEL_MAX_LENGTH = 24;
  const PRODUCT_URL = "https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/";
  // 案内サイトは言語ごとにページが分かれているため、英語表示のときは英語ページへ送る。
  const PRODUCT_URL_EN = "https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/en/";
  // フッターの左右スロットは、ネイティブのノードの文言だけを見て振り分ける。
  const ACCOUNT_TEXT_PATTERN = /log\s*out|sign\s*out|user\s*settings/i;
  const CREDIT_TEXT_PATTERN = /version|reanna|©/i;
  const FOOTER_ICONS = [
    { pattern: /manual|マニュアル/i, icon: "📘" },
    { pattern: /discord/i, icon: "💬" }
  ];
  const TAG_PALETTE = [
    "#f87171", "#fb923c", "#fbbf24", "#a3e635", "#34d399",
    "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6", "#94a3b8"
  ];
  const PRESET_HEADINGS = {
    ja: [
      "🌏 アジア", "🌏 中央アジア", "🌍 ヨーロッパ", "🌍 アフリカ",
      "🌎 北アメリカ", "🌎 中南米", "🌎 南アメリカ", "🌏 オセアニア"
    ],
    en: [
      "🌏 Asia", "🌏 Central Asia", "🌍 Europe", "🌍 Africa",
      "🌎 North America", "🌎 Latin America", "🌎 South America", "🌏 Oceania"
    ]
  };
  // 表示言語はフッターと拡張機能のオプションから切り替える。ブラウザのUI言語には追従しない。
  const MESSAGES = {
    ja: {
      cancel: "キャンセル",
      save: "保存",
      close: "閉じる",
      delete: "削除",
      folderFallback: "フォルダ",
      folderNameLabel: "フォルダ名（絵文字も入力できます・{max}文字まで）",
      folderAdd: "フォルダを追加",
      folderRename: "フォルダ名を変更",
      folderDeleteTitle: "フォルダを削除しますか？",
      folderDeleteMessage: "「{label}」を削除します。含まれていたマップは未分類に移動します。",
      folderAddMap: "このフォルダに新しいマップを作成",
      folderDelete: "フォルダを削除",
      countryTitle: "{name} の国チップ",
      countrySearchLabel: "国を検索",
      countrySearchPlaceholder: "国名の一部を入力",
      countryClear: "未設定にする",
      countrySelect: "国を選択",
      countryChange: "{name}（クリックで変更）",
      tagsEmpty: "まだタグがありません。下の欄から作成できます。",
      tagsNewLabel: "新しいタグ名",
      tagsCreate: "＋ タグを作成",
      favoriteAdd: "お気に入りにマーク",
      favoriteRemove: "お気に入りのマークを外す",
      favoriteMarked: "お気に入り",
      cardMenu: "その他の操作",
      menuEdit: "編集する",
      menuDelete: "削除する",
      sectionFavorites: "★ お気に入り",
      sectionUnassigned: "未分類",
      cardsEmpty: "ここにマップをドラッグ、またはカードの「⋯」→「編集する」から追加できます",
      searchPlaceholder: "マップを検索…",
      newMap: "＋ 新しいマップ",
      createMapTitle: "新しいマップを作成",
      createMapNameLabel: "マップ名",
      createMapFolderLabel: "フォルダ",
      createMapSubmit: "作成",
      editMapTitle: "マップを編集",
      editMapTagsLabel: "タグ",
      deleteMapTitle: "マップを削除しますか？",
      deleteMapMessage: "「{name}」を削除します。",
      deleteMapWarning: "この操作は取り消せません。削除後は一覧に表示されなくなります。",
      addFolder: "＋ フォルダを追加",
      switchToFolders: "フォルダビューに切り替える",
      switchToNative: "以前の表示に切り替える",
      footnote: "このUIは拡張機能によって変更されています。 ",
      footnoteLink: "詳しくはこちら",
      updatesTitle: "更新情報（Updates）をポップアップで見る",
      locations: "{count} locs"
    },
    en: {
      cancel: "Cancel",
      save: "Save",
      close: "Close",
      delete: "Delete",
      folderFallback: "Folder",
      folderNameLabel: "Folder name (emoji allowed, up to {max} characters)",
      folderAdd: "Add a folder",
      folderRename: "Rename folder",
      folderDeleteTitle: "Delete this folder?",
      folderDeleteMessage: "“{label}” will be deleted. The maps inside move to Unsorted.",
      folderAddMap: "Create a new map in this folder",
      folderDelete: "Delete folder",
      countryTitle: "Country chip for {name}",
      countrySearchLabel: "Search countries",
      countrySearchPlaceholder: "Type part of a country name",
      countryClear: "Clear",
      countrySelect: "Choose a country",
      countryChange: "{name} (click to change)",
      tagsEmpty: "No tags yet. Create one in the field below.",
      tagsNewLabel: "New tag name",
      tagsCreate: "+ Create tag",
      favoriteAdd: "Mark as favourite",
      favoriteRemove: "Remove favourite mark",
      favoriteMarked: "Favourite",
      cardMenu: "More actions",
      menuEdit: "Edit",
      menuDelete: "Delete",
      sectionFavorites: "★ Favourites",
      sectionUnassigned: "Unsorted",
      cardsEmpty: "Drag maps here, or add them with “⋯” → “Edit” on a card",
      searchPlaceholder: "Search maps…",
      newMap: "+ New map",
      createMapTitle: "Create a new map",
      createMapNameLabel: "Map name",
      createMapFolderLabel: "Folder",
      createMapSubmit: "Create",
      editMapTitle: "Edit map",
      editMapTagsLabel: "Tags",
      deleteMapTitle: "Delete this map?",
      deleteMapMessage: "“{name}” will be deleted.",
      deleteMapWarning: "This can't be undone. Once deleted, it will no longer appear in the list.",
      addFolder: "+ Add folder",
      switchToFolders: "Switch to the folder view",
      switchToNative: "Switch back to the original view",
      footnote: "This page is modified by a browser extension. ",
      footnoteLink: "Learn more",
      updatesTitle: "Open the changelog in a popup",
      locations: "{count} locs"
    }
  };
  const REGION_CODES = [
    "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
    "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS",
    "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN",
    "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE",
    "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF",
    "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM",
    "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM",
    "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC",
    "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK",
    "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA",
    "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG",
    "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW",
    "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS",
    "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO",
    "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI",
    "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW"
  ];

  let featureEnabled = true;
  let openInNewTab = true;
  let showLocationCount = true;
  let showCountry = true;
  let language = "en";
  let settingsLoaded = false;
  let contextInvalidated = false;
  let bootingTimer = null;

  let nativeListEl = null;
  let nativeListObserver = null;
  let refreshTimer = null;
  let root = null;
  let updatesSectionEl = null;
  let updatesToggleButton = null;
  let footerEl = null;
  let movedFooterNodes = [];
  let injectedFooterIcons = [];

  let mapsById = new Map();
  let headingsData = null;
  let favorites = null;
  let countries = null;
  let tagsData = null;
  let viewMode = "custom";
  let searchQuery = "";
  let pendingNewMapHeadingId = null;
  let draggingSectionId = null;
  let draggingCard = null;
  let cardMenuState = null;
  let searchInputEl = null;
  let boardEl = null;
  let searchRenderTimer = null;

  let regionNames = null;
  try {
    regionNames = new Intl.DisplayNames([localeTag()], { type: "region" });
  } catch {
    regionNames = null;
  }

  let regionNamesEn = null;
  try {
    regionNamesEn = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    regionNamesEn = null;
  }

  let regionNamesJa = null;
  try {
    regionNamesJa = new Intl.DisplayNames(["ja-JP"], { type: "region" });
  } catch {
    regionNamesJa = null;
  }

  /** 言語を切り替えたら、国名表示も同じ言語で作り直す。 */
  function refreshRegionNames() {
    try {
      regionNames = new Intl.DisplayNames([localeTag()], { type: "region" });
    } catch {
      regionNames = null;
    }
  }

  /**
   * 保存された言語がなければ、ブラウザの言語設定から決める（日本語なら日本語、それ以外は英語）。
   * 自動判定の結果は保存しない。ユーザーが明示的に選んだときだけmma-languageへ書き込む。
   */
  function defaultLanguage() {
    const candidates = [];
    try {
      candidates.push(chrome.i18n?.getUILanguage?.() ?? "");
    } catch {
      // 拡張機能のコンテキストが失われている場合はnavigatorだけで判定する。
    }
    candidates.push(...(navigator.languages ?? []), navigator.language ?? "");
    return candidates.some((tag) => /^ja\b/i.test(tag)) ? "ja" : "en";
  }

  function normalizeLanguage(value) {
    if (value === "ja" || value === "en") {
      return value;
    }
    return defaultLanguage();
  }

  /** 表示言語の文言を取り出す。{name}形式のプレースホルダーだけを差し替える。 */
  function t(key, params) {
    const template = MESSAGES[language]?.[key] ?? MESSAGES.ja[key] ?? key;
    if (!params) {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
  }

  function localeTag() {
    return language === "en" ? "en" : "ja-JP";
  }

  function isContextInvalidatedError(error) {
    return error instanceof Error && /Extension context invalidated/.test(error.message);
  }

  function handleContextInvalidated() {
    if (contextInvalidated) {
      return;
    }

    contextInvalidated = true;
    mutationObserver.disconnect();
    detach();
    clearBooting();
  }

  function flagFromCode(code) {
    return Array.from(code.toUpperCase())
      .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
      .join("");
  }

  function nameForCode(code) {
    try {
      return regionNames ? regionNames.of(code) : code;
    } catch {
      return code;
    }
  }

  function nameForCodeUsing(code, displayNames) {
    try {
      return displayNames ? displayNames.of(code) : code;
    } catch {
      return code;
    }
  }

  function countGraphemes(text) {
    return Array.from(text).length;
  }

  /* ---------- 保存・読み込み ---------- */

  function persistKey(key, value) {
    if (contextInvalidated) {
      return;
    }

    try {
      chrome.storage.local.set({ [key]: value }).catch((error) => {
        if (isContextInvalidatedError(error)) {
          handleContextInvalidated();
        }
      });
    } catch (error) {
      if (isContextInvalidatedError(error)) {
        handleContextInvalidated();
      }
    }
  }

  function persistHeadings() {
    persistKey(HEADINGS_KEY, headingsData);
  }

  function persistFavorites() {
    persistKey(FAVORITES_KEY, favorites);
  }

  function persistCountries() {
    persistKey(COUNTRIES_KEY, countries);
  }

  function persistTags() {
    persistKey(TAGS_KEY, tagsData);
  }

  function persistViewMode() {
    persistKey(VIEW_MODE_KEY, viewMode);
  }

  function defaultHeadingsData() {
    return { initialized: false, headings: [], unassignedOrder: [] };
  }

  function defaultTagsData() {
    return { tags: [], mapTagIds: {} };
  }

  async function loadAllData() {
    try {
      const stored = await chrome.storage.local.get([
        HEADINGS_KEY,
        FAVORITES_KEY,
        COUNTRIES_KEY,
        TAGS_KEY,
        VIEW_MODE_KEY,
        NEW_TAB_KEY,
        SHOW_LOCATION_COUNT_KEY,
        SHOW_COUNTRY_KEY,
        LANGUAGE_KEY,
        PENDING_HEADING_KEY
      ]);

      const headings = stored[HEADINGS_KEY];
      headingsData =
        headings && Array.isArray(headings.headings) && Array.isArray(headings.unassignedOrder)
          ? {
              initialized: headings.initialized === true,
              headings: headings.headings
                .filter((h) => h && typeof h.id === "string" && typeof h.label === "string")
                .map((h) => ({
                  id: h.id,
                  label: h.label,
                  mapIds: Array.isArray(h.mapIds) ? h.mapIds.map(String) : []
                })),
              unassignedOrder: headings.unassignedOrder.map(String)
            }
          : defaultHeadingsData();

      const storedFavorites = stored[FAVORITES_KEY];
      favorites = storedFavorites && typeof storedFavorites === "object" ? { ...storedFavorites } : {};

      const storedCountries = stored[COUNTRIES_KEY];
      countries = storedCountries && typeof storedCountries === "object" ? { ...storedCountries } : {};

      const storedTags = stored[TAGS_KEY];
      tagsData =
        storedTags && Array.isArray(storedTags.tags) && storedTags.mapTagIds
          ? {
              tags: storedTags.tags
                .filter((t) => t && typeof t.id === "string" && typeof t.name === "string")
                .map((t) => ({ id: t.id, name: t.name, color: typeof t.color === "string" ? t.color : TAG_PALETTE[0] })),
              mapTagIds: Object.fromEntries(
                Object.entries(storedTags.mapTagIds).map(([id, tagIds]) => [
                  id,
                  Array.isArray(tagIds) ? tagIds.filter((tagId) => typeof tagId === "string") : []
                ])
              )
            }
          : defaultTagsData();

      viewMode = stored[VIEW_MODE_KEY] === "native" ? "native" : "custom";
      openInNewTab = stored[NEW_TAB_KEY] !== false;
      showLocationCount = stored[SHOW_LOCATION_COUNT_KEY] !== false;
      showCountry = stored[SHOW_COUNTRY_KEY] !== false;
      language = normalizeLanguage(stored[LANGUAGE_KEY]);
      refreshRegionNames();

      const storedPendingHeading = stored[PENDING_HEADING_KEY];
      pendingNewMapHeadingId = typeof storedPendingHeading === "string" ? storedPendingHeading : null;

      return true;
    } catch (error) {
      if (isContextInvalidatedError(error)) {
        handleContextInvalidated();
        return false;
      }

      headingsData = defaultHeadingsData();
      favorites = {};
      countries = {};
      tagsData = defaultTagsData();
      viewMode = "custom";
      openInNewTab = true;
      showLocationCount = true;
      showCountry = true;
      language = defaultLanguage();
      return true;
    }
  }

  /* ---------- ネイティブ一覧の読み取り ---------- */

  function readMapsFromJsonBlock() {
    const script = document.querySelector('script#data[type="application/json"]');
    if (!script) {
      return null;
    }

    try {
      const parsed = JSON.parse(script.textContent);
      if (!parsed || !Array.isArray(parsed.maps)) {
        return null;
      }

      const result = new Map();
      for (const entry of parsed.maps) {
        if (!entry || entry.storage !== "active" || entry.id === undefined || entry.id === null) {
          continue;
        }

        const id = String(entry.id);
        result.set(id, {
          id,
          name: typeof entry.name === "string" && entry.name ? entry.name : `(map ${id})`,
          locationCount: Number.isFinite(entry.locationCount) ? entry.locationCount : 0
        });
      }
      return result;
    } catch {
      return null;
    }
  }

  function readMapsFromDom() {
    const result = new Map();
    if (!nativeListEl) {
      return result;
    }

    for (const link of nativeListEl.querySelectorAll("a.map-link[href]")) {
      const match = link.getAttribute("href")?.match(/\/maps\/(\d+)/);
      if (!match) {
        continue;
      }

      const id = match[1];
      const name = link.textContent.trim() || `(map ${id})`;
      const li = link.closest("li.map-list__entry");
      const countMatch = li ? li.textContent.match(/([\d,]+)\s*locations?/i) : null;
      const locationCount = countMatch ? Number.parseInt(countMatch[1].replace(/,/g, ""), 10) || 0 : 0;
      result.set(id, { id, name, locationCount });
    }

    return result;
  }

  function computeMapsSnapshot() {
    const fromJson = readMapsFromJsonBlock();
    const fromDom = readMapsFromDom();
    if (!fromJson) {
      return fromDom;
    }

    // JSONブロックはフォルダ内のマップを含まないことがあるため、DOM側で見つかったが
    // JSONブロックに無いマップ（フォルダ内のマップなど）を補完する。
    for (const [id, map] of fromDom) {
      if (!fromJson.has(id)) {
        fromJson.set(id, map);
      }
    }
    return fromJson;
  }

  /** マップIDから、ネイティブ一覧内の対応する編集ボタン（設定ダイアログを開く✎）を探す。 */
  function findNativeEditButton(mapId) {
    if (!nativeListEl) {
      return null;
    }

    const link = nativeListEl.querySelector(`a.map-link[href*="/maps/${mapId}"]`);
    const li = link?.closest("li.map-list__entry");
    return li ? li.querySelector("button.map-list__edit") : null;
  }

  /**
   * ネイティブの✎ボタンが開く「Map settings」ダイアログ（React管理下）は、開いた瞬間だけ
   * DOMに現れる。拡張機能の独自モーダルの裏で名前変更・削除を代行するため、見た目には出さずに
   * このダイアログを開閉する。
   */
  function findNativeEditDialog() {
    return document.querySelector(".edit-map-modal");
  }

  /**
   * ダイアログ自体のclass/styleはReact側が保存・削除のたびに再レンダリングで上書きするため、
   * こちらでクラスを付け外しして隠そうとするとReactの再描画と際限なく競合し、
   * 相互に属性を書き換え続けてタブがフリーズする恐れがある。ネイティブ側のDOMには一切触れず、
   * 自分の独自モーダルと同じ最前面（z-index最大）の覆いを上から重ねるだけにする。
   */
  function coverNativeEditDialog() {
    const cover = document.createElement("div");
    cover.className = "mma-map-list-modal-overlay";
    document.body.append(cover);
    return () => cover.remove();
  }

  function closeNativeEditDialog(dialog, stopGuarding) {
    dialog?.closest('[role="dialog"]')?.querySelector(".modal__close")?.click();
    // 閉じるアニメーション中に覆いを外すと、それはそれで一瞬見えてしまうので少し待つ。
    window.setTimeout(() => stopGuarding?.(), 300);
  }

  /** ダイアログがDOM上に現れたタイミングを検知する（見た目は上の覆いで隠れているので速さは問わない）。 */
  function waitForNativeEditDialog(timeoutMs = 2000) {
    const existing = findNativeEditDialog();
    if (existing) {
      return Promise.resolve(existing);
    }
    return new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        const dialog = findNativeEditDialog();
        if (dialog) {
          observer.disconnect();
          window.clearTimeout(timer);
          resolve(dialog);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      const timer = window.setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeoutMs);
    });
  }

  async function revealNativeEditDialog(mapId) {
    const button = findNativeEditButton(mapId);
    if (!button) {
      return null;
    }
    // クリックする前から覆っておき、出現から検知までの間も一切見えないようにする。
    const stopGuarding = coverNativeEditDialog();
    const waiter = waitForNativeEditDialog();
    button.click();
    const dialog = await waiter;
    if (!dialog) {
      stopGuarding();
      return null;
    }
    return { dialog, stopGuarding };
  }

  /** Reactの管理下にある入力欄は`.value`の代入だけでは内部状態が更新されないため、ネイティブのsetterを使う。 */
  function setNativeInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  /** マップ名の変更を、ネイティブの設定ダイアログのフォーム送信に委譲する。 */
  async function renameMapViaNativeDialog(mapId, name) {
    const revealed = await revealNativeEditDialog(mapId);
    if (!revealed) {
      return false;
    }
    const { dialog, stopGuarding } = revealed;

    const input = dialog.querySelector(".edit-map-modal__rename input.input");
    const submitButton = dialog.querySelector('.edit-map-modal__rename button[type="submit"]');
    if (!input || !submitButton) {
      closeNativeEditDialog(dialog, stopGuarding);
      return false;
    }

    setNativeInputValue(input, name);
    submitButton.click();
    closeNativeEditDialog(dialog, stopGuarding);
    return true;
  }

  /**
   * 削除を、ネイティブの設定ダイアログの削除ボタンに委譲する。ボタンを押すとサイト側が
   * ブラウザ標準のconfirm()を出すため、実際にマップが消えるかはユーザーの最終確認に委ねられる。
   */
  async function deleteMapViaNativeDialog(mapId) {
    const revealed = await revealNativeEditDialog(mapId);
    if (!revealed) {
      return;
    }
    const { dialog, stopGuarding } = revealed;

    const deleteButton = dialog.querySelector(".edit-map-modal__delete button.button--destructive");
    deleteButton?.click();
    closeNativeEditDialog(dialog, stopGuarding);
  }

  /** ネイティブのフォルダ要素からフォルダ名を読み取る。マークアップの揺れに対応するため複数の方法を試す。 */
  function readNativeFolderLabel(folderEl) {
    const attrLabel = folderEl.getAttribute("data-folder")?.trim();
    if (attrLabel) {
      return attrLabel;
    }

    const headEl = folderEl.querySelector(".map-folder__head");
    const strongLabel = headEl?.querySelector("strong")?.textContent?.trim();
    if (strongLabel) {
      return strongLabel;
    }

    const labelEl = headEl?.querySelector("label");
    if (labelEl) {
      const countText = labelEl.querySelector(".map-list__folder-count")?.textContent ?? "";
      const fullText = labelEl.textContent ?? "";
      const stripped = countText ? fullText.slice(0, fullText.length - countText.length) : fullText;
      const trimmed = stripped.trim();
      if (trimmed) {
        return trimmed;
      }
    }

    return t("folderFallback");
  }

  /**
   * ネイティブ側でフォルダのマップ(a.map-link)は即座に描画されるが、フォルダ名(data-folder等)の
   * 反映がそれよりわずかに遅れることがあるため、初回のフォルダ取得を確定する前に
   * 全フォルダの名前が読み取れる状態になるまで少し待つ。
   */
  async function waitForNativeFolderLabels() {
    for (let attempt = 0; attempt < 15; attempt++) {
      const rootList = nativeListEl?.querySelector("ul.map-list");
      if (!rootList) {
        return;
      }
      const folders = [...rootList.children].filter((child) => child.matches?.(".map-folder"));
      if (folders.length === 0) {
        return;
      }
      const allResolved = folders.every((folder) => readNativeFolderLabel(folder) !== t("folderFallback"));
      if (allResolved) {
        return;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 200));
    }
  }

  /** 拡張機能側フォルダの初回自動生成用に、ネイティブのフォルダ構造を1回だけ読み取る。 */
  function readNativeFolderSeed() {
    const groups = [];
    const unassigned = [];
    const rootList = nativeListEl?.querySelector("ul.map-list");
    if (!rootList) {
      return { groups, unassigned };
    }

    for (const child of rootList.children) {
      if (child.matches?.(".map-folder")) {
        const label = readNativeFolderLabel(child);
        const ids = [];
        for (const link of child.querySelectorAll("a.map-link[href]")) {
          const match = link.getAttribute("href")?.match(/\/maps\/(\d+)/);
          if (match) {
            ids.push(match[1]);
          }
        }
        if (ids.length > 0) {
          groups.push({ id: crypto.randomUUID(), label, mapIds: ids });
        }
      } else if (child.matches?.("li.map-list__entry")) {
        const link = child.querySelector("a.map-link[href]");
        const match = link?.getAttribute("href")?.match(/\/maps\/(\d+)/);
        if (match) {
          unassigned.push(match[1]);
        }
      }
    }

    return { groups, unassigned };
  }

  function seedHeadingsIfNeeded() {
    if (headingsData.initialized) {
      return false;
    }

    const seed = readNativeFolderSeed();
    headingsData.headings = seed.groups;
    const placed = new Set(seed.groups.flatMap((group) => group.mapIds));
    const unassigned = new Set(seed.unassigned.filter((id) => !placed.has(id)));
    for (const id of mapsById.keys()) {
      if (!placed.has(id) && !unassigned.has(id)) {
        unassigned.add(id);
      }
    }
    headingsData.unassignedOrder = [...unassigned];
    headingsData.initialized = true;
    return true;
  }

  /** 新規作成・削除で増減したマップIDを、フォルダ/未分類/お気に入り/国/タグへ反映する。 */
  function reconcileMapIds() {
    let changed = seedHeadingsIfNeeded();
    const currentIds = new Set(mapsById.keys());
    const placedIds = new Set();

    for (const heading of headingsData.headings) {
      const before = heading.mapIds.length;
      heading.mapIds = heading.mapIds.filter((id) => currentIds.has(id));
      if (heading.mapIds.length !== before) {
        changed = true;
      }
      for (const id of heading.mapIds) {
        placedIds.add(id);
      }
    }

    const beforeUnassigned = headingsData.unassignedOrder.length;
    headingsData.unassignedOrder = headingsData.unassignedOrder.filter((id) => currentIds.has(id));
    if (headingsData.unassignedOrder.length !== beforeUnassigned) {
      changed = true;
    }
    for (const id of headingsData.unassignedOrder) {
      placedIds.add(id);
    }

    const newIds = [...currentIds].filter((id) => !placedIds.has(id));
    if (newIds.length > 0) {
      changed = true;
      const targetHeading = pendingNewMapHeadingId
        ? headingsData.headings.find((heading) => heading.id === pendingNewMapHeadingId)
        : null;
      if (targetHeading) {
        targetHeading.mapIds.unshift(...newIds);
      } else {
        headingsData.unassignedOrder.push(...newIds);
      }
      if (pendingNewMapHeadingId) {
        pendingNewMapHeadingId = null;
        persistKey(PENDING_HEADING_KEY, null);
      }
    }

    for (const id of Object.keys(favorites)) {
      if (!currentIds.has(id)) {
        delete favorites[id];
        changed = true;
      }
    }
    for (const id of Object.keys(countries)) {
      if (!currentIds.has(id)) {
        delete countries[id];
        changed = true;
      }
    }
    for (const id of Object.keys(tagsData.mapTagIds)) {
      if (!currentIds.has(id)) {
        delete tagsData.mapTagIds[id];
        changed = true;
      }
    }

    return changed;
  }

  function refreshFromNative() {
    mapsById = computeMapsSnapshot();
    const changed = reconcileMapIds();
    if (changed) {
      persistHeadings();
      persistFavorites();
      persistCountries();
      persistTags();
    }
    render();
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshFromNative, 60);
  }

  /* ---------- フォルダ・カードの移動 ---------- */

  function findSectionArray(sectionId) {
    if (sectionId === UNASSIGNED_ID) {
      return headingsData.unassignedOrder;
    }
    return headingsData.headings.find((heading) => heading.id === sectionId)?.mapIds ?? null;
  }

  /** お気に入り一覧など、実際の保存場所と異なるビューから開いた場合でも本来の所属フォルダを返す。 */
  function findCurrentSectionId(mapId) {
    const heading = headingsData.headings.find((candidate) => candidate.mapIds.includes(mapId));
    return heading ? heading.id : UNASSIGNED_ID;
  }

  function removeMapIdEverywhere(mapId) {
    headingsData.unassignedOrder = headingsData.unassignedOrder.filter((id) => id !== mapId);
    for (const heading of headingsData.headings) {
      heading.mapIds = heading.mapIds.filter((id) => id !== mapId);
    }
  }

  function moveMapTo(mapId, targetSectionId, targetIndex) {
    removeMapIdEverywhere(mapId);
    const target = findSectionArray(targetSectionId);
    if (!target) {
      return;
    }
    const index = Math.max(0, Math.min(targetIndex, target.length));
    target.splice(index, 0, mapId);
    persistHeadings();
    render();
  }

  /* ---------- モーダル基盤 ---------- */

  function openModal(titleText) {
    const overlay = document.createElement("div");
    overlay.className = "mma-map-list-modal-overlay";

    const panel = document.createElement("div");
    panel.className = "mma-map-list-modal";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", titleText);

    const title = document.createElement("h2");
    title.className = "mma-map-list-modal__title";
    title.textContent = titleText;

    const body = document.createElement("div");
    const footer = document.createElement("div");
    footer.className = "mma-map-list-modal__footer";

    panel.append(title, body, footer);
    overlay.append(panel);

    function handleKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    function close() {
      overlay.remove();
      document.removeEventListener("keydown", handleKeydown, true);
    }

    overlay.addEventListener("mousedown", (event) => {
      if (event.target === overlay) {
        close();
      }
    });
    document.addEventListener("keydown", handleKeydown, true);
    document.body.append(overlay);

    return { panel, body, footer, close };
  }

  function onEnterKey(input, handler) {
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.isComposing || event.keyCode === 229) {
        return;
      }
      event.preventDefault();
      handler();
    });
  }

  function createModalButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  /* ---------- フォルダ追加・編集・削除 ---------- */

  function openHeadingFormModal(titleText, initialLabel, onSubmit) {
    const modal = openModal(titleText);

    if (!initialLabel) {
      const presets = document.createElement("div");
      presets.className = "mma-map-list-modal__presets";
      for (const preset of PRESET_HEADINGS[language] ?? PRESET_HEADINGS.ja) {
        presets.append(
          createModalButton(preset, "mma-map-list-modal__preset", () => {
            input.value = preset;
            input.focus();
          })
        );
      }
      modal.body.append(presets);
    }

    const label = document.createElement("label");
    label.className = "mma-map-list-modal__label";
    label.textContent = t("folderNameLabel", { max: LABEL_MAX_LENGTH });
    const input = document.createElement("input");
    input.type = "text";
    input.className = "mma-map-list-modal__input";
    input.value = initialLabel || "";
    label.append(input);
    modal.body.append(label);

    function submit() {
      const trimmed = input.value.trim();
      if (!trimmed) {
        input.focus();
        return;
      }
      if (countGraphemes(trimmed) > LABEL_MAX_LENGTH) {
        input.focus();
        return;
      }
      onSubmit(trimmed);
      modal.close();
    }

    onEnterKey(input, submit);
    modal.footer.append(
      createModalButton(t("cancel"), "mma-map-list-modal__button", modal.close),
      createModalButton(t("save"), "mma-map-list-modal__button mma-map-list-modal__button--primary", submit)
    );

    window.setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }

  function handleAddHeading() {
    openHeadingFormModal(t("folderAdd"), "", (label) => {
      headingsData.headings.push({ id: crypto.randomUUID(), label, mapIds: [] });
      persistHeadings();
      render();
    });
  }

  function handleRenameHeading(heading) {
    openHeadingFormModal(t("folderRename"), heading.label, (label) => {
      heading.label = label;
      persistHeadings();
      render();
    });
  }

  function handleDeleteHeading(heading) {
    const modal = openModal(t("folderDeleteTitle"));
    const message = document.createElement("p");
    message.className = "mma-map-list-modal__message";
    message.textContent = t("folderDeleteMessage", { label: heading.label });
    modal.body.append(message);

    function submit() {
      headingsData.headings = headingsData.headings.filter((candidate) => candidate.id !== heading.id);
      headingsData.unassignedOrder.push(...heading.mapIds);
      persistHeadings();
      render();
      modal.close();
    }

    modal.footer.append(
      createModalButton(t("cancel"), "mma-map-list-modal__button", modal.close),
      createModalButton(t("delete"), "mma-map-list-modal__button mma-map-list-modal__button--danger", submit)
    );
  }

  /* ---------- 新規マップ作成 ---------- */

  /** ネイティブの新規マップ作成フォーム（name入力とCreateボタンを持つ）を探す。表示前は存在しない。 */
  function findNativeCreateMapForm() {
    return nativeListEl?.querySelector("form.map-list-head") ?? null;
  }

  /** 作成フォームが現れる前に表示されている「New map」トグルボタンを探す。 */
  function findNativeCreateMapToggle() {
    if (!nativeListEl) {
      return null;
    }
    for (const button of nativeListEl.querySelectorAll("p.map-list-head button")) {
      if (button.textContent.trim() === "New map") {
        return button;
      }
    }
    return null;
  }

  /**
   * ネイティブの作成フォームは最初はDOMになく、「New map」ボタンを押した時だけ現れる。
   * まだ無ければトグルボタンを押し、フォームが出現するまで少し待つ。
   */
  async function revealNativeCreateMapForm() {
    let form = findNativeCreateMapForm();
    if (form) {
      return form;
    }

    const toggle = findNativeCreateMapToggle();
    if (!toggle) {
      return null;
    }
    toggle.click();

    for (let attempt = 0; attempt < 25; attempt++) {
      form = findNativeCreateMapForm();
      if (form) {
        return form;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 40));
    }
    return null;
  }

  /** マップ名と作成先フォルダを入力させた上で、ネイティブの作成フォームへ処理を委譲する。 */
  function openCreateMapModal(defaultSectionId) {
    const modal = openModal(t("createMapTitle"));

    const nameLabel = document.createElement("label");
    nameLabel.className = "mma-map-list-modal__label";
    nameLabel.textContent = t("createMapNameLabel");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "mma-map-list-modal__input";
    nameLabel.append(nameInput);
    modal.body.append(nameLabel);

    const folderLabel = document.createElement("label");
    folderLabel.className = "mma-map-list-modal__label";
    folderLabel.textContent = t("createMapFolderLabel");
    const folderSelect = document.createElement("select");
    folderSelect.className = "mma-map-list-modal__select";
    for (const option of allSectionOptions()) {
      const optionEl = document.createElement("option");
      optionEl.value = option.id;
      optionEl.textContent = option.label;
      folderSelect.append(optionEl);
    }
    folderSelect.value = defaultSectionId ?? UNASSIGNED_ID;
    folderLabel.append(folderSelect);
    modal.body.append(folderLabel);

    async function submit() {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        return;
      }

      const form = await revealNativeCreateMapForm();
      const nameField = form?.querySelector('input[name="name"]');
      const submitButton = form?.querySelector('button[type="submit"]');
      if (!form || !nameField || !submitButton) {
        return;
      }

      nameField.value = name;
      const targetId = folderSelect.value;
      pendingNewMapHeadingId = targetId === UNASSIGNED_ID ? null : targetId;
      persistKey(PENDING_HEADING_KEY, pendingNewMapHeadingId);
      modal.close();
      submitButton.click();
    }

    onEnterKey(nameInput, submit);
    window.setTimeout(() => nameInput.focus(), 0);

    modal.footer.append(
      createModalButton(t("cancel"), "mma-map-list-modal__button", modal.close),
      createModalButton(t("createMapSubmit"), "mma-map-list-modal__button mma-map-list-modal__button--primary", submit)
    );
  }

  function handleAddMapToHeading(heading) {
    openCreateMapModal(heading.id);
  }

  /* ---------- 国選択モーダル ---------- */

  function openCountryModal(map) {
    const modal = openModal(t("countryTitle", { name: map.name }));

    const searchLabel = document.createElement("label");
    searchLabel.className = "mma-map-list-modal__label";
    searchLabel.textContent = t("countrySearchLabel");
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "mma-map-list-modal__input";
    searchInput.placeholder = t("countrySearchPlaceholder");
    searchLabel.append(searchInput);
    modal.body.append(searchLabel);

    const list = document.createElement("div");
    list.className = "mma-map-list-modal__checklist";
    modal.body.append(list);

    const rows = REGION_CODES.map((code) => {
      const label = nameForCode(code);
      const englishName = nameForCodeUsing(code, regionNamesEn);
      const japaneseName = nameForCodeUsing(code, regionNamesJa);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mma-map-list-modal__check-row mma-map-list-modal__check-row--action";
      row.append(document.createTextNode(`${flagFromCode(code)} ${label} (${code})`));
      row.addEventListener("click", () => {
        countries[map.id] = code;
        persistCountries();
        render();
        modal.close();
      });
      list.append(row);
      return {
        code: code.toLocaleLowerCase(),
        englishName: englishName.toLocaleLowerCase(),
        japaneseName: japaneseName.toLocaleLowerCase(),
        row
      };
    });

    let selectedEntry = null;

    function visibleEntries() {
      return rows.filter((entry) => !entry.row.hidden);
    }

    function selectEntry(entry) {
      if (selectedEntry) {
        selectedEntry.row.classList.remove("mma-map-list-modal__check-row--selected");
      }
      selectedEntry = entry ?? null;
      if (selectedEntry) {
        selectedEntry.row.classList.add("mma-map-list-modal__check-row--selected");
        selectedEntry.row.scrollIntoView({ block: "nearest" });
      }
    }

    function applyFilter() {
      const query = searchInput.value.trim().toLocaleLowerCase();
      const domainQuery = query.startsWith(".") ? query.slice(1) : query;
      const displayName = language === "ja" ? "japaneseName" : "englishName";
      for (const entry of rows) {
        entry.row.hidden =
          query.length > 0 &&
          !entry[displayName].includes(query) &&
          !entry.code.includes(domainQuery);
      }
      selectEntry(visibleEntries()[0] ?? null);
    }

    searchInput.addEventListener("input", applyFilter);
    applyFilter();

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const visible = visibleEntries();
        if (visible.length === 0) {
          return;
        }
        const currentIndex = selectedEntry ? visible.indexOf(selectedEntry) : -1;
        const nextIndex =
          event.key === "ArrowDown"
            ? Math.min(currentIndex < 0 ? 0 : currentIndex + 1, visible.length - 1)
            : Math.max(currentIndex < 0 ? 0 : currentIndex - 1, 0);
        selectEntry(visible[nextIndex]);
        return;
      }
      if (event.key === "Enter") {
        if (selectedEntry) {
          event.preventDefault();
          selectedEntry.row.click();
        }
      }
    });

    modal.footer.append(
      createModalButton(t("countryClear"), "mma-map-list-modal__button", () => {
        delete countries[map.id];
        persistCountries();
        render();
        modal.close();
      }),
      createModalButton(t("close"), "mma-map-list-modal__button", modal.close)
    );

    window.setTimeout(() => searchInput.focus(), 0);
  }

  /* ---------- マップ編集モーダル（名前・フォルダ・タグ） ---------- */

  function openEditMapModal(map) {
    const modal = openModal(t("editMapTitle"));
    const currentSectionId = findCurrentSectionId(map.id);

    const nameLabel = document.createElement("label");
    nameLabel.className = "mma-map-list-modal__label";
    nameLabel.textContent = t("createMapNameLabel");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "mma-map-list-modal__input";
    nameInput.value = map.name;
    nameLabel.append(nameInput);
    modal.body.append(nameLabel);

    const folderLabel = document.createElement("label");
    folderLabel.className = "mma-map-list-modal__label";
    folderLabel.textContent = t("createMapFolderLabel");
    const folderSelect = document.createElement("select");
    folderSelect.className = "mma-map-list-modal__select";
    for (const option of allSectionOptions()) {
      const optionEl = document.createElement("option");
      optionEl.value = option.id;
      optionEl.textContent = option.label;
      folderSelect.append(optionEl);
    }
    folderSelect.value = currentSectionId;
    folderLabel.append(folderSelect);
    modal.body.append(folderLabel);

    const tagsLabel = document.createElement("p");
    tagsLabel.className = "mma-map-list-modal__label";
    tagsLabel.textContent = t("editMapTagsLabel");
    modal.body.append(tagsLabel);

    const currentTagIds = new Set(tagsData.mapTagIds[map.id] || []);
    const list = document.createElement("div");
    list.className = "mma-map-list-modal__checklist";

    function renderTagList() {
      list.replaceChildren();
      if (tagsData.tags.length === 0) {
        const empty = document.createElement("p");
        empty.className = "mma-map-list-modal__message";
        empty.textContent = t("tagsEmpty");
        list.append(empty);
        return;
      }

      for (const tag of tagsData.tags) {
        const row = document.createElement("label");
        row.className = "mma-map-list-modal__check-row";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = currentTagIds.has(tag.id);
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            currentTagIds.add(tag.id);
          } else {
            currentTagIds.delete(tag.id);
          }
        });
        const swatch = document.createElement("span");
        swatch.className = "mma-map-list-modal__swatch";
        swatch.style.background = tag.color;
        const text = document.createElement("span");
        text.textContent = tag.name;
        row.append(checkbox, swatch, text);
        list.append(row);
      }
    }

    renderTagList();
    modal.body.append(list);

    const newTagLabel = document.createElement("label");
    newTagLabel.className = "mma-map-list-modal__label";
    newTagLabel.textContent = t("tagsNewLabel");
    const newTagInput = document.createElement("input");
    newTagInput.type = "text";
    newTagInput.className = "mma-map-list-modal__input";
    newTagInput.maxLength = 20;
    newTagLabel.append(newTagInput);
    modal.body.append(newTagLabel);

    function addTag() {
      const trimmed = newTagInput.value.trim();
      if (!trimmed) {
        return;
      }
      const color = TAG_PALETTE[tagsData.tags.length % TAG_PALETTE.length];
      const tag = { id: crypto.randomUUID(), name: trimmed, color };
      tagsData.tags.push(tag);
      currentTagIds.add(tag.id);
      newTagInput.value = "";
      renderTagList();
    }

    onEnterKey(newTagInput, addTag);
    modal.body.append(createModalButton(t("tagsCreate"), "mma-map-list-modal__button", addTag));

    async function submit() {
      const name = nameInput.value.trim();
      if (!name) {
        nameInput.focus();
        return;
      }

      modal.close();

      if (name !== map.name) {
        const renamed = await renameMapViaNativeDialog(map.id, name);
        if (renamed) {
          map.name = name;
          const cached = mapsById.get(map.id);
          if (cached) {
            cached.name = name;
          }
        }
      }

      const targetId = folderSelect.value;
      if (targetId !== currentSectionId) {
        const target = findSectionArray(targetId);
        moveMapTo(map.id, targetId, target ? target.length : 0);
      }

      tagsData.mapTagIds[map.id] = [...currentTagIds];
      persistTags();
      render();
    }

    onEnterKey(nameInput, submit);
    modal.footer.append(
      createModalButton(t("cancel"), "mma-map-list-modal__button", modal.close),
      createModalButton(t("save"), "mma-map-list-modal__button mma-map-list-modal__button--primary", submit)
    );

    window.setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 0);
  }

  /* ---------- マップ削除モーダル ---------- */

  function openDeleteMapModal(map) {
    const modal = openModal(t("deleteMapTitle"));

    const message = document.createElement("p");
    message.className = "mma-map-list-modal__message";
    message.textContent = t("deleteMapMessage", { name: map.name });
    modal.body.append(message);

    const warning = document.createElement("p");
    warning.className = "mma-map-list-modal__message mma-map-list-modal__message--danger";
    warning.textContent = t("deleteMapWarning");
    modal.body.append(warning);

    async function submit() {
      modal.close();
      await deleteMapViaNativeDialog(map.id);
    }

    modal.footer.append(
      createModalButton(t("cancel"), "mma-map-list-modal__button", modal.close),
      createModalButton(t("menuDelete"), "mma-map-list-modal__button mma-map-list-modal__button--danger", submit)
    );
  }

  /* ---------- 描画 ---------- */

  function matchesSearch(map) {
    if (!searchQuery) {
      return true;
    }
    const query = searchQuery.toLocaleLowerCase();
    if (map.name.toLocaleLowerCase().includes(query)) {
      return true;
    }
    const countryCode = countries[map.id];
    if (!countryCode) {
      return false;
    }
    const domainQuery = query.startsWith(".") ? query.slice(1) : query;
    return countryCode.toLocaleLowerCase() === domainQuery;
  }

  function allSectionOptions() {
    return [
      { id: UNASSIGNED_ID, label: t("sectionUnassigned") },
      ...headingsData.headings.map((heading) => ({ id: heading.id, label: heading.label }))
    ];
  }

  function createCard(map, sectionId, movable) {
    const card = document.createElement("a");
    card.className = "mma-map-list__card";
    card.href = `/maps/${map.id}`;
    if (openInNewTab) {
      card.target = "_blank";
      card.rel = "noopener noreferrer";
    }
    card.dataset.mapId = map.id;

    if (movable) {
      const handle = document.createElement("span");
      handle.className = "mma-map-list__drag-handle";
      handle.textContent = "⠿";
      handle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      card.append(handle);
      card.draggable = true;

      card.addEventListener("dragstart", () => {
        draggingCard = { mapId: map.id, fromSectionId: sectionId };
        card.dataset.dragging = "true";
      });
      card.addEventListener("dragend", () => {
        draggingCard = null;
        delete card.dataset.dragging;
        for (const el of document.querySelectorAll(".mma-map-list__card--drag-over")) {
          el.classList.remove("mma-map-list__card--drag-over");
        }
        for (const el of document.querySelectorAll(".mma-map-list__card--drag-over-after")) {
          el.classList.remove("mma-map-list__card--drag-over-after");
        }
        for (const el of document.querySelectorAll(".mma-map-list__section--drop-target")) {
          el.classList.remove("mma-map-list__section--drop-target");
        }
      });
      card.addEventListener("dragover", (event) => {
        if (!draggingCard || draggingCard.mapId === map.id) {
          return;
        }
        event.preventDefault();
        const rect = card.getBoundingClientRect();
        const isAfter = event.clientY - rect.top > rect.height / 2;
        card.classList.toggle("mma-map-list__card--drag-over", !isAfter);
        card.classList.toggle("mma-map-list__card--drag-over-after", isAfter);
      });
      card.addEventListener("dragleave", () => {
        card.classList.remove("mma-map-list__card--drag-over");
        card.classList.remove("mma-map-list__card--drag-over-after");
      });
      card.addEventListener("drop", (event) => {
        event.preventDefault();
        const isAfter = card.classList.contains("mma-map-list__card--drag-over-after");
        card.classList.remove("mma-map-list__card--drag-over");
        card.classList.remove("mma-map-list__card--drag-over-after");
        if (!draggingCard) {
          return;
        }
        const target = findSectionArray(sectionId);
        let targetIndex = target ? target.indexOf(map.id) : 0;
        if (targetIndex < 0) {
          targetIndex = 0;
        }
        if (isAfter) {
          targetIndex += 1;
        }
        if (target && draggingCard.fromSectionId === sectionId) {
          const sourceIndex = target.indexOf(draggingCard.mapId);
          if (sourceIndex !== -1 && sourceIndex < targetIndex) {
            targetIndex -= 1;
          }
        }
        moveMapTo(draggingCard.mapId, sectionId, targetIndex);
        draggingCard = null;
      });
    }

    if (showCountry) {
      const countryCode = countries[map.id];
      const country = document.createElement("button");
      country.type = "button";
      country.className = "mma-map-list__country" + (countryCode ? "" : " mma-map-list__country--empty");
      country.textContent = countryCode ? flagFromCode(countryCode) : "📄";
      country.title = countryCode ? t("countryChange", { name: nameForCode(countryCode) }) : t("countrySelect");
      country.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openCountryModal(map);
      });
      card.append(country);
    }

    if (favorites[map.id]) {
      const mark = document.createElement("span");
      mark.className = "mma-map-list__favorite-mark";
      mark.textContent = "♥";
      mark.title = t("favoriteMarked");
      mark.setAttribute("aria-label", t("favoriteMarked"));
      card.append(mark);
    }

    const link = document.createElement("span");
    link.className = "mma-map-list__link";
    link.textContent = map.name;
    card.append(link);

    if (showLocationCount) {
      const count = document.createElement("span");
      count.className = "mma-map-list__count";
      count.textContent = t("locations", { count: map.locationCount.toLocaleString(localeTag()) });
      card.append(count);
    }

    // 付与済みのタグだけを表示する。タグの付け外しは「⋯」メニューから行う。
    const tags = document.createElement("div");
    tags.className = "mma-map-list__tags";
    const mapTagIds = tagsData.mapTagIds[map.id] || [];
    for (const tagId of mapTagIds) {
      const tag = tagsData.tags.find((candidate) => candidate.id === tagId);
      if (!tag) {
        continue;
      }
      const chip = document.createElement("span");
      chip.className = "mma-map-list__tag-chip";
      chip.style.background = tag.color;
      chip.textContent = tag.name;
      chip.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
      });
      tags.append(chip);
    }
    if (tags.childElementCount > 0) {
      card.append(tags);
    }

    // 編集・タグ・フォルダ移動・お気に入り・削除は、カード右端の「⋯」メニューへまとめる。
    // カード本体の要素を減らして、マップ名を表示できる幅をできるだけ広く取る。
    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "mma-map-list__menu-button";
    menuButton.textContent = "⋯";
    menuButton.title = t("cardMenu");
    menuButton.setAttribute("aria-label", t("cardMenu"));
    menuButton.setAttribute("aria-haspopup", "menu");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (cardMenuState?.button === menuButton) {
        closeCardMenu();
        return;
      }
      openCardMenu(menuButton, map);
    });
    card.append(menuButton);

    return card;
  }

  /* ---------- カードの「⋯」メニュー ---------- */

  function closeCardMenu() {
    cardMenuState?.close();
  }

  function openCardMenu(button, map) {
    closeCardMenu();

    const menu = document.createElement("div");
    menu.className = "mma-map-list__menu";
    menu.setAttribute("role", "menu");
    const items = [];

    function close() {
      if (cardMenuState?.menu !== menu) {
        return;
      }
      cardMenuState = null;
      menu.remove();
      button.setAttribute("aria-expanded", "false");
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeydown, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    }

    function handlePointerDown(event) {
      // ボタン自身の押下はクリック側で開閉を切り替えるため、ここでは閉じない。
      if (!menu.contains(event.target) && !button.contains(event.target)) {
        close();
      }
    }

    // マウスを使わなくても項目を選べるよう、上下キーで移動できるようにする。
    function handleKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        button.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }
      event.preventDefault();
      const index = items.indexOf(document.activeElement);
      if (index < 0) {
        items[event.key === "ArrowDown" ? 0 : items.length - 1].focus();
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length].focus();
    }

    function addItem(label, title, onSelect) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "mma-map-list__menu-item";
      item.setAttribute("role", "menuitem");
      item.textContent = label;
      if (title) {
        item.title = title;
      }
      item.addEventListener("click", () => {
        close();
        onSelect();
      });
      items.push(item);
      menu.append(item);
    }

    addItem(t("menuEdit"), "", () => openEditMapModal(map));
    addItem(favorites[map.id] ? t("favoriteRemove") : t("favoriteAdd"), "", () => {
      if (favorites[map.id]) {
        delete favorites[map.id];
      } else {
        favorites[map.id] = true;
      }
      persistFavorites();
      renderBoard();
    });
    addItem(t("menuDelete"), "", () => openDeleteMapModal(map));

    // カードは折り返しやスクロールの影響を受けるため、bodyへ固定配置して画面内へ収める。
    document.body.append(menu);
    const anchor = button.getBoundingClientRect();
    const size = menu.getBoundingClientRect();
    const left = Math.max(8, Math.min(anchor.right - size.width, window.innerWidth - size.width - 8));
    const below = anchor.bottom + 4;
    const top = below + size.height > window.innerHeight - 8 ? Math.max(8, anchor.top - size.height - 4) : below;
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    button.setAttribute("aria-expanded", "true");
    cardMenuState = { menu, button, close };
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeydown, true);
    // スクロールで閉じるため、フォーカス移動が起こしうるスクロールより後に登録する。
    items[0]?.focus();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
  }

  function createSection({ id, label, mapIds, kind }) {
    const filteredIds = mapIds.filter((mapId) => mapsById.has(mapId) && matchesSearch(mapsById.get(mapId)));
    if (searchQuery && filteredIds.length === 0) {
      return null;
    }

    const section = document.createElement("div");
    section.className = "mma-map-list__section";
    section.dataset.sectionId = id;

    const head = document.createElement("div");
    head.className = "mma-map-list__section-head";
    head.draggable = kind === "heading";

    if (kind === "heading") {
      head.addEventListener("dragstart", () => {
        draggingSectionId = id;
      });
      head.addEventListener("dragover", (event) => {
        if (draggingSectionId && draggingSectionId !== id) {
          event.preventDefault();
          section.classList.add("mma-map-list__section--drag-over");
        }
      });
      head.addEventListener("dragleave", () => {
        section.classList.remove("mma-map-list__section--drag-over");
      });
      head.addEventListener("drop", (event) => {
        event.preventDefault();
        section.classList.remove("mma-map-list__section--drag-over");
        if (!draggingSectionId || draggingSectionId === id) {
          return;
        }
        const fromIndex = headingsData.headings.findIndex((heading) => heading.id === draggingSectionId);
        const toIndex = headingsData.headings.findIndex((heading) => heading.id === id);
        if (fromIndex < 0 || toIndex < 0) {
          return;
        }
        const [moved] = headingsData.headings.splice(fromIndex, 1);
        headingsData.headings.splice(toIndex, 0, moved);
        draggingSectionId = null;
        persistHeadings();
        render();
      });
    }

    const title = document.createElement("span");
    title.className = "mma-map-list__section-title";
    title.textContent = label;
    const count = document.createElement("span");
    count.className = "mma-map-list__section-count";
    count.textContent = ` (${filteredIds.length})`;
    title.append(count);
    head.append(title);

    if (kind === "heading") {
      const heading = headingsData.headings.find((candidate) => candidate.id === id);
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "mma-map-list__icon-button";
      addButton.textContent = "＋";
      addButton.title = t("folderAddMap");
      addButton.addEventListener("click", () => handleAddMapToHeading(heading));
      const renameButton = document.createElement("button");
      renameButton.type = "button";
      renameButton.className = "mma-map-list__icon-button";
      renameButton.textContent = "✎";
      renameButton.title = t("folderRename");
      renameButton.addEventListener("click", () => handleRenameHeading(heading));
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "mma-map-list__icon-button";
      deleteButton.textContent = "×";
      deleteButton.title = t("folderDelete");
      deleteButton.addEventListener("click", () => handleDeleteHeading(heading));
      head.append(addButton, renameButton, deleteButton);
    }

    section.append(head);

    const cards = document.createElement("div");
    cards.className = "mma-map-list__cards";
    const movable = kind !== "favorites";

    if (movable) {
      cards.addEventListener("dragover", (event) => {
        if (draggingCard) {
          event.preventDefault();
          if (event.target === cards) {
            section.classList.add("mma-map-list__section--drop-target");
          }
        }
      });
      cards.addEventListener("dragleave", (event) => {
        if (event.target === cards) {
          section.classList.remove("mma-map-list__section--drop-target");
        }
      });
      cards.addEventListener("drop", (event) => {
        event.preventDefault();
        section.classList.remove("mma-map-list__section--drop-target");
        if (!draggingCard) {
          return;
        }
        if (event.target === cards) {
          const target = findSectionArray(id);
          moveMapTo(draggingCard.mapId, id, target ? target.length : 0);
        }
        draggingCard = null;
      });
    }

    for (const mapId of filteredIds) {
      cards.append(createCard(mapsById.get(mapId), id, movable));
    }
    section.append(cards);

    return section;
  }

  function render() {
    if (!root || !nativeListEl) {
      return;
    }

    // 開いたままの「⋯」メニューは、元のカードが消えると宙に浮くので閉じる。
    closeCardMenu();

    // ネイティブ一覧の更新などで作り直すときも、検索欄の入力位置を引き継げるよう控えておく。
    const searchFocus =
      searchInputEl && document.activeElement === searchInputEl
        ? { start: searchInputEl.selectionStart, end: searchInputEl.selectionEnd }
        : null;
    searchInputEl = null;
    boardEl = null;

    root.replaceChildren();
    // 空フォルダのプレースホルダーはCSSのcontentで描くため、文言だけ変数で渡す。
    root.style.setProperty("--mma-ml-cards-empty", JSON.stringify(t("cardsEmpty")));

    if (viewMode === "native") {
      // フッターへ移動していたUpdates関連のノードを含め、ページを完全に元の状態へ戻す。
      // 「フォルダビューに切り替える」ボタンだけを残した簡素なバーを追加する。
      detachFooter();
      nativeListEl.classList.remove("mma-map-list__native-hidden");
      const bar = document.createElement("div");
      bar.className = "mma-map-list__toolbar";
      const switchButton = document.createElement("button");
      switchButton.type = "button";
      switchButton.className = "mma-map-list__switch-view";
      switchButton.textContent = t("switchToFolders");
      switchButton.addEventListener("click", () => {
        viewMode = "custom";
        persistViewMode();
        render();
      });
      bar.append(switchButton);
      root.append(bar);
      return;
    }

    attachFooter();
    nativeListEl.classList.add("mma-map-list__native-hidden");

    const toolbar = document.createElement("div");
    toolbar.className = "mma-map-list__toolbar";

    const search = document.createElement("input");
    search.type = "search";
    search.className = "mma-map-list__search";
    search.placeholder = t("searchPlaceholder");
    search.value = searchQuery;
    searchInputEl = search;
    search.addEventListener("input", () => {
      searchQuery = search.value;
      // 全体をrender()すると入力中の検索欄ごと作り直してしまい、フォーカスとIMEの変換が切れる。
      // 入力のたびに全カードを組み立てると重くもなるため、少し待ってから一覧だけ描き直す。
      window.clearTimeout(searchRenderTimer);
      searchRenderTimer = window.setTimeout(() => {
        searchRenderTimer = null;
        renderBoard();
      }, 120);
    });

    const searchField = document.createElement("label");
    searchField.className = "mma-map-list__search-field";
    searchField.append(createSearchIcon(), search);
    toolbar.append(searchField);

    const newMapButton = document.createElement("button");
    newMapButton.type = "button";
    newMapButton.className = "mma-map-list__button";
    newMapButton.textContent = t("newMap");
    newMapButton.addEventListener("click", () => {
      openCreateMapModal(UNASSIGNED_ID);
    });

    const actions = document.createElement("div");
    actions.className = "mma-map-list__toolbar-actions";
    actions.append(newMapButton);

    const addHeadingButton = document.createElement("button");
    addHeadingButton.type = "button";
    addHeadingButton.className = "mma-map-list__button mma-map-list__button--ghost";
    addHeadingButton.textContent = t("addFolder");
    addHeadingButton.addEventListener("click", handleAddHeading);
    actions.append(addHeadingButton);
    toolbar.append(actions);

    root.append(toolbar);

    boardEl = document.createElement("div");
    boardEl.className = "mma-map-list__board";
    renderBoard();
    root.append(boardEl);

    // 注記はフッターの2段目に置く。フッターを作れなかったときだけ一覧の末尾に出す。
    if (!footerEl) {
      root.append(createFootnote());
    }

    // 作り直した検索欄へフォーカスとキャレット位置を戻し、続けて入力できるようにする。
    if (searchFocus && searchInputEl) {
      searchInputEl.focus();
      try {
        searchInputEl.setSelectionRange(searchFocus.start, searchFocus.end);
      } catch {
        // 選択範囲を扱えない入力欄では位置の復元だけ諦める。
      }
    }
  }

  /** 検索やお気に入りの変更で作り直すのは一覧部分だけにして、ツールバーの入力状態を保つ。 */
  function renderBoard() {
    if (!boardEl) {
      return;
    }

    closeCardMenu();
    boardEl.replaceChildren();

    const favoriteIds = [];
    for (const heading of headingsData.headings) {
      for (const id of heading.mapIds) {
        if (favorites[id]) {
          favoriteIds.push(id);
        }
      }
    }
    for (const id of headingsData.unassignedOrder) {
      if (favorites[id]) {
        favoriteIds.push(id);
      }
    }
    if (favoriteIds.length > 0) {
      const favoritesSection = createSection({
        id: FAVORITES_ID,
        label: t("sectionFavorites"),
        mapIds: favoriteIds,
        kind: "favorites"
      });
      if (favoritesSection) {
        favoritesSection.classList.add("mma-map-list__section--span");
        boardEl.append(favoritesSection);
      }
    }

    // フォルダは2カラムへ自然に流し込み、未分類は常に右カラムへ固定する。
    for (const heading of headingsData.headings) {
      const section = createSection({
        id: heading.id,
        label: heading.label,
        mapIds: heading.mapIds,
        kind: "heading"
      });
      if (section) {
        boardEl.append(section);
      }
    }

    const unassignedSection = createSection({
      id: UNASSIGNED_ID,
      label: t("sectionUnassigned"),
      mapIds: headingsData.unassignedOrder,
      kind: "unassigned"
    });
    if (unassignedSection) {
      unassignedSection.classList.add("mma-map-list__section--right");
      boardEl.append(unassignedSection);
    }
  }

  function createFootnote() {
    const footnote = document.createElement("p");
    footnote.className = "mma-map-list__footnote";
    footnote.append(t("footnote"));
    const link = document.createElement("a");
    link.href = language === "en" ? PRODUCT_URL_EN : PRODUCT_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = t("footnoteLink");
    footnote.append(link);
    return footnote;
  }

  /* ---------- フッターの作成 ---------- */

  /** フッター右下の言語切り替え。押した言語は拡張機能のオプションとも共有する。 */
  function createLanguageSwitch() {
    const wrap = document.createElement("div");
    wrap.className = "mma-map-list__lang";
    for (const [code, label] of [["ja", "日本語"], ["en", "English"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mma-map-list__lang-button";
      button.textContent = label;
      button.lang = code;
      button.setAttribute("aria-pressed", String(language === code));
      button.addEventListener("click", () => setLanguage(code));
      wrap.append(button);
    }
    return wrap;
  }

  function setLanguage(nextLanguage) {
    if (language === nextLanguage) {
      return;
    }
    language = nextLanguage;
    refreshRegionNames();
    persistKey(LANGUAGE_KEY, language);
    // フッターは取り付け時に1度だけ組み立てるため、作り直して文言を反映する。
    detachFooter();
    render();
  }

  /** 検索フォームの虫眼鏡アイコン（MaterialDesignIconsのmagnify）。 */
  function createSearchIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "mma-map-list__search-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z"
    );
    svg.append(path);
    return svg;
  }

  function createFooterIcon(icon) {
    const span = document.createElement("span");
    span.className = "mma-map-list__footer-icon";
    span.setAttribute("aria-hidden", "true");
    span.textContent = icon;
    return span;
  }

  function createFooterSlot(modifier) {
    const slot = document.createElement("div");
    slot.className = `mma-map-list__footer-slot mma-map-list__footer-slot--${modifier}`;
    return slot;
  }

  /** ネイティブのノードは複製せず移動するため、元の位置を記録してから移す。 */
  function moveFooterNode(node, slot) {
    movedFooterNodes.push({ node, parent: node.parentNode, next: node.nextSibling });
    slot.append(node);
  }

  /** ネイティブのノードは構造が読めないため、文言だけを見て左右中央へ振り分ける。 */
  function footerSlotFor(node, slots) {
    const text = node.textContent ?? "";
    if (ACCOUNT_TEXT_PATTERN.test(text)) {
      return slots.right;
    }
    if (CREDIT_TEXT_PATTERN.test(text)) {
      return slots.left;
    }
    return slots.center;
  }

  /** 中央の項目には先頭にアイコンを付ける。ネイティブが既にアイコンを持つ場合は足さない。 */
  function prependFooterIcon(node) {
    if (node.querySelector(".ctas__icon, img, svg, .mma-map-list__footer-icon")) {
      return;
    }
    const match = FOOTER_ICONS.find((entry) => entry.pattern.test(node.textContent ?? ""));
    const icon = createFooterIcon(match ? match.icon : "🔗");
    node.prepend(icon);
    injectedFooterIcons.push(icon);
  }

  /**
   * ネイティブのUpdatesセクションから、変更履歴の本文以外（マニュアル・Discordへの
   * リンク、Log out／User settings、バージョンとReAnnaのクレジット表記）を1つのフッターへ移動する。
   * 左にバージョンとクレジット、中央にUpdates・マニュアル・Discord、右にアカウント操作を置く。
   * 変更履歴の本文（普段見ない情報）だけは、アイコンボタンからのポップアップでのみ見られるようにする。
   * ノードは複製せず移動するため、detachFooter()で元の位置へ正確に戻せるよう記録しておく。
   */
  function attachFooter() {
    if (updatesSectionEl) {
      return;
    }

    const section = document.querySelector(UPDATES_SECTION_SELECTOR);
    const list = section?.querySelector(".updates__container");
    if (!section || !list) {
      return;
    }

    updatesSectionEl = section;
    movedFooterNodes = [];
    injectedFooterIcons = [];

    const slots = {
      left: createFooterSlot("left"),
      center: createFooterSlot("center"),
      right: createFooterSlot("right")
    };

    updatesToggleButton = document.createElement("button");
    updatesToggleButton.type = "button";
    updatesToggleButton.className = "mma-map-list__footer-link";
    updatesToggleButton.title = t("updatesTitle");
    updatesToggleButton.append(createFooterIcon("🕘"), document.createTextNode("Updates"));
    updatesToggleButton.addEventListener("click", () => openUpdatesPopup(list));
    slots.center.append(updatesToggleButton);

    // Log out／User settingsがマニュアル・Discordと同じコンテナに入っていることがあるため、
    // コンテナごとではなく項目単位で移動して、左右のスロットへ振り分けられるようにする。
    const ctas = section.querySelector(".ctas");
    const candidates = [];
    if (ctas) {
      candidates.push(...(ctas.children.length > 0 ? [...ctas.children] : [ctas]));
    }
    for (const selector of [".updates__version", ":scope > p:last-of-type"]) {
      const node = section.querySelector(selector);
      if (node && node !== list && !node.contains(list) && !candidates.includes(node)) {
        candidates.push(node);
      }
    }

    for (const node of candidates) {
      const slot = footerSlotFor(node, slots);
      if (slot === slots.center) {
        prependFooterIcon(node);
      }
      moveFooterNode(node, slot);
    }

    const row = document.createElement("div");
    row.className = "mma-map-list__footer-row";
    row.append(slots.left, slots.center, slots.right);

    const switchButton = document.createElement("button");
    switchButton.type = "button";
    switchButton.className = "mma-map-list__switch-view";
    switchButton.textContent = t("switchToNative");
    switchButton.addEventListener("click", () => {
      viewMode = "native";
      persistViewMode();
      render();
    });

    // 2段目は1段目と同じ3分割にして、注記を左端、表示切り替えを中央に置く。
    const noteRow = document.createElement("div");
    noteRow.className = "mma-map-list__footer-row mma-map-list__footer-row--note";
    noteRow.append(createFootnote(), switchButton, createLanguageSwitch());

    footerEl = document.createElement("footer");
    footerEl.className = "mma-map-list__footer";
    // 1段目はネイティブのリンク類、2段目は拡張機能側の注記と表示切り替え。間はdividerで区切る。
    footerEl.append(row, noteRow);

    // ページ本文の幅制約を受けないよう、bodyの末尾（ページ最下部）に直接配置する。
    document.body.append(footerEl);

    // 移動しきれず残ったフォルダ・変更履歴本文だけの、ほぼ空のセクションを畳む。
    section.classList.add(UPDATES_HIDDEN_CLASS);
  }

  function openUpdatesPopup(list) {
    const modal = openModal("Updates");
    modal.panel.classList.add("mma-map-list-modal--wide");
    modal.body.append(list.cloneNode(true));
    const version = updatesSectionEl?.querySelector(".updates__version");
    if (version) {
      modal.body.append(version.cloneNode(true));
    }
    modal.footer.append(createModalButton(t("close"), "mma-map-list-modal__button", modal.close));
  }

  function detachFooter() {
    if (!updatesSectionEl && !footerEl) {
      return;
    }

    for (const icon of injectedFooterIcons) {
      icon.remove();
    }
    injectedFooterIcons = [];

    for (const { node, parent, next } of movedFooterNodes) {
      parent.insertBefore(node, next);
    }
    movedFooterNodes = [];

    updatesSectionEl?.classList.remove(UPDATES_HIDDEN_CLASS);
    updatesSectionEl = null;

    footerEl?.remove();
    footerEl = null;
    updatesToggleButton = null;
  }

  /* ---------- アタッチ・デタッチ ---------- */

  async function attach(nextNativeList) {
    nativeListEl = nextNativeList;
    root = document.createElement("div");
    root.className = "mma-map-list";
    nativeListEl.parentNode.insertBefore(root, nativeListEl);

    const loaded = await loadAllData();
    if (!loaded || nativeListEl !== nextNativeList) {
      return;
    }

    if (!headingsData.initialized) {
      await waitForNativeFolderLabels();
      if (nativeListEl !== nextNativeList) {
        return;
      }
    }

    mapsById = computeMapsSnapshot();
    if (reconcileMapIds()) {
      persistHeadings();
      persistFavorites();
      persistCountries();
      persistTags();
    }
    render();

    clearBooting();

    nativeListObserver = new MutationObserver(scheduleRefresh);
    nativeListObserver.observe(nativeListEl, { childList: true, subtree: true });
  }

  function detach() {
    nativeListObserver?.disconnect();
    nativeListObserver = null;
    window.clearTimeout(refreshTimer);
    refreshTimer = null;
    window.clearTimeout(searchRenderTimer);
    searchRenderTimer = null;
    closeCardMenu();

    detachFooter();

    nativeListEl?.classList.remove("mma-map-list__native-hidden");
    root?.remove();
    root = null;
    nativeListEl = null;
    mapsById = new Map();
    headingsData = null;
    favorites = null;
    countries = null;
    tagsData = null;
    searchQuery = "";
    searchInputEl = null;
    boardEl = null;
    pendingNewMapHeadingId = null;
    draggingSectionId = null;
    draggingCard = null;
  }

  function reconcile() {
    if (contextInvalidated) {
      return;
    }

    const onTargetPage = TARGET_PATH.test(location.pathname);
    // マップの一覧データ（#dataブロック）とUpdatesセクションは一覧より後ろにあるため、
    // HTMLの解析が終わるまでは取り付けない。それまではネイティブ側を隠したまま待つ。
    const documentParsed = document.readyState !== "loading";
    const isTargetPage = settingsLoaded && featureEnabled && onTargetPage && documentParsed;
    const nextNativeList = isTargetPage ? document.querySelector(NATIVE_LIST_SELECTOR) : null;

    if (nativeListEl && (nativeListEl !== nextNativeList || !nativeListEl.isConnected)) {
      detach();
    }

    if (!nativeListEl && nextNativeList) {
      attach(nextNativeList);
    }

    // 独自UIを出さないと分かった時点で、隠していたネイティブの表示を戻す。
    if (settingsLoaded && (!featureEnabled || !onTargetPage || (documentParsed && !nextNativeList))) {
      clearBooting();
    }
  }

  /**
   * リロード直後は、設定を読み込んで独自UIを描画するまでの数十msだけネイティブの一覧が見えてしまう。
   * document_startの時点で隠しておき、描画が終わった時点、または対象外と分かった時点で表示に戻す。
   */
  function markBooting() {
    if (!TARGET_PATH.test(location.pathname)) {
      return;
    }
    document.documentElement.classList.add(BOOTING_CLASS);
    bootingTimer = window.setTimeout(clearBooting, BOOTING_TIMEOUT_MS);
  }

  function clearBooting() {
    window.clearTimeout(bootingTimer);
    bootingTimer = null;
    document.documentElement.classList.remove(BOOTING_CLASS);
  }

  const mutationObserver = new MutationObserver(reconcile);
  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // document_startで動くため、解析完了を待って取り付けられるよう状態変化も見る。
  document.addEventListener("readystatechange", reconcile);
  document.addEventListener("DOMContentLoaded", reconcile);

  markBooting();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (Object.hasOwn(changes, FEATURE_KEY)) {
      settingsLoaded = true;
      featureEnabled = changes[FEATURE_KEY].newValue !== false;
      reconcile();
    }

    // 別タブで開く設定は、開いているページのカードにもすぐ反映する。
    if (Object.hasOwn(changes, NEW_TAB_KEY)) {
      openInNewTab = changes[NEW_TAB_KEY].newValue !== false;
      render();
    }

    if (Object.hasOwn(changes, SHOW_LOCATION_COUNT_KEY)) {
      showLocationCount = changes[SHOW_LOCATION_COUNT_KEY].newValue !== false;
      render();
    }

    if (Object.hasOwn(changes, SHOW_COUNTRY_KEY)) {
      showCountry = changes[SHOW_COUNTRY_KEY].newValue !== false;
      render();
    }

    // 設定画面から言語を変えたときも、開いているページへ反映する。
    if (Object.hasOwn(changes, LANGUAGE_KEY)) {
      const nextLanguage = normalizeLanguage(changes[LANGUAGE_KEY].newValue);
      if (nextLanguage !== language) {
        language = nextLanguage;
        refreshRegionNames();
        detachFooter();
        render();
      }
    }
  });

  try {
    chrome.storage.local
      .get(FEATURE_KEY)
      .then((stored) => {
        featureEnabled = stored[FEATURE_KEY] !== false;
      })
      .catch((error) => {
        if (isContextInvalidatedError(error)) {
          handleContextInvalidated();
        }
      })
      .finally(() => {
        settingsLoaded = true;
        reconcile();
      });
  } catch (error) {
    if (isContextInvalidatedError(error)) {
      handleContextInvalidated();
    }
  }
})();
