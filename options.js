(() => {
  "use strict";

  const SETTINGS = {
    resize: {
      key: "mma-feature-screen-resize-enabled",
      defaultValue: true,
      input: document.querySelector("#resize-enabled"),
    },
    pochi: {
      key: "mma-feature-pochipochi-enabled",
      defaultValue: true,
      input: document.querySelector("#pochipochi-enabled"),
    },
    pochiDefault: {
      key: "mma-pochipochi-default-enabled",
      defaultValue: false,
      input: document.querySelector("#pochipochi-default-enabled"),
    },
    mapList: {
      key: "mma-feature-map-list-enabled",
      defaultValue: true,
      input: document.querySelector("#map-list-enabled"),
    },
    mapListNewTab: {
      key: "mma-map-list-new-tab-enabled",
      defaultValue: true,
      input: document.querySelector("#map-list-new-tab"),
    },
    mapListShowLocationCount: {
      key: "mma-map-list-show-location-count",
      defaultValue: true,
      input: document.querySelector("#map-list-show-location-count"),
    },
    mapListShowCountry: {
      key: "mma-map-list-show-country",
      defaultValue: true,
      input: document.querySelector("#map-list-show-country"),
    },
  };
  const URL_SETTING_PREFIX = "mma-pochipochi-default:";
  const LANGUAGE_KEY = "mma-language";
  const HELP_URL =
    "https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/";
  // 案内サイトは言語ごとにページが分かれているため、英語表示のときは英語ページへ送る。
  const HELP_URL_EN =
    "https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/en/";
  // 表示言語はトップページのフッターと共有する。ブラウザのUI言語には追従しない。
  const MESSAGES = {
    ja: {
      documentTitle: "Map Making App Tools 設定",
      pageTitle: "拡張機能の設定",
      languageTitle: "表示言語",
      languageName: "言語",
      languageDescription:
        "拡張機能が表示する文言の言語です。トップページのフッター右下からも切り替えられます。",
      featuresTitle: "使用する機能",
      featuresDescription:
        "機能ごとに有効・無効を切り替えられます。変更は開いているMap Making Appにも反映されます。",
      resizeName: "画面幅調整",
      resizeDescription: "左右の画面領域の境界線をドラッグして幅を変更します。",
      pochiName: "ぽちぽちモード",
      pochiDescription:
        "新しく確認したロケーションを、次の選択時に削除します。",
      folderViewName: "フォルダビュー",
      folderViewDescription:
        "トップページのマップ一覧を、フォルダ・お気に入り・タグ・国チップつきのカード表示に切り替えます。",
      mapListTitle: "フォルダビューの動作",
      newTabName: "マップを別タブで開く",
      newTabDescription:
        "フォルダビューのマップ名をクリックしたとき、新しいタブで開きます。OFFにすると同じタブで開きます。",
      showLocationCountName: "ロケーション数を表示",
      showLocationCountDescription:
        "各マップカードに「{N} locs」のように収録ロケーション数を表示します。",
      showCountryName: "国チップアイコンを表示",
      showCountryDescription:
        "各マップカードに国旗（または未設定アイコン）を表示します。",
      mapListNote:
        "フォルダビュー自体をやめる場合は、上の「フォルダビュー」をOFFにしてください。",
      defaultsTitle: "ぽちぽちモードの初期状態",
      defaultOnName: "ONをデフォルトにする",
      defaultOnDescription:
        "URL別の設定がまだないマップでは、ぽちぽちモードをONで開始します。",
      defaultsNote:
        "Map Making App上で切り替えたURLには、そのURL専用のON／OFFが保存され、こちらのデフォルトより優先されます。",
      urlSettingsTitle: "URLごとの設定",
      urlSettingsDescription:
        "保存済みのURL別設定を変更したり、全体デフォルトへ戻したりできます。",
      urlSearchLabel: "URLを検索",
      urlSearchPlaceholder: "URLの一部を入力して検索",
      urlSettingsEmpty: "該当するURL別設定はありません。",
      urlDeleteAll: "URLごとの設定をすべて削除",
      helpLink: "使い方とプライバシーについて",
      deleteAllTitle: "URLごとの設定をすべて削除しますか？",
      deleteAllMessage:
        "保存されているすべてのURL別ON／OFFを削除します。各マップには、ぽちぽちモードの全体デフォルトが適用されるようになります。",
      cancel: "キャンセル",
      deleteAllConfirm: "すべて削除",
      urlToggleLabel: "{url}のぽちぽちモードをON",
      urlReset: "全体デフォルトに戻す",
      urlResetLabel: "{url}のURL別設定を削除",
      countAll: "{total}件",
      countFiltered: "{shown} / {total}件",
      savedSettings: "設定を保存しました。Map Making Appにも反映されます。",
      saveFailed: "設定を保存できませんでした。",
      loadFailed: "設定を読み込めませんでした。",
      savedUrl: "{url}の設定を保存しました。",
      saveUrlFailed: "URL別設定を保存できませんでした。",
      resetUrl: "{url}を全体デフォルトへ戻しました。",
      deleteUrlFailed: "URL別設定を削除できませんでした。",
      loadUrlFailed: "URL別設定を読み込めませんでした。",
      deletedAll: "URLごとの設定をすべて削除しました。",
      deleteAllFailed: "URLごとの設定を削除できませんでした。",
    },
    en: {
      documentTitle: "Map Making App Tools settings",
      pageTitle: "Extension settings",
      languageTitle: "Language",
      languageName: "Language",
      languageDescription:
        "The language this extension displays. You can also switch it from the bottom right of the footer on the home page.",
      featuresTitle: "Features",
      featuresDescription:
        "Turn each feature on or off. Changes apply to any open Map Making App tab.",
      resizeName: "Screen width adjustment",
      resizeDescription:
        "Drag the divider between the two panes to change their widths.",
      pochiName: "Pochi-pochi mode",
      pochiDescription:
        "Deletes a newly reviewed location when you select the next one.",
      folderViewName: "Folder view",
      folderViewDescription:
        "Turns the map list on the home page into cards grouped by folder, with favourites, tags and country chips.",
      mapListTitle: "Folder view behaviour",
      newTabName: "Open maps in a new tab",
      newTabDescription:
        "Opens a map in a new tab when you click its name in the folder view. Turn this off to open it in the same tab.",
      showLocationCountName: "Show location count",
      showLocationCountDescription:
        "Shows the number of locations on each map card, like “{N} locs”.",
      showCountryName: "Show country chip icon",
      showCountryDescription:
        "Shows the flag (or placeholder icon) on each map card.",
      mapListNote:
        "To stop using the folder view entirely, turn off “Folder view” above.",
      defaultsTitle: "Pochi-pochi mode default",
      defaultOnName: "Start with it on",
      defaultOnDescription:
        "Starts Pochi-pochi mode on for maps that have no per-URL setting yet.",
      defaultsNote:
        "A URL you toggle inside Map Making App keeps its own ON/OFF value, which wins over this default.",
      urlSettingsTitle: "Per-URL settings",
      urlSettingsDescription:
        "Change a saved per-URL setting or reset it to the global default.",
      urlSearchLabel: "Search URLs",
      urlSearchPlaceholder: "Type part of a URL to search",
      urlSettingsEmpty: "No per-URL settings match.",
      urlDeleteAll: "Delete every per-URL setting",
      helpLink: "How it works and privacy",
      deleteAllTitle: "Delete every per-URL setting?",
      deleteAllMessage:
        "This deletes every saved per-URL ON/OFF value. Each map then follows the global Pochi-pochi default.",
      cancel: "Cancel",
      deleteAllConfirm: "Delete all",
      urlToggleLabel: "Turn on Pochi-pochi mode for {url}",
      urlReset: "Reset to the default",
      urlResetLabel: "Delete the per-URL setting for {url}",
      countAll: "{total}",
      countFiltered: "{shown} / {total}",
      savedSettings: "Saved. Any open Map Making App tab is updated too.",
      saveFailed: "Could not save the setting.",
      loadFailed: "Could not load the settings.",
      savedUrl: "Saved the setting for {url}.",
      saveUrlFailed: "Could not save the per-URL setting.",
      resetUrl: "Reset {url} to the global default.",
      deleteUrlFailed: "Could not delete the per-URL setting.",
      loadUrlFailed: "Could not load the per-URL settings.",
      deletedAll: "Deleted every per-URL setting.",
      deleteAllFailed: "Could not delete the per-URL settings.",
    },
  };
  let language = "en";

  /**
   * 保存された言語がなければ、ブラウザの言語設定から決める（日本語なら日本語、それ以外は英語）。
   * 自動判定の結果は保存せず、この画面かフッターで選んだときだけmma-languageへ書き込む。
   */
  function defaultLanguage() {
    const candidates = [
      chrome.i18n?.getUILanguage?.() ?? "",
      ...(navigator.languages ?? []),
      navigator.language ?? "",
    ];
    return candidates.some((tag) => /^ja\b/i.test(tag)) ? "ja" : "en";
  }

  function normalizeLanguage(value) {
    if (value === "ja" || value === "en") {
      return value;
    }
    return defaultLanguage();
  }

  function t(key, params) {
    const template = MESSAGES[language]?.[key] ?? MESSAGES.ja[key] ?? key;
    if (!params) {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (match, name) =>
      name in params ? String(params[name]) : match
    );
  }

  /** data-i18n（本文）とdata-i18n-placeholder（入力欄）を今の言語で塗り直す。 */
  function applyLanguage() {
    document.documentElement.lang = language;
    document.title = t("documentTitle");
    for (const element of document.querySelectorAll("[data-i18n]")) {
      element.textContent = t(element.dataset.i18n);
    }
    for (const element of document.querySelectorAll(
      "[data-i18n-placeholder]"
    )) {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    }
    helpLink.href = language === "en" ? HELP_URL_EN : HELP_URL;
    languageSelect.value = language;
    renderUrlSettings();
  }
  const status = document.querySelector("#status");
  const languageSelect = document.querySelector("#language");
  const helpLink = document.querySelector("#help-link");
  const urlSettingsSearch = document.querySelector("#url-settings-search");
  const urlSettingsList = document.querySelector("#url-settings-list");
  const urlSettingsEmpty = document.querySelector("#url-settings-empty");
  const urlSettingsCount = document.querySelector("#url-settings-count");
  const deleteAllButton = document.querySelector("#url-settings-delete-all");
  const deleteAllDialog = document.querySelector("#delete-all-dialog");
  const deleteAllCancel = document.querySelector("#delete-all-cancel");
  const deleteAllConfirm = document.querySelector("#delete-all-confirm");
  let statusTimer = null;
  let urlSettings = [];

  function showStatus(message, isError = false) {
    window.clearTimeout(statusTimer);
    status.textContent = message;
    status.style.color = isError ? "#b91c1c" : "#15803d";
    statusTimer = window.setTimeout(() => {
      status.textContent = "";
    }, 2500);
  }

  async function restoreSettings() {
    const defaults = Object.fromEntries(
      Object.values(SETTINGS).map(({ key, defaultValue }) => [
        key,
        defaultValue,
      ])
    );

    try {
      const stored = await chrome.storage.local.get(defaults);
      for (const { key, input } of Object.values(SETTINGS)) {
        input.checked = stored[key] === true;
      }
    } catch {
      showStatus(t("loadFailed"), true);
    }
  }

  function createUrlSettingRow(setting) {
    const row = document.createElement("div");
    row.className = "url-setting-row";
    row.setAttribute("role", "listitem");

    const link = document.createElement("a");
    link.className = "url-setting-link";
    link.href = setting.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = setting.url;
    link.title = setting.url;

    const switchLabel = document.createElement("label");
    switchLabel.className = "switch";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = setting.enabled;
    input.setAttribute("aria-label", t("urlToggleLabel", { url: setting.url }));
    const track = document.createElement("span");
    track.setAttribute("aria-hidden", "true");
    switchLabel.append(input, track);

    input.addEventListener("change", async () => {
      try {
        await chrome.storage.local.set({ [setting.key]: input.checked });
        showStatus(t("savedUrl", { url: setting.url }));
      } catch {
        input.checked = !input.checked;
        showStatus(t("saveUrlFailed"), true);
      }
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "url-setting-remove";
    removeButton.textContent = t("urlReset");
    removeButton.setAttribute(
      "aria-label",
      t("urlResetLabel", { url: setting.url })
    );
    removeButton.addEventListener("click", async () => {
      try {
        await chrome.storage.local.remove(setting.key);
        showStatus(t("resetUrl", { url: setting.url }));
      } catch {
        showStatus(t("deleteUrlFailed"), true);
      }
    });

    row.append(link, switchLabel, removeButton);
    return row;
  }

  function renderUrlSettings() {
    const query = urlSettingsSearch.value.trim().toLocaleLowerCase();
    const filtered = urlSettings.filter(({ url }) =>
      url.toLocaleLowerCase().includes(query)
    );

    urlSettingsList.replaceChildren(...filtered.map(createUrlSettingRow));
    urlSettingsList.hidden = filtered.length === 0;
    urlSettingsEmpty.hidden = filtered.length !== 0;
    urlSettingsCount.textContent = query
      ? t("countFiltered", {
          shown: filtered.length,
          total: urlSettings.length,
        })
      : t("countAll", { total: urlSettings.length });
    deleteAllButton.disabled = urlSettings.length === 0;
  }

  async function restoreUrlSettings() {
    try {
      const stored = await chrome.storage.local.get(null);
      urlSettings = Object.entries(stored)
        .filter(
          ([key, value]) =>
            key.startsWith(URL_SETTING_PREFIX) && typeof value === "boolean"
        )
        .map(([key, enabled]) => ({
          key,
          enabled,
          url: key.slice(URL_SETTING_PREFIX.length),
        }))
        .sort((left, right) =>
          left.url.localeCompare(right.url, language, { numeric: true })
        );
      renderUrlSettings();
    } catch {
      showStatus(t("loadUrlFailed"), true);
    }
  }

  for (const { key, input } of Object.values(SETTINGS)) {
    input.addEventListener("change", async () => {
      try {
        await chrome.storage.local.set({ [key]: input.checked });
        showStatus(t("savedSettings"));
      } catch {
        showStatus(t("saveFailed"), true);
      }
    });
  }

  urlSettingsSearch.addEventListener("input", renderUrlSettings);
  deleteAllButton.addEventListener("click", () => {
    if (urlSettings.length > 0) {
      deleteAllDialog.showModal();
    }
  });
  deleteAllCancel.addEventListener("click", () => {
    deleteAllDialog.close();
  });
  deleteAllDialog.addEventListener("click", (event) => {
    if (event.target === deleteAllDialog) {
      deleteAllDialog.close();
    }
  });
  deleteAllConfirm.addEventListener("click", async () => {
    const keys = urlSettings.map(({ key }) => key);
    if (keys.length === 0) {
      deleteAllDialog.close();
      return;
    }

    deleteAllConfirm.disabled = true;
    try {
      await chrome.storage.local.remove(keys);
      deleteAllDialog.close();
      showStatus(t("deletedAll"));
    } catch {
      showStatus(t("deleteAllFailed"), true);
    } finally {
      deleteAllConfirm.disabled = false;
    }
  });
  languageSelect.addEventListener("change", async () => {
    language = languageSelect.value === "en" ? "en" : "ja";
    applyLanguage();
    try {
      await chrome.storage.local.set({ [LANGUAGE_KEY]: language });
      showStatus(t("savedSettings"));
    } catch {
      showStatus(t("saveFailed"), true);
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (
      Object.keys(changes).some((key) => key.startsWith(URL_SETTING_PREFIX))
    ) {
      restoreUrlSettings();
    }

    // トップページのフッターから言語を切り替えたときも、この画面へ反映する。
    if (Object.hasOwn(changes, LANGUAGE_KEY)) {
      const nextLanguage = normalizeLanguage(changes[LANGUAGE_KEY].newValue);
      if (nextLanguage !== language) {
        language = nextLanguage;
        applyLanguage();
      }
    }
  });

  async function restoreLanguage() {
    try {
      const stored = await chrome.storage.local.get(LANGUAGE_KEY);
      language = normalizeLanguage(stored[LANGUAGE_KEY]);
    } catch {
      language = defaultLanguage();
    }
    applyLanguage();
  }

  restoreLanguage();
  restoreSettings();
  restoreUrlSettings();
})();
