import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReportPanel from "../src/components/ReportPanel.jsx";
import { GoogleAuthProvider } from "../src/lib/google/AuthContext.jsx";

const noop = () => {};

test("Report legends use a condition's symbol while legacy conditions keep the color square", () => {
  const conditions = [
    { id: "cam", finish_tag: "CAM", color: "#2563eb", fill: "none", hatch: "solid", object_style: { marker: "symbol", symbol_id: "camera_dome", label_mode: "none" } },
    { id: "legacy", finish_tag: "CPT-1", color: "#c96442", fill: "none", hatch: "solid" },
  ];
  const shapes = conditions.map((condition, index) => ({
    id: `shape-${condition.id}`, condition_id: condition.id, sheet_id: "plan#1", measure_role: "count", verts_norm: [[0.4 + index * 0.1, 0.5]],
  }));
  const html = renderToStaticMarkup(React.createElement(GoogleAuthProvider, null,
    React.createElement(ReportPanel as any, {
      projectName: "Legend test", onProjectName: noop, conditions, shapes,
      sheetLabel: () => "Plan 1", sheetDims: () => ({ w: 100, h: 100 }),
      onMarkedSet: noop, markedSetDark: false, onClose: noop, onClientInfo: noop,
    })));

  assert.match(html, /data-condition-mark="symbol" data-symbol-id="camera_dome"/);
  assert.match(html, /data-condition-mark="square"/);
});
