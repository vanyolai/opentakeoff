import { test } from "node:test";
import assert from "node:assert/strict";
import {
  authoredLayerMap,
  authoredLayerUsage,
  authoredObjectLayerState,
  authoredObjectLocked,
  authoredObjectVisible,
  newAuthoredLayer,
  sanitizeAuthoredLayers,
} from "../src/lib/authoredLayers.js";

test("sanitizeAuthoredLayers drops malformed/duplicate ids and normalizes flags", () => {
  const raw = [
    null,
    { id: " cctv ", name: " CCTV ", visible: false, locked: 1, future: 7 },
    { id: "cctv", name: "duplicate" },
    { id: "data", name: "", locked: true },
    { id: "", name: "bad" },
  ];
  assert.deepEqual(sanitizeAuthoredLayers(raw), [
    { id: "cctv", name: "CCTV", visible: false, locked: false, future: 7 },
    { id: "data", name: "data", visible: true, locked: true },
  ]);
});

test("missing registry entries fail open: visible and editable", () => {
  const c = { id: "c1", object_style: { layer_id: "missing" } };
  const s = { measure_role: "count", condition_id: "c1", object: {} };
  assert.deepEqual(authoredObjectLayerState(c, s, []), {
    layer_id: "missing", layer: null, visible: true, locked: false,
  });
  assert.equal(authoredObjectVisible(c, s, []), true);
  assert.equal(authoredObjectLocked(c, s, []), false);
});

test("authored object layers never hide or lock non-Count takeoffs", () => {
  const layers = [{ id: "locked", name: "Locked", visible: false, locked: true }];
  const c = { id: "c1", object_style: { layer_id: "locked" } };
  const linear = { measure_role: "linear", condition_id: "c1" };
  assert.deepEqual(authoredObjectLayerState(c, linear, layers), {
    layer_id: null, layer: null, visible: true, locked: false,
  });
});

test("instance layer override wins, including explicit null detach", () => {
  const layers = [
    { id: "type", name: "Type", visible: false, locked: true },
    { id: "instance", name: "Instance", visible: true, locked: false },
  ];
  const c = { id: "c1", object_style: { layer_id: "type" } };
  const inherited = { measure_role: "count", condition_id: "c1", object: {} };
  const overridden = { measure_role: "count", condition_id: "c1", object: { layer_id: "instance" } };
  const detached = { measure_role: "count", condition_id: "c1", object: { layer_id: null } };

  assert.equal(authoredObjectVisible(c, inherited, layers), false);
  assert.equal(authoredObjectLocked(c, inherited, layers), true);
  assert.equal(authoredObjectVisible(c, overridden, layers), true);
  assert.equal(authoredObjectLocked(c, overridden, layers), false);
  assert.deepEqual(authoredObjectLayerState(c, detached, layers), {
    layer_id: null, layer: null, visible: true, locked: false,
  });
});

test("usage counts condition defaults and resolved count instances", () => {
  const layers = [newAuthoredLayer("cctv", "CCTV"), newAuthoredLayer("data", "Data")];
  const conditions = [
    { id: "cam", object_style: { layer_id: "cctv" } },
    { id: "ap", object_style: { layer_id: "data" } },
  ];
  const shapes = [
    { id: "1", measure_role: "count", condition_id: "cam", object: {} },
    { id: "2", measure_role: "count", condition_id: "cam", object: { layer_id: "data" } },
    { id: "3", measure_role: "linear", condition_id: "ap" },
  ];
  assert.deepEqual(authoredLayerMap(layers).get("cctv"), layers[0]);
  assert.deepEqual(Object.fromEntries(authoredLayerUsage(layers, conditions, shapes)), {
    cctv: { types: 1, instances: 1 },
    data: { types: 1, instances: 1 },
  });
});
