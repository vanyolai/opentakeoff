import React from "react";
import { objectSymbol, resolveObjectStyle } from "../lib/objectPresentation.js";
import { HatchSwatch } from "./hatches.jsx";

export function ObjectSymbolGlyph({ symbolId, color = "currentColor", strokeWidth = 1.8 }) {
  const symbol = objectSymbol(symbolId);
  return (
    <g fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {(symbol.circles || []).map(([cx, cy, r], i) => <circle key={`c${i}`} cx={cx} cy={cy} r={r} />)}
      {(symbol.segments || []).map(([x1, y1, x2, y2], i) => <line key={`s${i}`} x1={x1} y1={y1} x2={x2} y2={y2} />)}
      {(symbol.polylines || []).map((pts, i) => <polyline key={`p${i}`} points={pts.map((p) => p.join(",")).join(" ")} />)}
    </g>
  );
}

export function ObjectSymbolPreview({ symbolId, color = "currentColor", size = 22 }) {
  return <svg aria-hidden width={size} height={size} viewBox="-12 -12 24 24"><ObjectSymbolGlyph symbolId={symbolId} color={color} /></svg>;
}

// One condition marker for compact condition lists and report legends. Symbol
// choice is presentation only, so callers pass the live condition rather than
// copying object_style into report rows or changing the export schema.
export function ConditionMark({ condition, color, variant = "swatch" }) {
  const style = resolveObjectStyle(condition);
  const col = color || condition?.color || "#888";
  if (style.marker === "symbol") {
    const label = objectSymbol(style.symbol_id).label;
    if (variant === "legend") {
      return (
        <span data-condition-mark="symbol" data-symbol-id={style.symbol_id} title={label}
          style={{ width: 18, height: 18, display: "inline-grid", placeItems: "center", flexShrink: 0, lineHeight: 0 }}>
          <ObjectSymbolPreview symbolId={style.symbol_id} color={col} size={18} />
        </span>
      );
    }
    return (
      <svg data-condition-mark="symbol" data-symbol-id={style.symbol_id} aria-hidden width="26" height="18" viewBox="0 0 26 18" style={{ display: "block", overflow: "hidden" }}>
        <rect x="0.5" y="0.5" width="25" height="17" fill="var(--paper-bright)" stroke="#a39e8d" />
        <g transform="translate(13 9) scale(.65)"><ObjectSymbolGlyph symbolId={style.symbol_id} color={col} strokeWidth={2} /></g>
      </svg>
    );
  }
  if (variant === "legend") {
    return <span data-condition-mark="square" title="Condition color"
      style={{ width: 12, height: 12, background: col, display: "inline-block", border: "1px solid var(--ink-faint)", flexShrink: 0 }} />;
  }
  return <span data-condition-mark="square" style={{ display: "inline-block", lineHeight: 0 }}>
    <HatchSwatch type={condition?.hatch || "solid"} line={col} fill={condition?.fill} />
  </span>;
}

export function ObjectMarker({ shape, condition, cx, cy, zoom, selected, pending, selectionColor }) {
  const style = resolveObjectStyle(condition, shape);
  const z = zoom || 1;
  const col = condition?.color || "#888";
  const r = 7 / z;
  const label = style.label ? (
    <text x={cx + 12 / z} y={cy + 4 / z} fontSize={11 / z} fontWeight={700} fill={col}
      stroke="#fff" strokeWidth={3 / z} paintOrder="stroke" strokeLinejoin="round">{style.label}</text>
  ) : null;
  if (style.marker === "square") {
    return (
      <g>
        <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={2 / z}
          fill={col + (pending ? "55" : "cc")} stroke={selected ? selectionColor : "#fff"}
          strokeWidth={(selected ? 3 : 1.5) / z} strokeDasharray={pending ? `${3 / z} ${2.5 / z}` : undefined} />
        {label}
      </g>
    );
  }
  return (
    <g opacity={pending ? 0.82 : 1}>
      <circle cx={cx} cy={cy} r={10 / z} fill="rgba(255,255,255,.82)" stroke={selected ? selectionColor : "#fff"} strokeWidth={(selected ? 4 : 3) / z} />
      <g transform={`translate(${cx} ${cy}) scale(${1 / z})`} strokeDasharray={pending ? "3 2.5" : undefined}>
        <ObjectSymbolGlyph symbolId={style.symbol_id} color={selected ? selectionColor : col} strokeWidth={selected ? 2.35 : 1.85} />
      </g>
      {label}
    </g>
  );
}
