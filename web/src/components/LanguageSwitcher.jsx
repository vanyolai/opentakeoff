import { useTranslation } from "react-i18next";
import { normalizeLanguage, SUPPORTED_LANGUAGES } from "../i18n/index.js";

export default function LanguageSwitcher({ compact = false }) {
  const { t, i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage || i18n.language) || "en";
  return (
    <label title={t("language.label")} style={{ display: "inline-flex", alignItems: "center", gap: compact ? 0 : 6, fontSize: 12, color: "var(--ink-muted)" }}>
      {!compact && <span>{t("language.label")}</span>}
      <select name="ui-language" aria-label={t("language.label")} value={language}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
        style={{ minHeight: compact ? 28 : 32, padding: compact ? "2px 5px" : "4px 7px", border: "1px solid var(--ink-faint)", background: "var(--paper-bright)", color: "var(--ink)", fontSize: 12, cursor: "pointer" }}>
        {SUPPORTED_LANGUAGES.map((code) => <option key={code} value={code}>{t(code === "hu" ? "language.hungarian" : "language.english")}</option>)}
      </select>
    </label>
  );
}
