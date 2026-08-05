SHELL := /bin/sh

VERSION := $(shell node -p "require('./manifest.json').version")
DIST_DIR := dist
PACKAGE := $(DIST_DIR)/map-making-app-tools-$(VERSION).zip
UNPACKED_DIR := $(DIST_DIR)/map-making-app-tools-unpacked
SOURCES := manifest.json content.js content.css icon16.png icon32.png icon48.png icon128.png

.PHONY: package unpacked validate clean

# 構文と参照ファイルを検証してから、Chrome Web Store提出用ZIPを作成する。
package: validate $(PACKAGE)
	@echo "Created: $(PACKAGE)"

# Chromeから直接読み込める、拡張機能に必要なファイルだけのフォルダを作成する。
unpacked: validate
	@rm -rf "$(UNPACKED_DIR)"
	@mkdir -p "$(UNPACKED_DIR)"
	@cp $(SOURCES) "$(UNPACKED_DIR)/"
	@echo "Created: $(UNPACKED_DIR)"

# プロジェクト構造、JavaScript、Manifest、プライバシー上の不変条件を検証する。
validate:
	@node scripts/validate.mjs

$(PACKAGE): $(SOURCES)
	@mkdir -p "$(DIST_DIR)"
	@rm -f "$(PACKAGE)"
	@zip -j -q "$(PACKAGE)" $(SOURCES)

clean:
	@rm -rf "$(UNPACKED_DIR)"
	@rm -f "$(PACKAGE)"
