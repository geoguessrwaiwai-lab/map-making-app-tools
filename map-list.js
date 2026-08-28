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
  const HEADINGS_KEY = "mma-map-list-headings";
  const FAVORITES_KEY = "mma-map-list-favorites";
  const COUNTRIES_KEY = "mma-map-list-countries";
  const TAGS_KEY = "mma-map-list-tags";
  const UNASSIGNED_ID = "__unassigned__";
  const FAVORITES_ID = "__favorites__";
  const LABEL_MAX_LENGTH = 24;
  const PRODUCT_URL = "https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/";
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
  const PRESET_HEADINGS = [
    "🌏 アジア", "🌏 中央アジア", "🌍 ヨーロッパ", "🌍 アフリカ",
    "🌎 北アメリカ", "🌎 中南米", "🌎 南アメリカ", "🌏 オセアニア"
  ];
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

  let regionNames = null;
  try {
    regionNames = new Intl.DisplayNames(["ja"], { type: "region" });
  } catch {
    regionNames = null;
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
        NEW_TAB_KEY
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
    return readMapsFromJsonBlock() ?? readMapsFromDom();
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

  function findNativeActionButton(label) {
    if (!nativeListEl) {
      return null;
    }

    for (const button of nativeListEl.querySelectorAll("p.map-list-head button")) {
      if (button.textContent.trim() === label) {
        return button;
      }
    }
    return null;
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
        const label =
          child.getAttribute("data-folder") ||
          child.querySelector(".map-folder__head strong")?.textContent?.trim() ||
          "フォルダ";
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
    }
    pendingNewMapHeadingId = null;

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
      for (const preset of PRESET_HEADINGS) {
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
    label.textContent = `フォルダ名（絵文字も入力できます・${LABEL_MAX_LENGTH}文字まで）`;
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
      createModalButton("キャンセル", "mma-map-list-modal__button", modal.close),
      createModalButton("保存", "mma-map-list-modal__button mma-map-list-modal__button--primary", submit)
    );

    window.setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }

  function handleAddHeading() {
    openHeadingFormModal("フォルダを追加", "", (label) => {
      headingsData.headings.push({ id: crypto.randomUUID(), label, mapIds: [] });
      persistHeadings();
      render();
    });
  }

  function handleRenameHeading(heading) {
    openHeadingFormModal("フォルダ名を変更", heading.label, (label) => {
      heading.label = label;
      persistHeadings();
      render();
    });
  }

  function handleDeleteHeading(heading) {
    const modal = openModal("フォルダを削除しますか？");
    const message = document.createElement("p");
    message.className = "mma-map-list-modal__message";
    message.textContent = `「${heading.label}」を削除します。含まれていたマップは未分類に移動します。`;
    modal.body.append(message);

    function submit() {
      headingsData.headings = headingsData.headings.filter((candidate) => candidate.id !== heading.id);
      headingsData.unassignedOrder.push(...heading.mapIds);
      persistHeadings();
      render();
      modal.close();
    }

    modal.footer.append(
      createModalButton("キャンセル", "mma-map-list-modal__button", modal.close),
      createModalButton("削除", "mma-map-list-modal__button mma-map-list-modal__button--danger", submit)
    );
  }

  function handleAddMapToHeading(heading) {
    const button = findNativeActionButton("New map");
    if (!button) {
      return;
    }
    pendingNewMapHeadingId = heading.id;
    button.click();
  }

  /* ---------- 国選択モーダル ---------- */

  function openCountryModal(map) {
    const modal = openModal(`${map.name} の国チップ`);

    const searchLabel = document.createElement("label");
    searchLabel.className = "mma-map-list-modal__label";
    searchLabel.textContent = "国を検索";
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "mma-map-list-modal__input";
    searchInput.placeholder = "国名の一部を入力";
    searchLabel.append(searchInput);
    modal.body.append(searchLabel);

    const list = document.createElement("div");
    list.className = "mma-map-list-modal__checklist";
    modal.body.append(list);

    const rows = REGION_CODES.map((code) => {
      const label = nameForCode(code);
      const row = document.createElement("button");
      row.type = "button";
      row.className = "mma-map-list-modal__check-row";
      row.style.width = "100%";
      row.style.border = "0";
      row.style.background = "none";
      row.style.textAlign = "left";
      row.style.cursor = "pointer";
      row.append(document.createTextNode(`${flagFromCode(code)} ${label} (${code})`));
      row.addEventListener("click", () => {
        countries[map.id] = code;
        persistCountries();
        render();
        modal.close();
      });
      list.append(row);
      return { code, label, row };
    });

    searchInput.addEventListener("input", () => {
      const query = searchInput.value.trim().toLocaleLowerCase();
      for (const entry of rows) {
        entry.row.hidden =
          query.length > 0 &&
          !entry.label.toLocaleLowerCase().includes(query) &&
          !entry.code.toLocaleLowerCase().includes(query);
      }
    });

    modal.footer.append(
      createModalButton("未設定にする", "mma-map-list-modal__button", () => {
        delete countries[map.id];
        persistCountries();
        render();
        modal.close();
      }),
      createModalButton("閉じる", "mma-map-list-modal__button", modal.close)
    );

    window.setTimeout(() => searchInput.focus(), 0);
  }

  /* ---------- タグ付けモーダル ---------- */

  function openTagsModal(map) {
    const modal = openModal(`${map.name} のタグ`);
    const currentTagIds = new Set(tagsData.mapTagIds[map.id] || []);

    const list = document.createElement("div");
    list.className = "mma-map-list-modal__checklist";

    function renderList() {
      list.replaceChildren();
      if (tagsData.tags.length === 0) {
        const empty = document.createElement("p");
        empty.className = "mma-map-list-modal__message";
        empty.textContent = "まだタグがありません。下の欄から作成できます。";
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

    renderList();
    modal.body.append(list);

    const newTagLabel = document.createElement("label");
    newTagLabel.className = "mma-map-list-modal__label";
    newTagLabel.textContent = "新しいタグ名";
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
      renderList();
    }

    onEnterKey(newTagInput, addTag);
    modal.body.append(
      createModalButton("＋ タグを作成", "mma-map-list-modal__button", addTag)
    );

    function submit() {
      tagsData.mapTagIds[map.id] = [...currentTagIds];
      persistTags();
      render();
      modal.close();
    }

    modal.footer.append(
      createModalButton("キャンセル", "mma-map-list-modal__button", modal.close),
      createModalButton("保存", "mma-map-list-modal__button mma-map-list-modal__button--primary", submit)
    );
  }

  /* ---------- 描画 ---------- */

  function matchesSearch(map) {
    if (!searchQuery) {
      return true;
    }
    return map.name.toLocaleLowerCase().includes(searchQuery.toLocaleLowerCase());
  }

  function allSectionOptions() {
    return [
      { id: UNASSIGNED_ID, label: "未分類" },
      ...headingsData.headings.map((heading) => ({ id: heading.id, label: heading.label }))
    ];
  }

  function createCard(map, sectionId, movable) {
    const card = document.createElement("div");
    card.className = "mma-map-list__card";
    card.dataset.mapId = map.id;

    if (movable) {
      const handle = document.createElement("span");
      handle.className = "mma-map-list__drag-handle";
      handle.textContent = "⠿";
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
      });
      card.addEventListener("dragover", (event) => {
        if (!draggingCard || draggingCard.mapId === map.id) {
          return;
        }
        event.preventDefault();
        card.classList.add("mma-map-list__card--drag-over");
      });
      card.addEventListener("dragleave", () => {
        card.classList.remove("mma-map-list__card--drag-over");
      });
      card.addEventListener("drop", (event) => {
        event.preventDefault();
        card.classList.remove("mma-map-list__card--drag-over");
        if (!draggingCard) {
          return;
        }
        const target = findSectionArray(sectionId);
        const targetIndex = target ? target.indexOf(map.id) : 0;
        moveMapTo(draggingCard.mapId, sectionId, targetIndex < 0 ? 0 : targetIndex);
        draggingCard = null;
      });
    }

    const heart = document.createElement("button");
    heart.type = "button";
    heart.className = "mma-map-list__heart";
    const isFavorite = Boolean(favorites[map.id]);
    heart.dataset.active = String(isFavorite);
    heart.textContent = isFavorite ? "♥" : "♡";
    heart.title = isFavorite ? "お気に入りから外す" : "お気に入りに追加";
    heart.addEventListener("click", () => {
      if (favorites[map.id]) {
        delete favorites[map.id];
      } else {
        favorites[map.id] = true;
      }
      persistFavorites();
      render();
    });
    card.append(heart);

    const countryCode = countries[map.id];
    const country = document.createElement("button");
    country.type = "button";
    country.className = "mma-map-list__country" + (countryCode ? "" : " mma-map-list__country--empty");
    country.textContent = countryCode ? flagFromCode(countryCode) : "＋";
    country.title = countryCode ? `${nameForCode(countryCode)}（クリックで変更）` : "国を選択";
    country.addEventListener("click", () => openCountryModal(map));
    card.append(country);

    const link = document.createElement("a");
    link.className = "mma-map-list__link";
    link.href = `/maps/${map.id}`;
    link.textContent = map.name;
    if (openInNewTab) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    card.append(link);

    const count = document.createElement("span");
    count.className = "mma-map-list__count";
    count.textContent = `${map.locationCount.toLocaleString("ja-JP")} locations`;
    card.append(count);

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
      tags.append(chip);
    }
    const tagAdd = document.createElement("button");
    tagAdd.type = "button";
    tagAdd.className = "mma-map-list__tag-add";
    tagAdd.textContent = "＋ タグ";
    tagAdd.addEventListener("click", () => openTagsModal(map));
    tags.append(tagAdd);
    card.append(tags);

    const actions = document.createElement("div");
    actions.className = "mma-map-list__actions";
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "mma-map-list__icon-button";
    editButton.textContent = "✎";
    editButton.title = "編集/削除（Map Making App本体の設定ダイアログを開きます）";
    editButton.addEventListener("click", () => findNativeEditButton(map.id)?.click());
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "mma-map-list__icon-button";
    deleteButton.textContent = "🗑";
    deleteButton.title = "編集/削除（Map Making App本体の設定ダイアログを開きます）";
    deleteButton.addEventListener("click", () => findNativeEditButton(map.id)?.click());
    actions.append(editButton, deleteButton);
    card.append(actions);

    if (movable) {
      const moveSelect = document.createElement("select");
      moveSelect.className = "mma-map-list__move-select";
      moveSelect.title = "フォルダへ移動";
      for (const option of allSectionOptions()) {
        const optionEl = document.createElement("option");
        optionEl.value = option.id;
        optionEl.textContent = option.label;
        optionEl.selected = option.id === sectionId;
        moveSelect.append(optionEl);
      }
      moveSelect.addEventListener("change", () => {
        const target = findSectionArray(moveSelect.value);
        moveMapTo(map.id, moveSelect.value, target ? target.length : 0);
      });
      card.append(moveSelect);
    }

    return card;
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
      addButton.title = "このフォルダに新しいマップを作成";
      addButton.addEventListener("click", () => handleAddMapToHeading(heading));
      const renameButton = document.createElement("button");
      renameButton.type = "button";
      renameButton.className = "mma-map-list__icon-button";
      renameButton.textContent = "✎";
      renameButton.title = "フォルダ名を変更";
      renameButton.addEventListener("click", () => handleRenameHeading(heading));
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "mma-map-list__icon-button";
      deleteButton.textContent = "×";
      deleteButton.title = "フォルダを削除";
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
        }
      });
      cards.addEventListener("drop", (event) => {
        event.preventDefault();
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

    root.replaceChildren();

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
      switchButton.textContent = "フォルダビューに切り替える";
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
    search.placeholder = "マップを検索…";
    search.value = searchQuery;
    search.addEventListener("input", () => {
      searchQuery = search.value;
      render();
      search.focus();
    });

    const searchField = document.createElement("label");
    searchField.className = "mma-map-list__search-field";
    searchField.append(createSearchIcon(), search);
    toolbar.append(searchField);

    const newMapButton = document.createElement("button");
    newMapButton.type = "button";
    newMapButton.className = "mma-map-list__button";
    newMapButton.textContent = "＋ 新しいマップ";
    newMapButton.addEventListener("click", () => {
      pendingNewMapHeadingId = null;
      findNativeActionButton("New map")?.click();
    });

    const actions = document.createElement("div");
    actions.className = "mma-map-list__toolbar-actions";
    actions.append(newMapButton);

    const addHeadingButton = document.createElement("button");
    addHeadingButton.type = "button";
    addHeadingButton.className = "mma-map-list__button mma-map-list__button--ghost";
    addHeadingButton.textContent = "＋ フォルダを追加";
    addHeadingButton.addEventListener("click", handleAddHeading);
    actions.append(addHeadingButton);
    toolbar.append(actions);

    root.append(toolbar);

    const board = document.createElement("div");
    board.className = "mma-map-list__board";

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
        label: "★ お気に入り",
        mapIds: favoriteIds,
        kind: "favorites"
      });
      if (favoritesSection) {
        favoritesSection.classList.add("mma-map-list__section--span");
        board.append(favoritesSection);
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
        board.append(section);
      }
    }

    const unassignedSection = createSection({
      id: UNASSIGNED_ID,
      label: "未分類",
      mapIds: headingsData.unassignedOrder,
      kind: "unassigned"
    });
    if (unassignedSection) {
      unassignedSection.classList.add("mma-map-list__section--right");
      board.append(unassignedSection);
    }

    root.append(board);

    // 注記はフッターの2段目に置く。フッターを作れなかったときだけ一覧の末尾に出す。
    if (!footerEl) {
      root.append(createFootnote());
    }
  }

  function createFootnote() {
    const footnote = document.createElement("p");
    footnote.className = "mma-map-list__footnote";
    footnote.append("このUIは拡張機能によって変更されています。 ");
    const link = document.createElement("a");
    link.href = PRODUCT_URL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "詳しくはこちら";
    footnote.append(link);
    return footnote;
  }

  /* ---------- フッターの作成 ---------- */

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
    updatesToggleButton.title = "更新情報（Updates）をポップアップで見る";
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
    switchButton.textContent = "以前の表示に切り替える";
    switchButton.addEventListener("click", () => {
      viewMode = "native";
      persistViewMode();
      render();
    });

    // 2段目は1段目と同じ3分割にして、注記を左端、表示切り替えを中央に置く。
    const noteRow = document.createElement("div");
    noteRow.className = "mma-map-list__footer-row mma-map-list__footer-row--note";
    noteRow.append(createFootnote(), switchButton);

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
    modal.footer.append(createModalButton("閉じる", "mma-map-list-modal__button", modal.close));
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
