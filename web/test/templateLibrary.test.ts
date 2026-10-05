import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import i18n from "../src/i18n/index.js";
import { TemplateLibraryTab } from "../src/components/TakeoffsPanel.jsx";

const noop = () => {};

test("a non-empty translated template library renders without shadowing the translation function", async () => {
  const instance = i18n.cloneInstance({ lng: "hu" });
  await instance.changeLanguage("hu");
  const html = renderToStaticMarkup(
    React.createElement(I18nextProvider, { i18n: instance },
      React.createElement(TemplateLibraryTab as any, {
        activeCondition: { id: "c1", finish_tag: "CAM-1" },
        templates: [{ finish_tag: "CAM-1", color: "#26547c", fill: "#ffffff", hatch: "solid", waste_pct: 10, materials: [{ id: "m1" }] }],
        units: "metric",
        onSaveTemplate: noop,
        onApplyTemplate: noop,
        onRenameTemplate: noop,
        onDeleteTemplate: noop,
      })
    )
  );

  assert.match(html, /CAM-1/);
  assert.match(html, /Alkalmazás/);
  assert.match(html, /10% ráhagyás/);
  assert.match(html, /1 anyag/);
  assert.match(html, /title="Új tétel hozzáadása ebből a sablonból"/);
});
