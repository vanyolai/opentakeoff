import { test } from "node:test";
import assert from "node:assert/strict";
import {
  allocateSequentialObjectLabels, defaultObjectStyle, effectiveObjectLayerId, newObjectInstance, resolveObjectStyle,
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

test("load gates keep future keys but remove malformed known presentation fields", () => {
  const [c] = sanitizeConditionObjectStyles([{ id: "c", object_style: { marker: "bad", symbol_id: "bad", label_mode: "tag", label_text: 4, layer_id: "  power ", future: true } }]);
  assert.deepEqual(c.object_style, { label_mode: "tag", layer_id: "power", future: true });
  const [s] = sanitizeCountObjects([{ measure_role: "count", object: { layer_id: 4, label: {}, future: 1 } }]);
  assert.deepEqual(s.object, { layer_id: null, future: 1 });
});
