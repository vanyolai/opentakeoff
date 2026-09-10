import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConditionAppearanceEditor, ObjectSymbolTabs } from "../src/components/TakeoffsPanel.jsx";
import { PALETTE, NO_FILL } from "../src/components/hatches.jsx";
import { ConditionMark } from "../src/components/ObjectMarker.jsx";
import { objectSymbolsByGroup } from "../src/lib/objectPresentation.js";

const cond = { id: "c1", finish_tag: "CPT-1", color: PALETTE[2], fill: NO_FILL, hatch: "solid" };
const noop = () => {};
const render = (layout: string) => renderToStaticMarkup(
  React.createElement(ConditionAppearanceEditor as any, { cond, onUpdateCond: noop, onSetCondParam: noop, onAssignAttr: noop, layout })
);

test("top-bar band (row): Line and Fill are two swatch buttons, palettes closed until clicked", () => {
  const html = render("row");
  assert.match(html, /data-testid="line-swatch"/);
  assert.match(html, /data-testid="fill-swatch"/);
  assert.match(html, /aria-expanded="false"/);
  const swatches = (html.match(/title="#[0-9a-f]{6}"/g) || []).length;
  assert.equal(swatches, 0, "no inline palette swatches in the band");
  assert.match(html, new RegExp(PALETTE[2]), "line swatch carries the current color");
  assert.match(html, /⦸/, "no-fill reads as ⦸ on the fill swatch");
});

test("docked panel (stack): inline palettes stay — it has the room", () => {
  const html = render("stack");
  assert.doesNotMatch(html, /data-testid="line-swatch"/);
  const swatches = (html.match(/title="#[0-9a-f]{6}"/g) || []).length;
  assert.equal(swatches, PALETTE.length * 2, "line + fill palettes inline");
});

test("docked symbol picker stays compact until explicitly opened", () => {
  const symbolCond = { ...cond, object_style: { marker: "symbol", symbol_id: "camera_dome", label_mode: "none" } };
  const html = renderToStaticMarkup(
    React.createElement(ConditionAppearanceEditor as any, { cond: symbolCond, onUpdateCond: noop, onSetCondParam: noop, onAssignAttr: noop, layout: "stack" })
  );
  assert.match(html, /data-testid="symbol-picker-toggle" aria-expanded="false"/);
  assert.match(html, /Dome camera/);
  assert.doesNotMatch(html, /aria-label="Symbol topics"/);
});

test("opened symbol picker uses topic tabs and renders only the active topic's icons", () => {
  const html = renderToStaticMarkup(React.createElement(ObjectSymbolTabs as any, {
    groups: objectSymbolsByGroup(), activeGroupId: "cctv", selectedSymbolId: "camera_dome", color: PALETTE[2],
    onSelectGroup: noop, onSelectSymbol: noop,
  }));
  assert.match(html, /role="tablist" aria-label="Symbol topics"/);
  assert.match(html, /data-testid="symbol-tab-cctv" aria-selected="true"/);
  assert.match(html, /data-testid="symbol-tab-intrusion" aria-selected="false"/);
  assert.match(html, /aria-label="CCTV symbols"/);
  assert.match(html, /aria-label="Dome camera"/);
  assert.doesNotMatch(html, /aria-label="PIR motion detector"/);
});

test("condition marks replace the hatch/report square only for symbol conditions", () => {
  const symbolCond = { ...cond, object_style: { marker: "symbol", symbol_id: "camera_dome", label_mode: "none" } };
  const symbolSwatch = renderToStaticMarkup(React.createElement(ConditionMark as any, { condition: symbolCond }));
  const symbolLegend = renderToStaticMarkup(React.createElement(ConditionMark as any, { condition: symbolCond, variant: "legend" }));
  const squareLegend = renderToStaticMarkup(React.createElement(ConditionMark as any, { condition: cond, variant: "legend" }));
  assert.match(symbolSwatch, /data-condition-mark="symbol" data-symbol-id="camera_dome"/);
  assert.match(symbolLegend, /data-condition-mark="symbol" data-symbol-id="camera_dome"/);
  assert.match(squareLegend, /data-condition-mark="square"/);
});
