(() => {
  "use strict";

  const TARGET_PATH = /^\/maps\/\d+\/?$/;
  const META_SELECTOR = "script#map-meta";
  const FEATURE_KEY = "mma-feature-heading-direction-enabled";
  const FORWARDS = "forwards";
  const RETRY = "retry";
  const DONE = "done";

  /**
   * Map Making Appは、マップ編集画面の初期データを`<script type="application/json" id="map-meta">`へ
   * 埋め込んだうえで、ページ本体のモジュールスクリプトから読み込む。モジュールスクリプトはHTMLの解析が
   * 終わってから実行されるため、`document_start`で解析中のこの要素を捕まえれば、サイトが読む前に差し替えられる。
   */
  let metaElement = null;
  let featureEnabled = null;
  let finished = false;
  let observer = null;

  /**
   * 地点の向き（heading）は、`preferDirection`が未設定のときだけ道路リンクの先頭から決まる。
   * 道路リンクの並び順は進行方向を表さないため、約半数の地点が進行方向と逆を向いて作られてしまう。
   * `preferDirection`へ`forwards`を入れると、Map Making App自身がパノラマの撮影方向を使う経路へ切り替わる。
   */
  function applyForwards(element) {
    let meta;
    try {
      meta = JSON.parse(element.textContent);
    } catch {
      /**
       * 解析中の要素は、終了タグへ到達する前から存在する。中身が途中までしか入っていない場合は
       * 解析に失敗するため、確定していないものとして扱い、続きが入るのを待つ。
       */
      return RETRY;
    }

    const settings = meta?.settings;
    if (!settings || typeof settings !== "object") {
      return DONE;
    }

    /**
     * 設定画面のDirectionには「未設定」を選ぶ選択肢がなく、nullはユーザーが一度も選んでいない状態だけを表す。
     * 明示的に選ばれた値（backwards、north等）には介入しない。
     */
    if (settings.preferDirection != null) {
      return DONE;
    }

    settings.preferDirection = FORWARDS;
    element.textContent = JSON.stringify(meta);
    return DONE;
  }

  function stopObserving() {
    finished = true;
    observer?.disconnect();
    observer = null;
    document.removeEventListener("DOMContentLoaded", handleParsed);
  }

  /** 要素の発見と設定の読み込みが揃った時点で差し替える。 */
  function applyWhenReady() {
    if (finished || metaElement === null || featureEnabled === null) {
      return;
    }

    if (featureEnabled && applyForwards(metaElement) === RETRY) {
      return;
    }

    stopObserving();
  }

  /**
   * HTMLの解析が終わる時点で、埋め込みデータが見つかっていなければ差し替えの機会はもう無い。
   * 監視を続けても編集画面を重くするだけなので、そこで打ち切る。
   */
  function handleParsed() {
    applyWhenReady();
    stopObserving();
  }

  function handleMutations() {
    if (metaElement === null) {
      const element = document.querySelector(META_SELECTOR);
      if (!element) {
        return;
      }

      metaElement = element;
    }

    // 中身が途中までしか入っていなかった場合は、解析できるようになるまで毎回試し直す。
    applyWhenReady();
  }

  if (!TARGET_PATH.test(location.pathname)) {
    return;
  }

  /**
   * 設定が読めるまでは差し替えない。読み込みに失敗した場合もOFF扱いにして、サイトの挙動を変えない。
   * ストレージの読み込みはHTMLの解析より十分速いため、通常は要素の発見を待つ側になる。
   */
  chrome.storage.local
    .get([FEATURE_KEY])
    .then((stored) => {
      featureEnabled = stored[FEATURE_KEY] !== false;
    })
    .catch(() => {
      featureEnabled = false;
    })
    .finally(applyWhenReady);

  handleMutations();
  if (!finished) {
    // document_startでは<html>がまだ無い場合があるため、documentそのものを監視する。
    observer = new MutationObserver(handleMutations);
    observer.observe(document, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", handleParsed);
  }
})();
