import fs from "node:fs";
import path from "node:path";

// Unpacked版と本番版を拡張機能一覧で見分けられるよう、
// コピー済みロケールファイルの拡張機能名にだけ接頭辞を付ける。
// ソースの_locales/*/messages.jsonは変更しない（Chrome Web Store提出物に影響させないため）。
const UNPACKED_NAME_PREFIX = "[Unpacked] ";
const LOCALE_CODES = ["ja", "en"];

const targetDir = process.argv[2];
if (!targetDir) {
  throw new Error("Usage: node prefix-unpacked-name.mjs <unpacked-dir>");
}

for (const code of LOCALE_CODES) {
  const messagesPath = path.join(targetDir, "_locales", code, "messages.json");
  const messages = JSON.parse(fs.readFileSync(messagesPath, "utf8"));

  if (!messages.extName?.message) {
    throw new Error(`${messagesPath} is missing extName.message`);
  }

  if (!messages.extName.message.startsWith(UNPACKED_NAME_PREFIX)) {
    messages.extName.message = `${UNPACKED_NAME_PREFIX}${messages.extName.message}`;
  }

  fs.writeFileSync(messagesPath, `${JSON.stringify(messages, null, 2)}\n`);
}
