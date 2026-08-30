(() => {
  "use strict";

  const SETTINGS_REQUEST_EVENT = "mma-pochipochi-settings-request";
  const SETTINGS_RESPONSE_EVENT = "mma-pochipochi-settings-response";
  const SETTINGS_SAVE_EVENT = "mma-pochipochi-settings-save";
  const SETTINGS_READY_EVENT = "mma-pochipochi-settings-ready";
  const SETTINGS_UPDATE_EVENT = "mma-pochipochi-settings-update";
  const SETTINGS_KEY_PREFIX = "mma-pochipochi-default:";
  const POCHIPOCHI_FEATURE_KEY = "mma-feature-pochipochi-enabled";
  const POCHIPOCHI_DEFAULT_KEY = "mma-pochipochi-default-enabled";

  function getSettingsUrl() {
    const match = location.pathname.match(/^\/maps\/(\d+)\/?$/);
    return match ? `${location.origin}/maps/${match[1]}` : "";
  }

  function getSettingsKey(url) {
    return `${SETTINGS_KEY_PREFIX}${url}`;
  }

  /** URL別設定を優先し、未設定なら管理画面の全体デフォルトを返す。 */
  async function getPochipochiSettings(url) {
    const urlKey = getSettingsKey(url);
    const stored = await chrome.storage.local.get([
      urlKey,
      POCHIPOCHI_FEATURE_KEY,
      POCHIPOCHI_DEFAULT_KEY,
    ]);
    const hasUrlSetting = Object.hasOwn(stored, urlKey);

    return {
      url,
      featureEnabled: stored[POCHIPOCHI_FEATURE_KEY] !== false,
      enabled: hasUrlSetting
        ? stored[urlKey] === true
        : stored[POCHIPOCHI_DEFAULT_KEY] === true,
      hasUrlSetting,
    };
  }

  function dispatchPochipochiSettings(eventName, settings) {
    document.dispatchEvent(new CustomEvent(eventName, { detail: settings }));
  }

  /** MAIN worldからの要求に応じ、URL単位のデフォルト設定を返す。 */
  function handleSettingsRequest(event) {
    const url = event.detail?.url;
    if (!url || url !== getSettingsUrl()) {
      return;
    }

    getPochipochiSettings(url)
      .then((settings) => {
        dispatchPochipochiSettings(SETTINGS_RESPONSE_EVENT, settings);
      })
      .catch(() => {
        // 読み込みに失敗した場合は、安全な初期値のOFFを維持する。
      });
  }

  /** 利用者が切り替えた状態を、Map Making Appから分離された拡張ストレージへ保存する。 */
  function handleSettingsSave(event) {
    const url = event.detail?.url;
    const enabled = event.detail?.enabled;
    if (!url || url !== getSettingsUrl() || typeof enabled !== "boolean") {
      return;
    }

    chrome.storage.local.set({ [getSettingsKey(url)]: enabled }).catch(() => {
      // 一時的な保存失敗でページ本体の操作を妨げない。
    });
  }

  /** 管理画面の変更を、開いているMap Making Appへ即時反映する。 */
  function handleStoredSettingsChange(changes, areaName) {
    if (areaName !== "local") {
      return;
    }

    const url = getSettingsUrl();
    if (
      Object.hasOwn(changes, POCHIPOCHI_FEATURE_KEY) ||
      Object.hasOwn(changes, POCHIPOCHI_DEFAULT_KEY) ||
      (url && Object.hasOwn(changes, getSettingsKey(url)))
    ) {
      if (url) {
        getPochipochiSettings(url)
          .then((settings) => {
            dispatchPochipochiSettings(SETTINGS_UPDATE_EVENT, settings);
          })
          .catch(() => {
            // 設定の再読込に失敗した場合は現在の表示を維持する。
          });
      }
    }
  }

  document.addEventListener(SETTINGS_REQUEST_EVENT, handleSettingsRequest);
  document.addEventListener(SETTINGS_SAVE_EVENT, handleSettingsSave);
  chrome.storage.onChanged.addListener(handleStoredSettingsChange);
  document.dispatchEvent(new CustomEvent(SETTINGS_READY_EVENT));
})();
