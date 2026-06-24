import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(__dirname, "../.screenshots/fpc-main.css");
const outDir = path.join(__dirname, "../public/icons/tools");

const css = fs.readFileSync(cssPath, "utf8");

// Match .img-* classes with data:image/svg+xml background URLs
const re =
  /\.(img-[a-z0-9-]+)[^{]*\{[^}]*background-image:url\("(data:image\/svg\+xml[^"]+)"\)/g;

const found = {};
let m;
while ((m = re.exec(css)) !== null) {
  found[m[1]] = m[2];
}

fs.mkdirSync(outDir, { recursive: true });

const manifest = {};
for (const [className, dataUri] of Object.entries(found)) {
  const decoded = decodeURIComponent(dataUri.replace(/^data:image\/svg\+xml(;charset=UTF-8)?,/, ""));
  const fileName = className.replace(/^img-/, "") + ".svg";
  fs.writeFileSync(path.join(outDir, fileName), decoded, "utf8");
  manifest[className] = `/icons/tools/${fileName}`;
}

fs.writeFileSync(
  path.join(outDir, "manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log(`Extracted ${Object.keys(found).length} icons to ${outDir}`);
