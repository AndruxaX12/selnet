import { readFile, readdir } from "node:fs/promises";
import { resolve, extname } from "node:path";

function flattenKeys(obj, prefix = "") {
  const keys = new Set();
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const nestedKey of flattenKeys(value, path)) {
        keys.add(nestedKey);
      }
    } else {
      keys.add(path);
    }
  }
  return keys;
}

async function loadLocale(filePath) {
  const content = await readFile(filePath, "utf-8");
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${(error)?.message ?? error}`);
  }
}

async function main() {
  const messagesDir = resolve(process.cwd(), "apps/web/messages");
  const files = (await readdir(messagesDir)).filter((file) => extname(file) === ".json");
  if (files.length === 0) {
    throw new Error(`No locale JSON files found in ${messagesDir}`);
  }

  const locales = await Promise.all(
    files.map(async (file) => {
      const locale = file.replace(/\.json$/, "");
      const data = await loadLocale(resolve(messagesDir, file));
      return { locale, data, keys: flattenKeys(data) };
    })
  );

  const [reference, ...rest] = locales;
  const issues = [];

  for (const current of rest) {
    const missing = [...reference.keys].filter((key) => !current.keys.has(key));
    const extra = [...current.keys].filter((key) => !reference.keys.has(key));

    if (missing.length) {
      issues.push(`Locale ${current.locale} missing keys compared to ${reference.locale}:\n  - ${missing.join("\n  - ")}`);
    }
    if (extra.length) {
      issues.push(`Locale ${current.locale} has extra keys not in ${reference.locale}:\n  - ${extra.join("\n  - ")}`);
    }
  }

  if (issues.length) {
    console.error(issues.join("\n\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`i18n check passed for locales: ${locales.map((l) => l.locale).join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
