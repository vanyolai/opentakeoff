import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.js";
import hu from "./locales/hu.js";

export const LANGUAGE_STORAGE_KEY = "opentakeoff.language";
export const SUPPORTED_LANGUAGES = Object.freeze(["en", "hu"]);

export function normalizeLanguage(value) {
  const base = String(value || "").trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : null;
}

export function chooseInitialLanguage({ stored, configured, browser } = {}) {
  return normalizeLanguage(stored)
    || normalizeLanguage(configured)
    || normalizeLanguage(browser)
    || "en";
}

function browserLanguage() {
  if (typeof window === "undefined") return "";
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const configured = import.meta.env?.VITE_DEFAULT_LANGUAGE;
    const browser = window.navigator?.languages?.[0] || window.navigator?.language;
    return chooseInitialLanguage({ stored, configured, browser });
  } catch {
    return chooseInitialLanguage({ browser: window.navigator?.language });
  }
}

export const resources = Object.freeze({
  en: { translation: en },
  hu: { translation: hu },
});

const i18n = i18next.createInstance();
i18n.use(initReactI18next).init({
  resources,
  lng: browserLanguage(),
  fallbackLng: "en",
  supportedLngs: SUPPORTED_LANGUAGES,
  load: "languageOnly",
  initImmediate: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

function applyLanguage(language) {
  const lang = normalizeLanguage(language) || "en";
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.title = i18n.t("app.documentTitle", { lng: lang });
  }
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang); } catch { /* private mode */ }
  }
}

applyLanguage(i18n.resolvedLanguage || i18n.language);
i18n.on("languageChanged", applyLanguage);

export function localeFor(language = i18n.resolvedLanguage || i18n.language) {
  return normalizeLanguage(language) === "hu" ? "hu-HU" : "en-US";
}

export function formatNumber(value, options, language) {
  return new Intl.NumberFormat(localeFor(language), options).format(Number(value) || 0);
}

export function formatDate(value = new Date(), options, language) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(localeFor(language), options).format(date);
}

export default i18n;
