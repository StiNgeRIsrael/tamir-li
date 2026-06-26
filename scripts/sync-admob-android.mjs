/**
 * Writes VITE_ADMOB_APP_ID from .env.production.local (or process env)
 * into android/app/src/main/res/values/strings.xml for the native AdMob SDK.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const stringsPath = resolve(root, "android/app/src/main/res/values/strings.xml");

const TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713";

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = {
  ...loadEnvFile(resolve(root, ".env.production.local")),
  ...loadEnvFile(resolve(root, ".env.local")),
  ...process.env,
};

const appId = (env.VITE_ADMOB_APP_ID || TEST_APP_ID).trim();

if (!stringsPath.includes("strings.xml") || !existsSync(stringsPath)) {
  console.error("strings.xml not found:", stringsPath);
  process.exit(1);
}

let xml = readFileSync(stringsPath, "utf8");
const tag = `<string name="admob_app_id">${appId}</string>`;

if (xml.includes('name="admob_app_id"')) {
  xml = xml.replace(/<string name="admob_app_id">[^<]*<\/string>/, tag);
} else {
  xml = xml.replace("</resources>", `    ${tag}\n</resources>`);
}

writeFileSync(stringsPath, xml);
console.log(`AdMob App ID synced to Android strings.xml (${appId.startsWith("ca-app-pub-3940256099942544") ? "Google test ID" : "custom ID"}).`);
