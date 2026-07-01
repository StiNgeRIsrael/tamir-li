/**
 * Sync Capacitor + build signed release AAB (Windows-friendly).
 * Uses Android Studio JBR (JDK 21) — required for Capacitor 8 / Gradle 8.14.
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const jbr =
  process.env.JAVA_HOME ??
  "C:\\Program Files\\Android\\Android Studio\\jbr";

if (!existsSync(resolve(jbr, "bin", "java.exe"))) {
  console.error(
    "JDK 21 not found. Set JAVA_HOME to Android Studio JBR or install JDK 21.",
  );
  process.exit(1);
}

const env = { ...process.env, JAVA_HOME: jbr };

console.log(`Using JAVA_HOME=${jbr}`);
execSync("npm run cap:sync", { cwd: root, stdio: "inherit", env });
execSync("gradlew.bat bundleRelease", {
  cwd: resolve(root, "android"),
  stdio: "inherit",
  env,
  shell: true,
});

const aab = resolve(
  root,
  "android/app/build/outputs/bundle/release/app-release.aab",
);
console.log(`\nRelease bundle: ${aab}`);
