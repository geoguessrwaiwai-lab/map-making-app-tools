(() => {
  "use strict";

  const EDITOR_SELECTOR = ".page-map-editor";
  const TARGET_PATH = /^\/maps\/\d+\/?$/;
  const MIN_PERCENT = 25;
  const MAX_PERCENT = 75;
  const DEFAULT_PERCENT = 50;
  const WORK_AREA_CLASS = "mma-resizable-work-area";
  const SUPPORTED_VIEWPORT = window.matchMedia("(min-width: 801px)");
  const SETTINGS_REQUEST_EVENT = "mma-pochipochi-settings-request";
  const SETTINGS_RESPONSE_EVENT = "mma-pochipochi-settings-response";
  const SETTINGS_SAVE_EVENT = "mma-pochipochi-settings-save";
  const SETTINGS_READY_EVENT = "mma-pochipochi-settings-ready";
  const SETTINGS_UPDATE_EVENT = "mma-pochipochi-settings-update";
  const SETTINGS_KEY_PREFIX = "mma-pochipochi-default:";
  const RESIZE_FEATURE_KEY = "mma-feature-screen-resize-enabled";
  const POCHIPOCHI_FEATURE_KEY = "mma-feature-pochipochi-enabled";
  const POCHIPOCHI_DEFAULT_KEY = "mma-pochipochi-default-enabled";

  let editor = null;
  let handle = null;
  let resizeObserver = null;
  let dragging = false;
  let leftPercent = DEFAULT_PERCENT;
  let previousInlineColumns = "";
  let previousInlinePriority = "";
  let resizeFeatureEnabled = true;
  let settingsLoaded = false;

  /** 数値を左側の画面領域に許可する25%〜75%の範囲へ収める。 */
  function clampPercent(value) {
    return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, value));
  }

  /** 現在のカラム間隔をピクセル値で取得する。 */
  function getColumnGap() {
    if (!editor) {
      return 0;
    }

    const gap = Number.parseFloat(getComputedStyle(editor).columnGap);
    return Number.isFinite(gap) ? gap : 0;
  }

  /** 指定した割合をグリッドへ反映し、ハンドルの表示位置も更新する。 */
  function applyPercent(percent) {
    if (!editor) {
      return;
    }

    leftPercent = clampPercent(percent);
    editor.style.setProperty(
      "grid-template-columns",
      `minmax(0, ${leftPercent}fr) minmax(0, ${100 - leftPercent}fr)`
    );
    handle?.setAttribute("aria-valuenow", String(Math.round(leftPercent)));
    positionHandle();
  }

  /** グリッドの中央境界へ、固定配置のドラッグハンドルを重ねる。 */
  function positionHandle() {
    if (!editor || !handle || !editor.isConnected) {
      return;
    }

    const rect = editor.getBoundingClientRect();
    const gap = getColumnGap();
    const availableWidth = Math.max(0, rect.width - gap);
    const boundary = rect.left + availableWidth * (leftPercent / 100) + gap / 2;

    handle.style.left = `${boundary - handle.offsetWidth / 2}px`;
    handle.style.top = `${rect.top}px`;
    handle.style.height = `${rect.height}px`;
  }

  /** マウスポインターのX座標を、左側の画面領域の割合へ変換する。 */
  function percentFromClientX(clientX) {
    const rect = editor.getBoundingClientRect();
    const gap = getColumnGap();
    const availableWidth = Math.max(1, rect.width - gap);
    return ((clientX - rect.left - gap / 2) / availableWidth) * 100;
  }

  function handlePointerDown(event) {
    if (event.button !== 0 || !editor) {
      return;
    }

    dragging = true;
    handle.dataset.dragging = "true";
    document.documentElement.classList.add("mma-is-resizing");
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handlePointerMove(event) {
    if (!dragging || !editor) {
      return;
    }

    applyPercent(percentFromClientX(event.clientX));
    event.preventDefault();
  }

  function finishDragging() {
    if (!dragging) {
      return;
    }

    dragging = false;
    handle?.removeAttribute("data-dragging");
    document.documentElement.classList.remove("mma-is-resizing");
  }

  /** フォーカス中は矢印キーでも境界を移動できるようにする。 */
  function handleKeyDown(event) {
    const amount = event.shiftKey ? 5 : 1;
    let nextPercent = null;

    if (event.key === "ArrowLeft") {
      nextPercent = leftPercent - amount;
    } else if (event.key === "ArrowRight") {
      nextPercent = leftPercent + amount;
    } else if (event.key === "Home") {
      nextPercent = MIN_PERCENT;
    } else if (event.key === "End") {
      nextPercent = MAX_PERCENT;
    }

    if (nextPercent !== null) {
      applyPercent(nextPercent);
      event.preventDefault();
    }
  }

  /** 右カラムを、その実幅に応じたレスポンシブ表示の基準として記録する。 */
  function markWorkArea() {
    if (!editor) {
      return;
    }

    for (const child of editor.children) {
      const gridArea = getComputedStyle(child).gridArea;
      child.classList.toggle(
        WORK_AREA_CLASS,
        gridArea.split("/").some((area) => area.trim() === "work-area")
      );
    }
  }

  /** 対象の編集画面へハンドルを取り付ける。 */
  function attach(nextEditor) {
    editor = nextEditor;
    previousInlineColumns = editor.style.getPropertyValue("grid-template-columns");
    previousInlinePriority = editor.style.getPropertyPriority("grid-template-columns");
    markWorkArea();

    handle = document.createElement("div");
    handle.className = "mma-resize-handle";
    handle.setAttribute("role", "separator");
    handle.setAttribute("aria-orientation", "vertical");
    handle.setAttribute("aria-label", "左右の画面幅を変更");
    handle.setAttribute("aria-valuemin", String(MIN_PERCENT));
    handle.setAttribute("aria-valuemax", String(MAX_PERCENT));
    handle.tabIndex = 0;
    handle.addEventListener("pointerdown", handlePointerDown);
    handle.addEventListener("pointermove", handlePointerMove);
    handle.addEventListener("pointerup", finishDragging);
    handle.addEventListener("pointercancel", finishDragging);
    handle.addEventListener("lostpointercapture", finishDragging);
    handle.addEventListener("keydown", handleKeyDown);
    document.body.append(handle);

    resizeObserver = new ResizeObserver(positionHandle);
    resizeObserver.observe(editor);
    window.addEventListener("scroll", positionHandle, true);
    window.addEventListener("resize", positionHandle);
    applyPercent(DEFAULT_PERCENT);
  }

  /** ページ遷移やDOM再生成時に、追加した状態を安全に取り除く。 */
  function detach() {
    finishDragging();
    resizeObserver?.disconnect();
    resizeObserver = null;
    window.removeEventListener("scroll", positionHandle, true);
    window.removeEventListener("resize", positionHandle);

    if (editor?.isConnected) {
      for (const child of editor.children) {
        child.classList.remove(WORK_AREA_CLASS);
      }

      if (previousInlineColumns) {
        editor.style.setProperty(
          "grid-template-columns",
          previousInlineColumns,
          previousInlinePriority
        );
      } else {
        editor.style.removeProperty("grid-template-columns");
      }
    }

    handle?.remove();
    handle = null;
    editor = null;
  }

  /** URLとDOMを確認し、SPAの画面遷移や再描画にも追従する。 */
  function reconcile() {
    document.documentElement.classList.toggle(
      "mma-resize-feature-enabled",
      settingsLoaded && resizeFeatureEnabled
    );
    const isTargetPage =
      settingsLoaded &&
      resizeFeatureEnabled &&
      SUPPORTED_VIEWPORT.matches &&
      TARGET_PATH.test(location.pathname);
    const nextEditor = isTargetPage ? document.querySelector(EDITOR_SELECTOR) : null;

    if (editor && (editor !== nextEditor || !editor.isConnected)) {
      detach();
    }

    if (!editor && nextEditor) {
      attach(nextEditor);
    } else if (editor) {
      markWorkArea();
    }
  }

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
      POCHIPOCHI_DEFAULT_KEY
    ]);
    const hasUrlSetting = Object.hasOwn(stored, urlKey);

    return {
      url,
      featureEnabled: stored[POCHIPOCHI_FEATURE_KEY] !== false,
      enabled: hasUrlSetting
        ? stored[urlKey] === true
        : stored[POCHIPOCHI_DEFAULT_KEY] === true,
      hasUrlSetting
    };
  }

  function dispatchPochipochiSettings(eventName, settings) {
    document.dispatchEvent(
      new CustomEvent(eventName, { detail: settings })
    );
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

    if (Object.hasOwn(changes, RESIZE_FEATURE_KEY)) {
      settingsLoaded = true;
      resizeFeatureEnabled = changes[RESIZE_FEATURE_KEY].newValue !== false;
      reconcile();
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

  const mutationObserver = new MutationObserver(reconcile);
  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  SUPPORTED_VIEWPORT.addEventListener("change", reconcile);
  document.addEventListener(SETTINGS_REQUEST_EVENT, handleSettingsRequest);
  document.addEventListener(SETTINGS_SAVE_EVENT, handleSettingsSave);
  chrome.storage.onChanged.addListener(handleStoredSettingsChange);
  document.dispatchEvent(new CustomEvent(SETTINGS_READY_EVENT));

  chrome.storage.local
    .get(RESIZE_FEATURE_KEY)
    .then((stored) => {
      resizeFeatureEnabled = stored[RESIZE_FEATURE_KEY] !== false;
    })
    .catch(() => {
      // 読み込みに失敗した場合は従来どおり有効として動作する。
    })
    .finally(() => {
      settingsLoaded = true;
      reconcile();
    });
})();
