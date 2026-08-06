(() => {
  "use strict";

  const EDITOR_SELECTOR = ".page-map-editor";
  const MAP_SELECTOR = ".map-embed";
  const PANORAMA_SELECTOR = ".location-preview__panorama";
  const DELETE_BUTTON_SELECTOR = '[data-qa="location-delete"]';
  const INFO_URL = "https://app.geoguessr-waiwai.workers.dev/map-making-app-tools/";
  const MAP_CONTROL_SELECTOR =
    ".embed-controls, button, a, input, select, textarea, [role='button'], [role='combobox']";
  const DRAG_THRESHOLD_PX = 6;
  const INITIALIZATION_RETRY_MS = 250;
  const INITIALIZATION_MAX_ATTEMPTS = 40;
  const SETTINGS_REQUEST_EVENT = "mma-pochipochi-settings-request";
  const SETTINGS_RESPONSE_EVENT = "mma-pochipochi-settings-response";
  const SETTINGS_SAVE_EVENT = "mma-pochipochi-settings-save";
  const SETTINGS_READY_EVENT = "mma-pochipochi-settings-ready";
  const SETTINGS_UPDATE_EVENT = "mma-pochipochi-settings-update";
  const TARGET_PATH = /^\/maps\/\d+\/?$/;
  const CONTROL_CLASS = "mma-pochipochi-control";

  let control = null;
  let input = null;
  let modeEnabled = false;
  let activePath = "";
  let currentLocation = null;
  let transientLocationKey = null;
  let inspectionQueued = false;
  let mapPointerState = null;
  let skipNextMapClick = false;
  let settingsResolved = false;
  let pochiFeatureEnabled = false;
  let initializationRetryTimer = null;
  let initializationAttempts = 0;
  const previouslySelectedKeys = new Set();

  /** Map Making Appが公開しているエディターをMAIN worldから取得する。 */
  function getMapEditor() {
    return typeof editor === "undefined" ? null : editor;
  }

  /** Street View DOMから現在表示中のpano IDを読み取る。 */
  function getDomPanoId() {
    const panorama = document.querySelector(PANORAMA_SELECTOR);
    if (!panorama) {
      return "";
    }

    const mapsLink = panorama.querySelector('a[href*="/maps/@"][href*="!1s"]');
    const mapsMatch = mapsLink?.href.match(/!1s([^!/?&]+)/);
    if (mapsMatch) {
      return decodeURIComponent(mapsMatch[1]);
    }

    const reportLink = panorama.querySelector('a[href*="image_key="]');
    const reportMatch = reportLink?.href.match(/!2s([^!&]+)/);
    return reportMatch ? decodeURIComponent(reportMatch[1]) : "";
  }

  function coordinateKey(location) {
    const lat = typeof location?.lat === "function" ? location.lat() : location?.lat;
    const lng = typeof location?.lng === "function" ? location.lng() : location?.lng;
    return Number.isFinite(lat) && Number.isFinite(lng) ? `${lat},${lng}` : "";
  }

  function getLocationKeys(location, openedLocation = null) {
    const id = location?.id ?? openedLocation?.location?.id ?? openedLocation?.id;
    const panoId = location?.panoId || (openedLocation ? getDomPanoId() : "");
    const coordinates = coordinateKey(location?.location);
    const keys = [];

    if (id != null) {
      keys.push(`id:${id}`);
    }
    if (panoId || coordinates) {
      keys.push(`streetview:${panoId}|${coordinates}`);
    }

    return keys;
  }

  function protectLocation(location) {
    for (const key of location.keys) {
      previouslySelectedKeys.add(key);
    }
  }

  function isProtectedLocation(location) {
    return location.keys.some((key) => previouslySelectedKeys.has(key));
  }

  /** 選択地点を、地点IDを優先した安定キーと削除用オブジェクトへ変換する。 */
  function getCurrentLocation() {
    const mapEditor = getMapEditor();
    const openedLocation = mapEditor?.currentLocation;
    const location = openedLocation?.updatedProps;
    if (!location) {
      return null;
    }

    const keys = getLocationKeys(location, openedLocation);
    const key = keys[0] || "";
    if (!key) {
      return null;
    }

    return { key, keys, location };
  }

  function showDeleteError() {
    if (!control) {
      return;
    }

    control.dataset.error = "true";
    control.title = "直前のロケーションを削除できませんでした";
    window.setTimeout(() => {
      control?.removeAttribute("data-error");
      if (control) {
        control.title = "次のロケーションを選ぶと、直前に新しく選んだロケーションを削除します";
      }
    }, 3000);
  }

  function showInitializationError() {
    if (!control) {
      return;
    }

    control.dataset.error = "true";
    control.title = "保存済みロケーションを確認できなかったため、モードを開始しませんでした";
    window.setTimeout(() => {
      control?.removeAttribute("data-error");
      if (control) {
        control.title = "次のロケーションを選ぶと、直前に新しく選んだロケーションを削除します";
      }
    }, 3000);
  }

  /** Map Making Appが読み込み済みの全地点IDを、モード開始前の保護対象にする。 */
  function protectExistingLocations() {
    const mapEditor = getMapEditor();
    if (
      typeof mapEditor?.getLocationBounds !== "function" ||
      typeof mapEditor?.getLocationsInBBox !== "function"
    ) {
      return false;
    }

    try {
      const bounds = mapEditor.getLocationBounds();
      const locations = bounds ? mapEditor.getLocationsInBBox(bounds) : [];
      if (!Array.isArray(locations)) {
        return false;
      }

      for (const location of locations) {
        const keys = getLocationKeys(location);
        if (keys.length > 0) {
          protectLocation({ keys });
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /** Map Making App本来のDeleteボタンを使って、現在のロケーションを削除する。 */
  function clickDeleteButton() {
    const deleteButton = document.querySelector(DELETE_BUTTON_SELECTOR);
    if (!(deleteButton instanceof HTMLButtonElement) || deleteButton.disabled) {
      showDeleteError();
      return false;
    }

    deleteButton.click();
    return true;
  }

  /** Street Viewの置換後に、次に削除するロケーションかどうかを更新する。 */
  function inspectLocation() {
    inspectionQueued = false;
    const nextLocation = getCurrentLocation();

    if (!nextLocation) {
      return;
    }

    if (!currentLocation) {
      currentLocation = nextLocation;
      if (modeEnabled && !isProtectedLocation(nextLocation)) {
        transientLocationKey = nextLocation.key;
      } else {
        protectLocation(nextLocation);
      }
      return;
    }

    if (currentLocation.key === nextLocation.key) {
      currentLocation = nextLocation;
      return;
    }

    currentLocation = nextLocation;

    if (modeEnabled) {
      transientLocationKey = isProtectedLocation(nextLocation)
        ? null
        : nextLocation.key;
    } else {
      protectLocation(nextLocation);
      transientLocationKey = null;
    }
  }

  function queueInspection() {
    if (inspectionQueued) {
      return;
    }

    inspectionQueued = true;
    queueMicrotask(inspectLocation);
  }

  function isMapSurfaceTarget(target) {
    return (
      target instanceof Element &&
      Boolean(target.closest(MAP_SELECTOR)) &&
      !target.closest(MAP_CONTROL_SELECTOR)
    );
  }

  /** マップのパン操作を、通常の地点選択クリックと区別する。 */
  function handleMapPointerDown(event) {
    if (event.button !== 0 || event.isPrimary === false || !isMapSurfaceTarget(event.target)) {
      mapPointerState = null;
      return;
    }

    mapPointerState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragged: false
    };
  }

  function handleMapPointerMove(event) {
    if (!mapPointerState || mapPointerState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - mapPointerState.startX;
    const deltaY = event.clientY - mapPointerState.startY;
    if (deltaX * deltaX + deltaY * deltaY >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
      mapPointerState.dragged = true;
    }
  }

  function handleMapPointerUp(event) {
    if (!mapPointerState || mapPointerState.pointerId !== event.pointerId) {
      return;
    }

    skipNextMapClick = mapPointerState.dragged;
    mapPointerState = null;

    if (skipNextMapClick) {
      window.setTimeout(() => {
        skipNextMapClick = false;
      }, 0);
    }
  }

  function handleMapPointerCancel() {
    mapPointerState = null;
    skipNextMapClick = false;
  }

  /**
   * 地図クリックをキャプチャし、サイトへ同じクリックが届く前に現在地点を削除する。
   * 元イベントは停止しないため、この処理後もMap Making Appの地点選択が実行される。
   */
  function handleMapClick(event) {
    if (!modeEnabled || event.button !== 0 || !TARGET_PATH.test(location.pathname)) {
      return;
    }

    if (!isMapSurfaceTarget(event.target)) {
      return;
    }

    if (skipNextMapClick) {
      skipNextMapClick = false;
      return;
    }

    const visibleLocation = getCurrentLocation();
    if (
      !visibleLocation ||
      transientLocationKey !== visibleLocation.key ||
      currentLocation?.key !== visibleLocation.key
    ) {
      return;
    }

    // 同じクリックで二重削除しないよう、ボタン発火前に対象を解除する。
    transientLocationKey = null;
    clickDeleteButton();
  }

  /** Deleteによるプレビュー消失を、SaveまたはCloseとして扱わない。 */
  function handleLocationDelete(event) {
    const deleteButton =
      event.target instanceof Element ? event.target.closest(DELETE_BUTTON_SELECTOR) : null;
    if (!(deleteButton instanceof HTMLButtonElement) || deleteButton.disabled) {
      return;
    }

    const visibleLocation = getCurrentLocation();
    if (
      visibleLocation &&
      transientLocationKey === visibleLocation.key &&
      currentLocation?.key === visibleLocation.key
    ) {
      transientLocationKey = null;
    }
  }

  function setModeEnabled(enabled, reportInitializationError = true) {
    const visibleLocation = getCurrentLocation();
    if (visibleLocation) {
      currentLocation = visibleLocation;
    }

    if (enabled && !modeEnabled && !protectExistingLocations()) {
      if (input) {
        input.checked = false;
      }
      if (reportInitializationError) {
        showInitializationError();
      }
      return false;
    }

    if (
      !enabled &&
      modeEnabled &&
      visibleLocation &&
      transientLocationKey === visibleLocation.key
    ) {
      // 次のマップクリックがない最後の新規ロケーションは、OFF操作で削除する。
      transientLocationKey = null;
      clickDeleteButton();
    }

    modeEnabled = enabled;
    transientLocationKey = null;

    if (currentLocation) {
      protectLocation(currentLocation);
    }

    control?.classList.toggle("is-active", enabled);
    if (input) {
      input.checked = enabled;
    }
    return true;
  }

  function cancelStoredInitialization() {
    window.clearTimeout(initializationRetryTimer);
    initializationRetryTimer = null;
    initializationAttempts = 0;
    control?.removeAttribute("data-loading");
    if (input) {
      input.disabled = false;
    }
  }

  /** Map Making Appの地点インデックス準備後に、保存された自動ONを安全に適用する。 */
  function retryStoredModeEnable() {
    if (!control || !pochiFeatureEnabled) {
      cancelStoredInitialization();
      return;
    }

    control.dataset.initializing = "true";
    initializationAttempts += 1;
    if (setModeEnabled(true, false)) {
      cancelStoredInitialization();
      control?.removeAttribute("data-initializing");
      return;
    }

    if (initializationAttempts >= INITIALIZATION_MAX_ATTEMPTS) {
      cancelStoredInitialization();
      return;
    }

    control.dataset.loading = "true";
    if (input) {
      input.disabled = true;
    }
    initializationRetryTimer = window.setTimeout(
      retryStoredModeEnable,
      INITIALIZATION_RETRY_MS
    );
  }

  function applyStoredMode(enabled) {
    cancelStoredInitialization();
    if (enabled) {
      retryStoredModeEnable();
    } else {
      control?.removeAttribute("data-initializing");
      setModeEnabled(false);
    }
  }

  function getSettingsUrl() {
    const match = location.pathname.match(/^\/maps\/(\d+)\/?$/);
    return match ? `${location.origin}/maps/${match[1]}` : "";
  }

  function requestStoredSetting() {
    const url = getSettingsUrl();
    if (!url) {
      return;
    }

    document.dispatchEvent(
      new CustomEvent(SETTINGS_REQUEST_EVENT, { detail: { url } })
    );
  }

  function saveStoredSetting(enabled) {
    const url = getSettingsUrl();
    if (!url) {
      return;
    }

    document.dispatchEvent(
      new CustomEvent(SETTINGS_SAVE_EVENT, { detail: { url, enabled } })
    );
  }

  function handleStoredSetting(event) {
    const { url, enabled, featureEnabled } = event.detail || {};
    if (
      settingsResolved ||
      url !== getSettingsUrl() ||
      typeof enabled !== "boolean" ||
      typeof featureEnabled !== "boolean"
    ) {
      return;
    }

    settingsResolved = true;
    pochiFeatureEnabled = featureEnabled;
    if (!featureEnabled) {
      unmountControl();
      return;
    }
    if (!control) {
      mountControl();
    }
    applyStoredMode(enabled);
  }

  /** 管理画面の機能設定を、開いている編集画面にも反映する。 */
  function handleStoredSettingsUpdate(event) {
    const { url, enabled, featureEnabled } = event.detail || {};
    if (
      url !== getSettingsUrl() ||
      typeof enabled !== "boolean" ||
      typeof featureEnabled !== "boolean"
    ) {
      return;
    }

    pochiFeatureEnabled = featureEnabled;
    if (!featureEnabled) {
      unmountControl();
      return;
    }

    if (!control) {
      settingsResolved = true;
      mountControl();
    }
    applyStoredMode(enabled);
  }

  /** iPhone風トグルを画面右上へ追加する。 */
  function mountControl() {
    if (control || !pochiFeatureEnabled || !TARGET_PATH.test(location.pathname)) {
      return;
    }

    control = document.createElement("div");
    activePath = location.pathname;
    control.className = CONTROL_CLASS;
    control.title = "次のロケーションを選ぶと、直前に新しく選んだロケーションを削除します";

    const infoLink = document.createElement("a");
    infoLink.className = "mma-pochipochi-info";
    infoLink.href = INFO_URL;
    infoLink.target = "_blank";
    infoLink.rel = "noopener noreferrer";
    infoLink.textContent = "i";
    infoLink.setAttribute("aria-label", "ぽちぽちモードの説明を開く");
    infoLink.title = "ぽちぽちモードの説明";

    const toggle = document.createElement("label");
    toggle.className = "mma-pochipochi-toggle";

    const label = document.createElement("span");
    label.className = "mma-pochipochi-label";
    label.textContent = "ぽちぽちモード";

    input = document.createElement("input");
    input.type = "checkbox";
    input.className = "mma-pochipochi-input";
    input.setAttribute("aria-label", "ぽちぽちモード");
    input.addEventListener("change", () => {
      cancelStoredInitialization();
      settingsResolved = true;
      const enabled = input.checked;
      if (setModeEnabled(enabled)) {
        saveStoredSetting(enabled);
      }
    });

    const track = document.createElement("span");
    track.className = "mma-pochipochi-switch";
    track.setAttribute("aria-hidden", "true");

    toggle.append(label, input, track);
    control.append(infoLink, toggle);
    document.body.append(control);
    requestStoredSetting();
  }

  function unmountControl() {
    cancelStoredInitialization();
    setModeEnabled(false);
    control?.remove();
    control = null;
    input = null;
    currentLocation = null;
    activePath = "";
    settingsResolved = false;
    previouslySelectedKeys.clear();
  }

  /** SPA遷移とStreet ViewのDOM再生成を同じ監視で追跡する。 */
  function reconcile() {
    const isTargetPage =
      TARGET_PATH.test(location.pathname) && document.querySelector(EDITOR_SELECTOR);
    const wasMounted = Boolean(control);
    const pathChanged = Boolean(control && activePath !== location.pathname);

    if (pathChanged) {
      unmountControl();
    }

    if (isTargetPage) {
      mountControl();
      if (!wasMounted || pathChanged) {
        queueInspection();
      }
    } else if (control) {
      unmountControl();
    }
  }

  const mutationObserver = new MutationObserver((mutations) => {
    reconcile();

    if (!control) {
      return;
    }

    const panoramaRemoved = mutations.some((mutation) =>
      [...mutation.removedNodes].some(
        (node) =>
          node instanceof Element &&
          (node.matches(PANORAMA_SELECTOR) || node.querySelector(PANORAMA_SELECTOR))
      )
    );

    if (
      panoramaRemoved &&
      !document.querySelector(PANORAMA_SELECTOR) &&
      modeEnabled &&
      currentLocation &&
      transientLocationKey === currentLocation.key
    ) {
      // 拡張機能自身のDeleteでは対象キーを先に解除するため、ここには到達しない。
      protectLocation(currentLocation);
      transientLocationKey = null;
    }

    const panoramaChanged = mutations.some((mutation) => {
      const target = mutation.target;
      if (target instanceof Element && target.closest(PANORAMA_SELECTOR)) {
        return true;
      }

      return [...mutation.addedNodes, ...mutation.removedNodes].some(
        (node) =>
          node instanceof Element &&
          (node.matches(PANORAMA_SELECTOR) || node.querySelector(PANORAMA_SELECTOR))
      );
    });

    if (panoramaChanged) {
      queueInspection();
    }
  });

  mutationObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["href", "pano"],
    childList: true,
    subtree: true
  });

  document.addEventListener("pointerdown", handleMapPointerDown, true);
  document.addEventListener("pointermove", handleMapPointerMove, true);
  document.addEventListener("pointerup", handleMapPointerUp, true);
  document.addEventListener("pointercancel", handleMapPointerCancel, true);
  document.addEventListener("click", handleLocationDelete, true);
  document.addEventListener("click", handleMapClick, true);
  document.addEventListener(SETTINGS_RESPONSE_EVENT, handleStoredSetting);
  document.addEventListener(SETTINGS_UPDATE_EVENT, handleStoredSettingsUpdate);
  document.addEventListener(SETTINGS_READY_EVENT, requestStoredSetting);

  reconcile();
  requestStoredSetting();
})();
