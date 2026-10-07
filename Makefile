SHELL := /bin/sh

VERSION := $(shell node -p "require('./manifest.json').version")
DIST_DIR := dist
PACKAGE := $(DIST_DIR)/map-making-app-tools-$(VERSION).zip
UNPACKED_DIR := $(DIST_DIR)/map-making-app-tools-unpacked
LOCALES := _locales/ja/messages.json _locales/en/messages.json
SOURCES := manifest.json resize.js pochipochi-bridge.js pochipochi.js tag-color-bridge.js tag-color.js heading-direction.js map-list.js resize.css pochipochi.css map-list.css options.html options.css options.js icon16.png icon32.png icon48.png icon128.png

.PHONY: package unpacked validate format format-check clean

# 構文と参照ファイルを検証してから、Chrome Web Store提出用ZIPを作成する。
package: validate $(PACKAGE)
	@echo "Created: $(PACKAGE)"

# Chromeから直接読み込める、拡張機能に必要なファイルだけのフォルダを作成する。
unpacked: validate
	@rm -rf "$(UNPACKED_DIR)"
	@mkdir -p "$(UNPACKED_DIR)"
	@cp $(SOURCES) "$(UNPACKED_DIR)/"
	@for locale in $(LOCALES); do \
		mkdir -p "$(UNPACKED_DIR)/$$(dirname $$locale)"; \
		cp "$$locale" "$(UNPACKED_DIR)/$$locale"; \
	done
	@node scripts/prefix-unpacked-name.mjs "$(UNPACKED_DIR)"
	@echo "Created: $(UNPACKED_DIR)"

# プロジェクト構造、JavaScript、Manifest、プライバシー上の不変条件、フォーマットを検証する。
validate: format-check
	@node scripts/validate.mjs

# Prettierでフォーマットする。
format:
	@npx prettier --write .

# フォーマットが崩れていないかだけを確認する（書き換えない）。
format-check:
	@npx prettier --check .

$(PACKAGE): $(SOURCES) $(LOCALES)
	@mkdir -p "$(DIST_DIR)"
	@rm -f "$(PACKAGE)"
	@zip -j -q "$(PACKAGE)" $(SOURCES)
	@zip -q "$(PACKAGE)" $(LOCALES)

clean:
	@rm -rf "$(UNPACKED_DIR)"
	@rm -f "$(PACKAGE)"
