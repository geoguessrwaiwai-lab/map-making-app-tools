(() => {
  "use strict";

  const SETTINGS = {
    resize: {
      key: "mma-feature-screen-resize-enabled",
      defaultValue: true,
      input: document.querySelector("#resize-enabled")
    },
    pochi: {
      key: "mma-feature-pochipochi-enabled",
      defaultValue: true,
      input: document.querySelector("#pochipochi-enabled")
    },
    pochiDefault: {
      key: "mma-pochipochi-default-enabled",
      defaultValue: false,
      input: document.querySelector("#pochipochi-default-enabled")
    }
  };
  const URL_SETTING_PREFIX = "mma-pochipochi-default:";
  const status = document.querySelector("#status");
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
      Object.values(SETTINGS).map(({ key, defaultValue }) => [key, defaultValue])
    );

    try {
      const stored = await chrome.storage.local.get(defaults);
      for (const { key, input } of Object.values(SETTINGS)) {
        input.checked = stored[key] === true;
      }
    } catch {
      showStatus("設定を読み込めませんでした。", true);
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
    input.setAttribute("aria-label", `${setting.url}のぽちぽちモードをON`);
    const track = document.createElement("span");
    track.setAttribute("aria-hidden", "true");
    switchLabel.append(input, track);

    input.addEventListener("change", async () => {
      try {
        await chrome.storage.local.set({ [setting.key]: input.checked });
        showStatus(`${setting.url}の設定を保存しました。`);
      } catch {
        input.checked = !input.checked;
        showStatus("URL別設定を保存できませんでした。", true);
      }
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "url-setting-remove";
    removeButton.textContent = "全体デフォルトに戻す";
    removeButton.setAttribute("aria-label", `${setting.url}のURL別設定を削除`);
    removeButton.addEventListener("click", async () => {
      try {
        await chrome.storage.local.remove(setting.key);
        showStatus(`${setting.url}を全体デフォルトへ戻しました。`);
      } catch {
        showStatus("URL別設定を削除できませんでした。", true);
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

    urlSettingsList.replaceChildren(
      ...filtered.map(createUrlSettingRow)
    );
    urlSettingsList.hidden = filtered.length === 0;
    urlSettingsEmpty.hidden = filtered.length !== 0;
    urlSettingsCount.textContent = query
      ? `${filtered.length} / ${urlSettings.length}件`
      : `${urlSettings.length}件`;
    deleteAllButton.disabled = urlSettings.length === 0;
  }

  async function restoreUrlSettings() {
    try {
      const stored = await chrome.storage.local.get(null);
      urlSettings = Object.entries(stored)
        .filter(([key, value]) =>
          key.startsWith(URL_SETTING_PREFIX) && typeof value === "boolean"
        )
        .map(([key, enabled]) => ({
          key,
          enabled,
          url: key.slice(URL_SETTING_PREFIX.length)
        }))
        .sort((left, right) =>
          left.url.localeCompare(right.url, "ja", { numeric: true })
        );
      renderUrlSettings();
    } catch {
      showStatus("URL別設定を読み込めませんでした。", true);
    }
  }

  for (const { key, input } of Object.values(SETTINGS)) {
    input.addEventListener("change", async () => {
      try {
        await chrome.storage.local.set({ [key]: input.checked });
        showStatus("設定を保存しました。Map Making Appにも反映されます。");
      } catch {
        showStatus("設定を保存できませんでした。", true);
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
      showStatus("URLごとの設定をすべて削除しました。");
    } catch {
      showStatus("URLごとの設定を削除できませんでした。", true);
    } finally {
      deleteAllConfirm.disabled = false;
    }
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (
      areaName === "local" &&
      Object.keys(changes).some((key) => key.startsWith(URL_SETTING_PREFIX))
    ) {
      restoreUrlSettings();
    }
  });

  restoreSettings();
  restoreUrlSettings();
})();
