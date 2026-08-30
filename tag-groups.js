(() => {
  "use strict";

  const EDITOR_SELECTOR = ".page-map-editor";
  const TAG_MANAGER_SELECTOR = ".tag-manager";
  const TARGET_PATH = /^\/maps\/\d+\/?$/;
  const FEATURE_KEY = "mma-feature-tag-groups-enabled";
  const GROUPS_KEY_PREFIX = "mma-tag-groups:";
  const HIDDEN_CLASS = "mma-tag-groups-hidden";
  const ALL_GROUPS = "__all__";
  const UNASSIGNED_GROUP = "";

  let featureEnabled = true;
  let settingsLoaded = false;

  let tagManager = null;
  let tagListEl = null;
  let toolbar = null;
  let tagListObserver = null;
  let groupsData = null;
  let currentMapUrl = "";
  let activeGroupId = ALL_GROUPS;
  let contextInvalidated = false;
  let draggingTagName = null;
  let lastSeenNames = null;

  function storageKey(mapUrl) {
    return `${GROUPS_KEY_PREFIX}${mapUrl}`;
  }

  function isContextInvalidatedError(error) {
    return (
      error instanceof Error &&
      /Extension context invalidated/.test(error.message)
    );
  }

  /**
   * 拡張機能が更新され、既に開いていたタブのcontextが無効化された場合の後始末。
   * chrome.*への呼び出しはこの状態では同期的に例外を投げるため、以後は何もしない。
   */
  function handleContextInvalidated() {
    if (contextInvalidated) {
      return;
    }

    contextInvalidated = true;
    mutationObserver.disconnect();
    detach();
  }

  function readMapUrl() {
    const match = location.pathname.match(/^\/maps\/(\d+)\/?$/);
    return match ? `${location.origin}/maps/${match[1]}` : "";
  }

  /** タグ名の表示テキストから、件数バッジを除いた名前だけを取り出す。 */
  function getTagName(textEl) {
    const clone = textEl.cloneNode(true);
    for (const small of clone.querySelectorAll("small")) {
      small.remove();
    }
    return clone.textContent.trim();
  }

  function collectNativeTagNames() {
    const names = new Set();
    if (!tagListEl) {
      return names;
    }

    for (const li of tagListEl.querySelectorAll(":scope > li.tag.has-button")) {
      const textEl = li.querySelector(".tag__text");
      const name = textEl ? getTagName(textEl) : "";
      if (name) {
        names.add(name);
      }
    }

    return names;
  }

  /** Tagsパネル自体の検索欄（絞り込み中はタグが一時的に消えて見えるため区別に使う）。 */
  function getNativeFilterQuery() {
    const input = tagManager?.querySelector(".tool-block__header input.input");
    return input instanceof HTMLInputElement ? input.value.trim() : "";
  }

  /**
   * 新しく現れたタグを未分類として登録簿へ追加する。
   * さらに、Tagsパネルの検索欄が空（＝一覧が絞り込まれていない）ときに限り、
   * 一覧から消えたタグ（自発的な削除・紐づくロケーションが0件になった自動削除の両方）を
   * 登録簿から取り除く。検索中は一時的に見えていないだけの可能性があるため取り除かない。
   */
  function reconcileKnownTags(names) {
    let changed = false;

    for (const name of names) {
      if (!Object.hasOwn(groupsData.tags, name)) {
        groupsData.tags[name] = { groupId: "" };
        changed = true;
      }
    }

    // namesが0件（読み込み中などの一時的な空振り）のときは判定材料にしない。
    // さらに、2回連続で見えなかったタグだけを「本当に消えた」とみなして除去する。
    // 1回だけの空振り（読み込み途中の部分描画など）では誤って削除しないようにするため。
    if (names.size > 0 && getNativeFilterQuery() === "") {
      if (lastSeenNames) {
        for (const name of Object.keys(groupsData.tags)) {
          if (!names.has(name) && !lastSeenNames.has(name)) {
            delete groupsData.tags[name];
            changed = true;
          }
        }
      }
      lastSeenNames = names;
    }

    return changed;
  }

  function persistGroupsData() {
    if (!currentMapUrl || !groupsData || contextInvalidated) {
      return;
    }

    try {
      chrome.storage.local
        .set({ [storageKey(currentMapUrl)]: groupsData })
        .catch((error) => {
          if (isContextInvalidatedError(error)) {
            handleContextInvalidated();
          }
          // それ以外の一時的な保存失敗でも、表示中の状態はそのまま維持する。
        });
    } catch (error) {
      if (isContextInvalidatedError(error)) {
        handleContextInvalidated();
      }
    }
  }

  /** 読み込みに失敗した場合はnullを返す。contextの無効化時は空データで上書きしない。 */
  async function loadGroupsData(mapUrl) {
    try {
      const key = storageKey(mapUrl);
      const stored = await chrome.storage.local.get(key);
      const data = stored[key];
      if (
        data &&
        Array.isArray(data.groups) &&
        data.tags &&
        typeof data.tags === "object"
      ) {
        return {
          groups: data.groups
            .filter(
              (group) =>
                group &&
                typeof group.id === "string" &&
                typeof group.name === "string"
            )
            .map((group) => ({ id: group.id, name: group.name })),
          tags: { ...data.tags },
        };
      }
      return { groups: [], tags: {} };
    } catch (error) {
      if (isContextInvalidatedError(error)) {
        handleContextInvalidated();
        return null;
      }
      // それ以外の読み込み失敗は空の状態から開始する。
      return { groups: [], tags: {} };
    }
  }

  /** 選択中グループに属さないタグを、元の一覧の中で非表示にする。DOM構造は変更しない。 */
  function applyFilter() {
    if (!tagListEl) {
      return;
    }

    for (const li of tagListEl.querySelectorAll(":scope > li.tag.has-button")) {
      const textEl = li.querySelector(".tag__text");
      const name = textEl ? getTagName(textEl) : "";
      const groupId = groupsData.tags[name]?.groupId || UNASSIGNED_GROUP;
      const matches = activeGroupId === ALL_GROUPS || groupId === activeGroupId;
      li.classList.toggle(HIDDEN_CLASS, !matches);
    }
  }

  function countForGroup(groupId) {
    let count = 0;
    for (const info of Object.values(groupsData.tags)) {
      if ((info.groupId || UNASSIGNED_GROUP) === groupId) {
        count += 1;
      }
    }
    return count;
  }

  function setActiveGroup(groupId) {
    activeGroupId = groupId;
    renderToolbar();
    applyFilter();
  }

  function assignTagToGroup(name, groupId) {
    if (!groupsData.tags[name]) {
      groupsData.tags[name] = { groupId: UNASSIGNED_GROUP };
    }
    if ((groupsData.tags[name].groupId || UNASSIGNED_GROUP) === groupId) {
      return;
    }

    groupsData.tags[name].groupId = groupId;
    persistGroupsData();
    renderToolbar();
    applyFilter();
  }

  /** 同名タグが複数存在する可能性があるため、一致する全てのliを返す。 */
  function findNativeTagLis(name) {
    const matches = [];
    if (!tagListEl) {
      return matches;
    }

    for (const li of tagListEl.querySelectorAll(":scope > li.tag.has-button")) {
      const textEl = li.querySelector(".tag__text");
      if (textEl && getTagName(textEl) === name) {
        matches.push(li);
      }
    }

    return matches;
  }

  function isNativeTagSelected(li) {
    return li.classList.contains("is-selected");
  }

  function getGroupTagNames(groupId) {
    return Object.entries(groupsData.tags)
      .filter(([, info]) => (info.groupId || UNASSIGNED_GROUP) === groupId)
      .map(([name]) => name);
  }

  /**
   * ツールバーの一括選択チェックボックス。タグの紐づけ（グループ所属）は一切変更せず、
   * Map Making App本来の「タグをクリックして選択状態（is-selected、外枠が白い状態）にする」
   * 操作を、そのグループに属するタグ全てに対して代行する。
   * ON：まだ選択されていないタグを全てクリックしたことにする。
   * OFF：選択されているタグを全てクリックして選択解除する。
   */
  function handleSelectAllForGroup(group, shouldSelectAll) {
    for (const name of getGroupTagNames(group.id)) {
      for (const li of findNativeTagLis(name)) {
        const selected = isNativeTagSelected(li);
        if (shouldSelectAll !== selected) {
          li.click();
        }
      }
    }

    // li.click()によるMap Making App側のクラス付与（is-selected）は、
    // このタイミングではまだDOMへ反映されていないことがあるため、
    // 反映後にチェックボックスの見た目を再計算する。
    window.setTimeout(() => {
      if (toolbar) {
        renderToolbar();
      }
    }, 0);
  }

  /** 元の一覧の既存タグ（draggable属性あり）のドラッグ開始・終了だけを横取りせずに検知する。 */
  function handleNativeDragStart(event) {
    const li =
      event.target instanceof Element
        ? event.target.closest("li.tag.has-button")
        : null;
    if (!li || !tagListEl?.contains(li)) {
      return;
    }

    const textEl = li.querySelector(".tag__text");
    const name = textEl ? getTagName(textEl) : "";
    if (name) {
      draggingTagName = name;
    }
  }

  function handleNativeDragEnd() {
    draggingTagName = null;
  }

  /** ツールバーのグループチップを、ドラッグ中のタグの受け皿にする。 */
  function makeDropTarget(element, groupId) {
    element.addEventListener("dragover", (event) => {
      if (!draggingTagName) {
        return;
      }
      event.preventDefault();
      element.classList.add("mma-tag-groups__chip--drop-target");
    });
    element.addEventListener("dragleave", () => {
      element.classList.remove("mma-tag-groups__chip--drop-target");
    });
    element.addEventListener("drop", (event) => {
      event.preventDefault();
      element.classList.remove("mma-tag-groups__chip--drop-target");
      if (!draggingTagName) {
        return;
      }
      assignTagToGroup(draggingTagName, groupId);
      draggingTagName = null;
    });
  }

  /** OSのprompt/confirmを使わない、自前のモーダル土台。 */
  function openModal(titleText) {
    const overlay = document.createElement("div");
    overlay.className = "mma-tag-groups-modal-overlay";

    const panel = document.createElement("div");
    panel.className = "mma-tag-groups-modal";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", titleText);

    const header = document.createElement("div");
    header.className = "mma-tag-groups-modal__header";
    const title = document.createElement("h2");
    title.className = "mma-tag-groups-modal__title";
    title.textContent = titleText;
    header.append(title);

    const body = document.createElement("div");
    body.className = "mma-tag-groups-modal__body";

    const footer = document.createElement("div");
    footer.className = "mma-tag-groups-modal__footer";

    panel.append(header, body, footer);
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

    return { body, footer, close };
  }

  /** IME変換確定のEnterでは発火させず、通常のEnterだけをハンドラへ渡す。 */
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

  /** 名前入力用の共通フォーム（グループ作成・名前変更で使う）。 */
  function openNameModal(titleText, initialValue, onSubmit) {
    const modal = openModal(titleText);

    const label = document.createElement("label");
    label.className = "mma-tag-groups-modal__label";
    label.textContent = "グループ名";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "mma-tag-groups-modal__input";
    input.value = initialValue;
    input.maxLength = 40;
    label.append(input);
    modal.body.append(label);

    function submit() {
      const trimmed = input.value.trim();
      if (!trimmed) {
        input.focus();
        return;
      }
      onSubmit(trimmed);
      modal.close();
    }

    onEnterKey(input, submit);

    modal.footer.append(
      createModalButton(
        "キャンセル",
        "mma-tag-groups-modal__button",
        modal.close
      ),
      createModalButton(
        "保存",
        "mma-tag-groups-modal__button mma-tag-groups-modal__button--primary",
        submit
      )
    );

    window.setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }

  function handleAddGroup() {
    openNameModal("新しいタググループ", "", (name) => {
      groupsData.groups.push({ id: crypto.randomUUID(), name });
      persistGroupsData();
      renderToolbar();
    });
  }

  /**
   * グループ名の変更と、タグの紐づけ（部分一致フィルター・一括選択つきのチェックボックス）を
   * 1つのモーダルにまとめて編集する。
   */
  function handleEditGroup(group) {
    const modal = openModal("グループを編集");

    const nameLabel = document.createElement("label");
    nameLabel.className = "mma-tag-groups-modal__label";
    nameLabel.textContent = "グループ名";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "mma-tag-groups-modal__input";
    nameInput.value = group.name;
    nameInput.maxLength = 40;
    nameLabel.append(nameInput);
    modal.body.append(nameLabel);
    onEnterKey(nameInput, submit);

    const allNames = Object.keys(groupsData.tags);
    const rows = [];

    if (allNames.length === 0) {
      const empty = document.createElement("p");
      empty.className = "mma-tag-groups-modal__message";
      empty.textContent =
        "まだタグがありません。Map Making App側でタグを追加すると、ここに表示されます。";
      modal.body.append(empty);
    } else {
      const filterLabel = document.createElement("label");
      filterLabel.className = "mma-tag-groups-modal__label";
      filterLabel.textContent = "タグを検索（部分一致）";
      const filterInput = document.createElement("input");
      filterInput.type = "text";
      filterInput.className = "mma-tag-groups-modal__input";
      filterInput.placeholder = "タグ名の一部を入力";
      filterLabel.append(filterInput);
      modal.body.append(filterLabel);

      const selectAllRow = document.createElement("label");
      selectAllRow.className =
        "mma-tag-groups-modal__check-row mma-tag-groups-modal__check-row--all";
      const selectAllCheckbox = document.createElement("input");
      selectAllCheckbox.type = "checkbox";
      const selectAllText = document.createElement("span");
      selectAllText.textContent = "表示中のタグをまとめて選択／解除";
      selectAllRow.append(selectAllCheckbox, selectAllText);
      modal.body.append(selectAllRow);

      const list = document.createElement("div");
      list.className = "mma-tag-groups-modal__checklist";
      modal.body.append(list);

      const sortedNames = allNames.sort((left, right) => {
        const leftFree =
          groupsData.tags[left].groupId === UNASSIGNED_GROUP ||
          groupsData.tags[left].groupId === group.id;
        const rightFree =
          groupsData.tags[right].groupId === UNASSIGNED_GROUP ||
          groupsData.tags[right].groupId === group.id;
        if (leftFree !== rightFree) {
          return leftFree ? -1 : 1;
        }
        return left.localeCompare(right, "ja");
      });

      for (const name of sortedNames) {
        const info = groupsData.tags[name];
        const otherGroup =
          info.groupId && info.groupId !== group.id
            ? groupsData.groups.find(
                (candidate) => candidate.id === info.groupId
              )
            : null;

        const row = document.createElement("label");
        row.className =
          "mma-tag-groups-modal__check-row" +
          (otherGroup ? " mma-tag-groups-modal__check-row--other" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = info.groupId === group.id;
        checkbox.addEventListener("change", updateSelectAllState);

        const text = document.createElement("span");
        text.textContent = otherGroup
          ? `${name}（${otherGroup.name}に所属中）`
          : name;

        row.append(checkbox, text);
        list.append(row);
        rows.push({ name, row, checkbox });
      }

      function updateSelectAllState() {
        const visible = rows.filter((entry) => !entry.row.hidden);
        selectAllCheckbox.disabled = visible.length === 0;
        selectAllCheckbox.checked =
          visible.length > 0 &&
          visible.every((entry) => entry.checkbox.checked);
      }

      filterInput.addEventListener("input", () => {
        const query = filterInput.value.trim().toLocaleLowerCase();
        for (const entry of rows) {
          entry.row.hidden =
            query.length > 0 && !entry.name.toLocaleLowerCase().includes(query);
        }
        updateSelectAllState();
      });

      selectAllCheckbox.addEventListener("change", () => {
        const shouldCheck = selectAllCheckbox.checked;
        for (const entry of rows) {
          if (!entry.row.hidden) {
            entry.checkbox.checked = shouldCheck;
          }
        }
      });

      updateSelectAllState();
    }

    function submit() {
      const trimmedName = nameInput.value.trim();
      if (!trimmedName) {
        nameInput.focus();
        return;
      }

      group.name = trimmedName;
      for (const entry of rows) {
        const info = groupsData.tags[entry.name];
        if (entry.checkbox.checked) {
          info.groupId = group.id;
        } else if (info.groupId === group.id) {
          info.groupId = "";
        }
      }

      persistGroupsData();
      renderToolbar();
      applyFilter();
      modal.close();
    }

    modal.footer.append(
      createModalButton(
        "キャンセル",
        "mma-tag-groups-modal__button",
        modal.close
      ),
      createModalButton(
        "保存",
        "mma-tag-groups-modal__button mma-tag-groups-modal__button--primary",
        submit
      )
    );

    window.setTimeout(() => {
      nameInput.focus();
      nameInput.select();
    }, 0);
  }

  function handleDeleteGroup(group) {
    const modal = openModal("グループを削除しますか？");
    const message = document.createElement("p");
    message.className = "mma-tag-groups-modal__message";
    message.textContent = `「${group.name}」を削除します。所属していたタグは未分類に戻ります。`;
    modal.body.append(message);

    function submit() {
      groupsData.groups = groupsData.groups.filter(
        (candidate) => candidate.id !== group.id
      );
      for (const info of Object.values(groupsData.tags)) {
        if (info.groupId === group.id) {
          info.groupId = "";
        }
      }
      if (activeGroupId === group.id) {
        activeGroupId = ALL_GROUPS;
      }

      persistGroupsData();
      renderToolbar();
      applyFilter();
      modal.close();
    }

    modal.footer.append(
      createModalButton(
        "キャンセル",
        "mma-tag-groups-modal__button",
        modal.close
      ),
      createModalButton(
        "削除",
        "mma-tag-groups-modal__button mma-tag-groups-modal__button--danger",
        submit
      )
    );
  }

  /** ツールバーは操作イベント発生時にだけ再構築し、DOM監視からは呼び出さない。 */
  function renderToolbar() {
    if (!toolbar || !groupsData) {
      return;
    }

    toolbar.replaceChildren();

    const title = document.createElement("span");
    title.className = "mma-tag-groups__title";
    title.textContent = "グループで絞り込み（タグをドラッグして紐づけ）:";
    toolbar.append(title);

    const allChip = document.createElement("button");
    allChip.type = "button";
    allChip.className =
      "mma-tag-groups__chip" +
      (activeGroupId === ALL_GROUPS ? " is-active" : "");
    allChip.textContent = "すべて";
    allChip.addEventListener("click", () => setActiveGroup(ALL_GROUPS));
    toolbar.append(allChip);

    const unassignedChip = document.createElement("button");
    unassignedChip.type = "button";
    unassignedChip.className =
      "mma-tag-groups__chip" +
      (activeGroupId === UNASSIGNED_GROUP ? " is-active" : "");
    unassignedChip.textContent = `未分類 (${countForGroup(UNASSIGNED_GROUP)})`;
    unassignedChip.title =
      "未分類のタグで絞り込み（タグをドロップすると未分類に戻します）";
    unassignedChip.addEventListener("click", () =>
      setActiveGroup(UNASSIGNED_GROUP)
    );
    makeDropTarget(unassignedChip, UNASSIGNED_GROUP);
    toolbar.append(unassignedChip);

    for (const group of groupsData.groups) {
      const wrap = document.createElement("span");
      wrap.className = "mma-tag-groups__chip-wrap";

      const filterButton = document.createElement("button");
      filterButton.type = "button";
      filterButton.className =
        "mma-tag-groups__chip" +
        (activeGroupId === group.id ? " is-active" : "");
      filterButton.textContent = `${group.name} (${countForGroup(group.id)})`;
      filterButton.title = `「${group.name}」で絞り込み（タグをドロップして紐づけ）`;
      filterButton.addEventListener("click", () => setActiveGroup(group.id));
      makeDropTarget(filterButton, group.id);

      const selectAllLabel = document.createElement("label");
      selectAllLabel.className = "mma-tag-groups__select-all";
      const groupTagNames = getGroupTagNames(group.id);
      const groupTagLis = groupTagNames.flatMap((name) =>
        findNativeTagLis(name)
      );
      const selectAllChecked =
        groupTagLis.length > 0 &&
        groupTagLis.every((li) => isNativeTagSelected(li));
      const selectAllCheckbox = document.createElement("input");
      selectAllCheckbox.type = "checkbox";
      selectAllCheckbox.checked = selectAllChecked;
      selectAllCheckbox.disabled = groupTagNames.length === 0;
      selectAllCheckbox.title = selectAllChecked
        ? `「${group.name}」のタグを全て選択解除`
        : `「${group.name}」のタグをまだ選択されていない分も含めて全て選択状態にする`;
      selectAllCheckbox.addEventListener("click", (event) =>
        event.stopPropagation()
      );
      selectAllCheckbox.addEventListener("change", () =>
        handleSelectAllForGroup(group, selectAllCheckbox.checked)
      );
      selectAllLabel.append(selectAllCheckbox);

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "mma-tag-groups__edit";
      editButton.textContent = "✎";
      editButton.title = "グループ名・所属タグを編集";
      editButton.addEventListener("click", () => handleEditGroup(group));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "mma-tag-groups__delete";
      deleteButton.textContent = "×";
      deleteButton.title = "グループを削除";
      deleteButton.addEventListener("click", () => handleDeleteGroup(group));

      wrap.append(filterButton, selectAllLabel, editButton, deleteButton);
      toolbar.append(wrap);
    }

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "mma-tag-groups__add";
    addButton.textContent = "＋ グループを追加";
    addButton.addEventListener("click", handleAddGroup);
    toolbar.append(addButton);
  }

  /** タグ管理パネルへ、グループ絞り込み用のツールバーを追加する。 */
  async function attach(nextTagManager, mapUrl) {
    const localTagListEl = nextTagManager.querySelector(".tag-list");
    const localContentEl = nextTagManager.querySelector(".tool-block__content");
    if (!localTagListEl || !localContentEl) {
      return;
    }

    tagManager = nextTagManager;
    tagListEl = localTagListEl;
    currentMapUrl = mapUrl;
    activeGroupId = ALL_GROUPS;

    toolbar = document.createElement("div");
    toolbar.className = "mma-tag-groups";
    localContentEl.insertBefore(toolbar, tagListEl);

    // 一覧の増減を検知し、新規タグの登録・消えたタグの除去・絞り込みの再適用を行う。
    // クラス切り替え自体は監視対象（childList）外なので無限ループにはならない。
    tagListObserver = new MutationObserver(() => {
      if (reconcileKnownTags(collectNativeTagNames())) {
        persistGroupsData();
        renderToolbar();
      }
      applyFilter();
    });
    tagListObserver.observe(tagListEl, { childList: true });

    // 元の一覧のドラッグ操作自体は横取りせず、どのタグがドラッグされたかだけを検知する。
    tagListEl.addEventListener("dragstart", handleNativeDragStart);
    tagListEl.addEventListener("dragend", handleNativeDragEnd);

    const loaded = await loadGroupsData(mapUrl);
    if (tagManager !== nextTagManager || loaded === null) {
      return;
    }

    groupsData = loaded;
    // タブを開いた（再アタッチした）時点でも、その間に消えたタグを登録簿から取り除く。
    if (reconcileKnownTags(collectNativeTagNames())) {
      persistGroupsData();
    }
    renderToolbar();
    applyFilter();
  }

  /** 画面遷移やタグパネルの再生成に合わせて、追加した状態を安全に取り除く。 */
  function detach() {
    tagListObserver?.disconnect();
    tagListObserver = null;

    if (tagListEl) {
      tagListEl.removeEventListener("dragstart", handleNativeDragStart);
      tagListEl.removeEventListener("dragend", handleNativeDragEnd);
      for (const li of tagListEl.querySelectorAll(`.${HIDDEN_CLASS}`)) {
        li.classList.remove(HIDDEN_CLASS);
      }
    }

    draggingTagName = null;
    lastSeenNames = null;
    toolbar?.remove();
    toolbar = null;
    tagManager = null;
    tagListEl = null;
    groupsData = null;
    currentMapUrl = "";
    activeGroupId = ALL_GROUPS;
  }

  function reconcile() {
    if (contextInvalidated) {
      return;
    }

    const isTargetPage =
      settingsLoaded && featureEnabled && TARGET_PATH.test(location.pathname);
    const editorEl = isTargetPage
      ? document.querySelector(EDITOR_SELECTOR)
      : null;
    const nextTagManager = editorEl
      ? editorEl.querySelector(TAG_MANAGER_SELECTOR)
      : null;
    const nextMapUrl = isTargetPage ? readMapUrl() : "";

    if (
      tagManager &&
      (tagManager !== nextTagManager ||
        !tagManager.isConnected ||
        currentMapUrl !== nextMapUrl)
    ) {
      detach();
    }

    if (!tagManager && nextTagManager && nextMapUrl) {
      attach(nextTagManager, nextMapUrl);
    }
  }

  const mutationObserver = new MutationObserver(reconcile);
  mutationObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (Object.hasOwn(changes, FEATURE_KEY)) {
      settingsLoaded = true;
      featureEnabled = changes[FEATURE_KEY].newValue !== false;
      reconcile();
    }

    if (currentMapUrl && Object.hasOwn(changes, storageKey(currentMapUrl))) {
      const nextValue = changes[storageKey(currentMapUrl)].newValue;
      if (
        nextValue &&
        Array.isArray(nextValue.groups) &&
        nextValue.tags &&
        JSON.stringify(nextValue) !== JSON.stringify(groupsData)
      ) {
        groupsData = { groups: nextValue.groups, tags: { ...nextValue.tags } };
        renderToolbar();
        applyFilter();
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
        // それ以外の読み込み失敗は従来どおり有効として動作する。
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
