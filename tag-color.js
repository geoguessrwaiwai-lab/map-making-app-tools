(() => {
  "use strict";

  // Map Making Appのタグ更新API。このエンドポイント以外へは一切リクエストしない。
  const TAGS_ENDPOINT_PATTERN =
    /^https:\/\/map-making\.app\/api\/maps\/\d+\/tags$/;
  const FORM_SELECTOR = "form.edit-tag-modal";
  const NAME_INPUT_SELECTOR = ".edit-tag-modal__name input";
  const COLOR_INPUT_SELECTOR = ".edit-tag-modal__color input.hex-color";
  const SETTINGS_REQUEST_EVENT = "mma-tag-color-settings-request";
  const SETTINGS_RESPONSE_EVENT = "mma-tag-color-settings-response";
  const SETTINGS_READY_EVENT = "mma-tag-color-settings-ready";
  const SETTINGS_UPDATE_EVENT = "mma-tag-color-settings-update";
  // 送信直前に読み取った色は、同じ保存操作から出たリクエストにだけ使う。
  const PENDING_EDIT_TTL_MS = 5000;

  let tagColorFeatureEnabled = false;
  let pendingEdit = null;

  /** `#rrggbb`／`#rgb`を、APIが受け取る`[r, g, b]`へ変換する。 */
  function parseHexColor(value) {
    const hex = String(value ?? "")
      .trim()
      .replace(/^#/, "");
    const expanded =
      hex.length === 3
        ? hex.replace(/[0-9a-fA-F]/g, (part) => part + part)
        : hex;
    if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
      return null;
    }

    return [0, 2, 4].map((index) =>
      Number.parseInt(expanded.slice(index, index + 2), 16)
    );
  }

  function readNameFromForm(form) {
    const nameInput = form?.querySelector(NAME_INPUT_SELECTOR);
    return nameInput ? nameInput.value.trim() : "";
  }

  function readColorFromForm(form) {
    const colorInput = form?.querySelector(COLOR_INPUT_SELECTOR);
    return colorInput ? parseHexColor(colorInput.value) : null;
  }

  /**
   * Saveを押した時点のタグ名と色を控える。
   * 送信後にモーダルが閉じてフォームが消えても、意図した色を参照できるようにする。
   */
  function handleTagFormSubmit(event) {
    const form = event.target?.closest?.(FORM_SELECTOR);
    if (!form) {
      return;
    }

    const color = readColorFromForm(form);
    pendingEdit = color
      ? { name: readNameFromForm(form), color, at: Date.now() }
      : null;
  }

  function resolveRequestUrl(input) {
    const raw =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : typeof input?.url === "string"
            ? input.url
            : "";
    if (!raw) {
      return "";
    }

    try {
      return new URL(raw, location.href).href;
    } catch {
      return "";
    }
  }

  function resolveRequestMethod(input, init) {
    const method =
      init?.method ?? (typeof input?.method === "string" ? input.method : "");
    return String(method || "GET").toUpperCase();
  }

  async function readRequestBody(input, init) {
    if (typeof init?.body === "string") {
      return init.body;
    }
    if (init && "body" in init) {
      // FormDataやReadableStreamなど、タグ更新では使われない形は扱わない。
      return "";
    }
    if (input instanceof Request) {
      try {
        return await input.clone().text();
      } catch {
        return "";
      }
    }

    return "";
  }

  /**
   * 「新しい名前: {...}」と「古い名前: null」が同時に入ったリネームのPayloadかどうかを見分ける。
   * 削除（`{名前: null}`のみ）や並び替え・色変更（`{名前: {...}}`のみ）には介入しない。
   */
  function findRenamedTag(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }

    const removed = [];
    const updated = [];
    for (const [name, value] of Object.entries(payload)) {
      if (value === null) {
        removed.push(name);
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        updated.push(name);
      } else {
        // 想定外の形のPayloadには触らない。
        return null;
      }
    }

    if (removed.length === 0 || updated.length !== 1) {
      return null;
    }

    const name = updated[0];
    // 同じ名前の削除と更新が混在する形は、リネームとして扱えない。
    return removed.includes(name) ? null : { name, entry: payload[name] };
  }

  /** リネーム後に確定させたい色を、Saveを押した時点の入力値から決める。 */
  function resolveIntendedColor(newName) {
    if (
      pendingEdit &&
      pendingEdit.name === newName &&
      Date.now() - pendingEdit.at <= PENDING_EDIT_TTL_MS
    ) {
      return pendingEdit.color;
    }

    // モーダルがまだ開いている場合は、その場の入力値を読み直す。
    const form = document.querySelector(FORM_SELECTOR);
    return form && readNameFromForm(form) === newName
      ? readColorFromForm(form)
      : null;
  }

  const nativeFetch = window.fetch;

  /**
   * 色を足したリクエストが拒否されたときに、元のリクエストへ戻して差し支えないステータス。
   * サーバー側のエラーでは、リネームが適用済みかどうか分からないため再送しない。
   */
  const REJECTED_STATUSES = new Set([400, 404, 409, 415, 422]);

  /** 元のリクエストの認証情報・ヘッダー・signalを引き継いだまま、Payloadだけを差し替える。 */
  function buildJsonInit(input, init, payload) {
    const headers = new Headers();
    if (input instanceof Request) {
      for (const [name, value] of input.headers) {
        headers.set(name, value);
      }
    }
    if (init?.headers) {
      for (const [name, value] of new Headers(init.headers)) {
        headers.set(name, value);
      }
    }
    headers.set("content-type", "application/json");

    return {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
      credentials:
        init?.credentials ??
        (input instanceof Request ? input.credentials : "include"),
      signal:
        init?.signal ?? (input instanceof Request ? input.signal : undefined),
    };
  }

  function sendTagsPatch(url, input, init, payload) {
    return nativeFetch.call(window, url, buildJsonInit(input, init, payload));
  }

  /**
   * タグ名を変更すると、Map Making App側でタグが作り直されて色が初期値へ戻る。
   * そのため、リネームのPayloadへ色の指定を足したうえで、同じ宛先へ送り直す。
   * リクエストの本数は増やさない。拒否されたときだけ、元のリクエストへ戻して送る。
   */
  async function keepTagColorThroughRename(url, input, init, renamed, color) {
    if (Array.isArray(renamed.entry.color)) {
      // すでに色が指定されている（名前と色を同時に変更した）場合は、そのまま通す。
      return nativeFetch.call(window, input, init);
    }

    try {
      const retinted = {
        ...renamed.payload,
        [renamed.name]: { ...renamed.entry, color },
      };
      const attempt = await sendTagsPatch(url, input, init, retinted);
      // 未知のフィールドを拒否された場合は、元のリクエストへ戻してリネーム自体を失敗させない。
      if (attempt.ok || !REJECTED_STATUSES.has(attempt.status)) {
        return attempt;
      }
    } catch {
      // 送信自体に失敗した場合も、元のリクエストで送り直す。
    }

    return nativeFetch.call(window, input, init);
  }

  async function fetchKeepingTagColor(input, init) {
    // タグ更新以外のリクエストは、URLの解析も挟まずそのまま通す。
    if (
      !tagColorFeatureEnabled ||
      resolveRequestMethod(input, init) !== "PATCH"
    ) {
      return nativeFetch.call(window, input, init);
    }

    const url = resolveRequestUrl(input);
    if (!TAGS_ENDPOINT_PATTERN.test(url)) {
      return nativeFetch.call(window, input, init);
    }

    let payload = null;
    try {
      payload = JSON.parse(await readRequestBody(input, init));
    } catch {
      payload = null;
    }

    const renamed = findRenamedTag(payload);
    const color = renamed ? resolveIntendedColor(renamed.name) : null;
    if (!renamed || !color) {
      return nativeFetch.call(window, input, init);
    }

    return keepTagColorThroughRename(
      url,
      input,
      init,
      { ...renamed, payload },
      color
    );
  }

  function requestStoredSetting() {
    document.dispatchEvent(new CustomEvent(SETTINGS_REQUEST_EVENT));
  }

  function handleStoredSetting(event) {
    const { featureEnabled } = event.detail || {};
    if (typeof featureEnabled !== "boolean") {
      return;
    }

    tagColorFeatureEnabled = featureEnabled;
  }

  window.fetch = function fetch(input, init) {
    return fetchKeepingTagColor(input, init);
  };
  document.addEventListener("submit", handleTagFormSubmit, true);
  document.addEventListener(SETTINGS_RESPONSE_EVENT, handleStoredSetting);
  document.addEventListener(SETTINGS_UPDATE_EVENT, handleStoredSetting);
  document.addEventListener(SETTINGS_READY_EVENT, requestStoredSetting);
  requestStoredSetting();
})();
