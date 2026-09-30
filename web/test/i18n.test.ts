import test from "node:test";
import assert from "node:assert/strict";
import i18n, { chooseInitialLanguage, formatDate, formatNumber, normalizeLanguage, resources } from "../src/i18n/index.js";

const leafKeys = (value: unknown, prefix = ""): string[] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key));
};

test("language ids normalize without mixing locale and unit preferences", () => {
  assert.equal(normalizeLanguage("hu-HU"), "hu");
  assert.equal(normalizeLanguage("EN_us"), "en");
  assert.equal(normalizeLanguage("de-DE"), null);
});

test("stored choice wins, then deployment default, browser language and English fallback", () => {
  assert.equal(chooseInitialLanguage({ stored: "en", configured: "hu", browser: "hu-HU" }), "en");
  assert.equal(chooseInitialLanguage({ configured: "hu", browser: "en-US" }), "hu");
  assert.equal(chooseInitialLanguage({ browser: "hu-HU" }), "hu");
  assert.equal(chooseInitialLanguage({ browser: "de-DE" }), "en");
});

test("English and Hungarian catalogs have exactly the same leaf keys", () => {
  const en = leafKeys(resources.en.translation).sort();
  const hu = leafKeys(resources.hu.translation).sort();
  assert.deepEqual(hu, en);
});

test("Hungarian translations and locale formatting are available outside React", () => {
  assert.equal(i18n.t("workspace.report", { lng: "hu" }), "Kimutatás");
  assert.equal(formatNumber(1234.5, { maximumFractionDigits: 1 }, "hu"), "1234,5");
  assert.match(formatDate(new Date("2026-09-29T00:00:00Z"), { timeZone: "UTC" }, "hu"), /2026/);
});
