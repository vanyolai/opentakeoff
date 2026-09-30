import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../brand/icons.jsx";
import { keyText } from "../lib/keys.ts";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import "./workspaceChrome.css";

// Workspace chrome. All actions are supplied by the existing canvas;
// this component owns only navigation, search and disclosure state.
export function WorkspaceChrome({ title, onOpen, onNavigate, navigationOpen, onTakeoffs, takeoffsOpen,
  onWork, workOpen, workButtonRef, pending, running, onReport, onFocus, onClassic,
  onControls, controlsOpen, onSearch, pinControl, panelTools, layoutMenu, fileMenu, scaleMenu, conditionControl, aids, history, action }) {
  const { t } = useTranslation();
  return <>
    <header className="calm-header">
      <strong className="calm-brand">open<span>takeoff</span></strong>
      <div className="calm-project" title={title}><span>{title || t("workspace.untitled")}</span><small>{t("workspace.compact")}</small></div>
      <div className="calm-header-actions">
        <button type="button" onClick={onOpen} title={t("workspace.openPlans")}><Icon name="plus" size={16} /><span>{t("common.open")}</span></button>
        {fileMenu}
        <button type="button" aria-pressed={navigationOpen} onClick={onNavigate}><Icon name="sheets" size={16} />{t("workspace.sheets")}</button>
        {pinControl}
        <button type="button" onClick={onSearch} className="calm-search-trigger" title={t("workspace.findAction")}><Icon name="search" size={16} /><span>{t("workspace.findAction")}</span><kbd>{keyText("⌘K")}</kbd></button>
        <button type="button" aria-pressed={takeoffsOpen} onClick={onTakeoffs} title={t("workspace.quantitiesTitle")}><Icon name="product" size={16} />{t("workspace.quantities")}</button>
        <button type="button" ref={workButtonRef} aria-expanded={workOpen} onClick={onWork} className="calm-work">{t("workspace.work")}{running ? <span className="calm-badge">{t("workspace.running")}</span> : pending > 0 ? <span className="calm-badge">{pending}</span> : null}</button>
        {panelTools}
        <button type="button" onClick={onReport} className="calm-report"><Icon name="document" size={16} />{t("workspace.report")}</button>
        <LanguageSwitcher compact />
        {layoutMenu}<button type="button" onClick={onClassic} className="calm-classic" title={t("workspace.classicTitle")}>{t("workspace.classic")}</button>
      </div>
    </header>
    <div className="calm-context" aria-label={t("workspace.currentSettings")}>
      <div className="calm-context-scroll">{conditionControl}<span className="calm-separator" />{history}<span className="calm-separator" />{aids}</div>
      <div className="calm-context-pinned">{action}{scaleMenu}
        <button type="button" onClick={onFocus} title={t("workspace.focusTitle")}><Icon name="focus" size={16} /><span className="calm-focus-label">{t("workspace.focus")}</span></button>
        <button type="button" onClick={onControls} aria-expanded={controlsOpen} title={t("workspace.controlsTitle")}>{controlsOpen ? t("workspace.closeControls") : t("workspace.allControls")}</button>
      </div>
    </div>
  </>;
}

export function WorkspaceNavigator({ open, items, current, onSelect, onClose, onGallery, dockSide, width, dockHandle }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const matches = useMemo(() => items.filter((s) => `${s.label} ${s.file}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  return <aside className="calm-navigator" data-dock-side={dockSide} style={{ width, order: dockSide === "right" ? 20 : -20 }} hidden={!open} aria-label={t("workspace.sheetNavigator")} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}>
    <header>{dockHandle}<strong>{t("workspace.sheets")} <small>{items.length}</small></strong><button type="button" aria-label={t("workspace.closeSheetNavigator")} onClick={onClose}>×</button></header>
    <label><Icon name="search" size={15} /><input name="workspace-sheet-search" aria-label={t("workspace.findSheet")} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("workspace.findSheetPlaceholder")} /></label>
    <div className="calm-sheet-list">{matches.map((s) => <button type="button" key={s.key} aria-current={s.key === current ? "page" : undefined} onClick={() => onSelect(s.key)} title={`${s.label} · ${s.file}`}>
      <Icon name="document" size={19} /><span><strong>{s.label}</strong><small>{s.file}</small></span>{s.count > 0 && <em>{s.count}</em>}
    </button>)}{!matches.length && <p>{items.length ? t("workspace.noSheetMatch") : t("workspace.noSheets")}</p>}</div>
    <footer><button type="button" onClick={onGallery}><Icon name="sheets" size={16} />{t("workspace.openGallery")}</button></footer>
  </aside>;
}

export function WorkspaceCommandMenu({ open, onClose, actions, onOpenChange }) {
  const { t } = useTranslation();
  const dialogRef = useRef(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const rows = actions.filter((a) => `${a.label} ${a.group || ""} ${a.shortcut || ""}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 50);
  useEffect(() => {
    if (!open) return;
    setQuery(""); setIndex(0);
    const dialog = dialogRef.current;
    dialog?.showModal();
    onOpenChange(true);
    return () => { dialog?.close(); onOpenChange(false); };
  }, [open, onOpenChange]);
  useEffect(() => { dialogRef.current?.querySelector(".is-highlighted")?.scrollIntoView({ block: "nearest" }); }, [index]);
  const run = (row) => { if (row && !row.disabled) { onClose(); row.run(); } };
  return <dialog ref={dialogRef} className="calm-command-menu" onKeyDown={(e) => e.stopPropagation()} aria-label={t("workspace.findAction")} onCancel={(e) => { e.preventDefault(); onClose(); }} onClick={(e) => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <header><Icon name="search" size={18} /><input name="workspace-action-search" role="combobox" aria-autocomplete="list" aria-expanded={true} aria-controls="workspace-action-results" aria-activedescendant={rows[index] ? `workspace-action-${rows[index].id}` : undefined} aria-label={t("workspace.searchActions")} autoFocus value={query} placeholder={t("workspace.searchActionsPlaceholder")} onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
      onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setIndex((i) => Math.max(0, Math.min(rows.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))); } else if (e.key === "Enter") { e.preventDefault(); run(rows[index]); } }} /><button type="button" aria-label={t("workspace.closeActionSearch")} onClick={onClose}>Esc</button></header>
    <div className="calm-command-results" id="workspace-action-results" role="listbox" aria-label={t("workspace.actions")}>{rows.map((row, i) => <button type="button" role="option" tabIndex={-1} aria-selected={i === index} id={`workspace-action-${row.id}`} key={row.id} className={i === index ? "is-highlighted" : ""} disabled={row.disabled} onMouseEnter={() => setIndex(i)} onClick={() => run(row)}><span>{row.label}<small>{row.group}</small></span>{row.shortcut && <kbd>{keyText(row.shortcut)}</kbd>}</button>)}{!rows.length && <p>{t("workspace.noActionMatch")}</p>}</div>
    <footer>{t("workspace.actionHelp")}</footer>
  </dialog>;
}
