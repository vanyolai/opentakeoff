import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allocateSequentialObjectLabels, defaultObjectStyle, effectiveObjectLayerId, newObjectInstance, OBJECT_SYMBOL_GROUPS,
  OBJECT_SYMBOLS, objectSymbolsByGroup, resolveObjectStyle, sequenceObjectLabelPrefix,
  sanitizeConditionObjectStyles, sanitizeCountObjects,
} from "../src/lib/objectPresentation.js";
import { instantiateTemplate } from "../src/lib/canvasUtil.js";

test("legacy conditions resolve to the unchanged square with no visible label", () => {
  assert.deepEqual(resolveObjectStyle({ finish_tag: "E-1" }), {
    marker: "square", symbol_id: "outlet", label_mode: "none", label_text: "", label: "", layer_id: null,
  });
});

test("symbol and tag/custom labels resolve without using the grouping label", () => {
  const c = { finish_tag: "DATA-1", object_style: { marker: "symbol", symbol_id: "data", label_mode: "tag", layer_id: "low-voltage" } };
  assert.equal(resolveObjectStyle(c).label, "DATA-1");
  assert.equal(resolveObjectStyle(c, { label: "Room 201", object: { label: "D-17" } }).label, "D-17");
  assert.equal(resolveObjectStyle({ object_style: { label_mode: "custom", label_text: "AP" } }).label, "AP");
});

test("layer resolution is type default then presence-aware instance override", () => {
  const c = { object_style: { layer_id: "power" } };
  assert.equal(effectiveObjectLayerId(c), "power");
  assert.equal(effectiveObjectLayerId(c, { object: {} }), "power");
  assert.equal(effectiveObjectLayerId(c, { object: { layer_id: "emergency" } }), "emergency");
  assert.equal(effectiveObjectLayerId(c, { object: { layer_id: null } }), null);
});

test("a reusable sequential template keeps its prefix but starts a fresh number run", () => {
  const c = instantiateTemplate({ finish_tag: "CAM", materials: [], object_style: { marker: "symbol", symbol_id: "camera", label_mode: "sequence", label_prefix: "CAM-", next_sequence: 42 } });
  assert.equal(c.object_style.next_sequence, 1);
  assert.equal(c.object_style.label_prefix, "CAM-");
});

test("new type/instance constructors reserve the future layer seam", () => {
  assert.deepEqual(defaultObjectStyle(), { marker: "square", label_mode: "none", layer_id: null });
  assert.deepEqual(newObjectInstance(), {});
});

test("sequential placement reserves stable per-instance labels and advances the type counter", () => {
  const c = { object_style: { marker: "symbol", label_mode: "sequence", label_prefix: "CAM-", next_sequence: 7, layer_id: "security" } };
  const out = allocateSequentialObjectLabels(c, 3);
  assert.deepEqual(out.labels, ["CAM-7", "CAM-8", "CAM-9"]);
  assert.equal(out.object_style?.next_sequence, 10);
  assert.equal(resolveObjectStyle(c, { object: { label: out.labels[0] } }).label, "CAM-7");
});

test("a sequence defaults its visible prefix from the condition tag and permits an explicit empty prefix", () => {
  const implicit = { finish_tag: "CAM", object_style: { marker: "symbol", label_mode: "sequence", next_sequence: 3 } };
  assert.equal(sequenceObjectLabelPrefix(implicit), "CAM-");
  assert.deepEqual(allocateSequentialObjectLabels(implicit, 2).labels, ["CAM-3", "CAM-4"]);
  assert.equal(sequenceObjectLabelPrefix({ ...implicit, finish_tag: "CAM-" }), "CAM-");
  assert.equal(sequenceObjectLabelPrefix({ ...implicit, object_style: { ...implicit.object_style, label_prefix: "" } }), "");
});

test("the grouped low-voltage symbol registry has stable unique IDs and no orphan groups", () => {
  const ids = OBJECT_SYMBOLS.map((symbol) => symbol.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const required of ["camera", "camera_dome", "wifi_ap", "pir", "pir_mw", "siren", "network_rack", "alarm_panel", "alarm_keypad"])
    assert.ok(ids.includes(required), `missing ${required}`);
  const grouped = objectSymbolsByGroup();
  assert.deepEqual(grouped.map((group) => group.id), OBJECT_SYMBOL_GROUPS.map((group) => group.id));
  assert.equal(grouped.flatMap((group) => group.symbols).length, OBJECT_SYMBOLS.length);
  assert.ok(grouped.every((group) => group.symbols.length > 0));
});

test("every symbol primitive is finite and stays inside the 24-unit marker view box", () => {
  const inside = (value: number) => Number.isFinite(value) && Math.abs(value) <= 12;
  for (const symbol of OBJECT_SYMBOLS) {
    for (const [x, y, radius] of symbol.circles || []) {
      assert.ok(inside(x - radius) && inside(x + radius) && inside(y - radius) && inside(y + radius), `${symbol.id} circle exceeds view box`);
    }
    for (const segment of symbol.segments || []) {
      assert.equal(segment.length, 4, `${symbol.id} has a malformed segment`);
      assert.ok(segment.every(inside), `${symbol.id} segment exceeds view box`);
    }
    for (const polyline of symbol.polylines || []) {
      assert.ok(polyline.length >= 2, `${symbol.id} has a malformed polyline`);
      assert.ok(polyline.every(([x, y]) => inside(x) && inside(y)), `${symbol.id} polyline exceeds view box`);
    }
  }
});

test("load gates keep future keys but remove malformed known presentation fields", () => {
  const [c] = sanitizeConditionObjectStyles([{ id: "c", object_style: { marker: "bad", symbol_id: "bad", label_mode: "tag", label_text: 4, layer_id: "  power ", future: true } }]);
  assert.deepEqual(c.object_style, { label_mode: "tag", layer_id: "power", future: true });
  const [s] = sanitizeCountObjects([{ measure_role: "count", object: { layer_id: 4, label: {}, future: 1 } }]);
  assert.deepEqual(s.object, { layer_id: null, future: 1 });
});
