// Project-authored object layers.
//
// These are deliberately separate from a plan PDF's Optional Content Groups
// (the existing LayerPanel / layer_overrides path). Authored layers classify
// our own Count objects. A condition supplies the default layer through
// object_style.layer_id; shape.object.layer_id can override it per instance.
//
// Safety rule: a missing/dangling layer id is visible + editable. Corrupt or
// stale metadata must never make takeoff data disappear or become uneditable.

import { effectiveObjectLayerId } from "./objectPresentation.js";

const plain = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const clean = (v) => (typeof v === "string" ? v.trim() : "");

export function sanitizeAuthoredLayers(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const item of raw) {
    if (!plain(item)) continue;
    const id = clean(item.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const name = clean(item.name) || id;
    out.push({
      ...item,
      id,
      name,
      visible: item.visible !== false,
      locked: item.locked === true,
    });
  }
  return out;
}

export const newAuthoredLayer = (id, name) => ({
  id: clean(id),
  name: clean(name) || "Layer",
  visible: true,
  locked: false,
});

export function authoredLayerMap(layers) {
  return new Map(sanitizeAuthoredLayers(layers).map((layer) => [layer.id, layer]));
}

export function authoredObjectLayerState(condition, shape, layers) {
  if (shape && shape.measure_role !== "count") return { layer_id: null, layer: null, visible: true, locked: false };
  const layer_id = effectiveObjectLayerId(condition, shape);
  if (!layer_id) return { layer_id: null, layer: null, visible: true, locked: false };
  const layer = authoredLayerMap(layers).get(layer_id) || null;
  return {
    layer_id,
    layer,
    visible: layer ? layer.visible !== false : true,
    locked: layer ? layer.locked === true : false,
  };
}

export const authoredObjectVisible = (condition, shape, layers) =>
  authoredObjectLayerState(condition, shape, layers).visible;

export const authoredObjectLocked = (condition, shape, layers) =>
  authoredObjectLayerState(condition, shape, layers).locked;

export function authoredLayerUsage(layers, conditions, shapes) {
  const usage = new Map(sanitizeAuthoredLayers(layers).map((layer) => [layer.id, { types: 0, instances: 0 }]));
  for (const c of Array.isArray(conditions) ? conditions : []) {
    const id = effectiveObjectLayerId(c);
    if (id && usage.has(id)) usage.get(id).types += 1;
  }
  const byCondition = new Map((Array.isArray(conditions) ? conditions : []).map((c) => [c.id, c]));
  for (const s of Array.isArray(shapes) ? shapes : []) {
    if (!s || s.measure_role !== "count") continue;
    const id = effectiveObjectLayerId(byCondition.get(s.condition_id), s);
    if (id && usage.has(id)) usage.get(id).instances += 1;
  }
  return usage;
}
