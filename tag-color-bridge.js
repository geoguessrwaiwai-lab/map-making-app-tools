(() => {
  "use strict";

  const SETTINGS_REQUEST_EVENT = "mma-tag-color-settings-request";
  const SETTINGS_RESPONSE_EVENT = "mma-tag-color-settings-response";
  const SETTINGS_READY_EVENT = "mma-tag-color-settings-ready";
  const SETTINGS_UPDATE_EVENT = "mma-tag-color-settings-update";
  const TAG_COLOR_FEATURE_KEY = "mma-feature-tag-color-enabled";

  /** 機能のON／OFFを拡張ストレージから読む（未設定ならON）。 */
  async function getTagColorSettings() {
    const stored = await chrome.storage.local.get([TAG_COLOR_FEATURE_KEY]);
    return { featureEnabled: stored[TAG_COLOR_FEATURE_KEY] !== false };
  }

  function dispatchTagColorSettings(eventName, settings) {
    document.dispatchEvent(new CustomEvent(eventName, { detail: settings }));
  }

  function sendTagColorSettings(eventName) {
    getTagColorSettings()
      .then((settings) => {
        dispatchTagColorSettings(eventName, settings);
      })
      .catch(() => {
        // 読み込みに失敗した場合は、介入しないOFFのままにする。
      });
  }

  /** MAIN worldからの要求に応じ、現在の設定を返す。 */
  function handleSettingsRequest() {
    sendTagColorSettings(SETTINGS_RESPONSE_EVENT);
  }

  /** 管理画面の変更を、開いているMap Making Appへ即時反映する。 */
  function handleStoredSettingsChange(changes, areaName) {
    if (
      areaName !== "local" ||
      !Object.hasOwn(changes, TAG_COLOR_FEATURE_KEY)
    ) {
      return;
    }

    sendTagColorSettings(SETTINGS_UPDATE_EVENT);
  }

  document.addEventListener(SETTINGS_REQUEST_EVENT, handleSettingsRequest);
  chrome.storage.onChanged.addListener(handleStoredSettingsChange);
  document.dispatchEvent(new CustomEvent(SETTINGS_READY_EVENT));
})();
