// Count-object presentation and future authored-layer seam.
//
// Conditions are the user-defined object TYPES. `condition.object_style`
// supplies the type defaults; a count shape's optional `shape.object` block is
// the instance override seam. Layer management has no UI yet, but both levels
// already carry `layer_id`, and every consumer resolves it through this module.
// That keeps the later layer panel additive instead of requiring a data rewrite.

const plain = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const cleanId = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

export const OBJECT_SYMBOLS = [
  { id: "outlet", label: "Outlet", circles: [[0, 0, 9]], segments: [[-3.2, -4, -3.2, 4], [3.2, -4, 3.2, 4]] },
  { id: "switch", label: "Switch", circles: [[0, 0, 9], [-4.6, 3.2, 1.15], [4.6, -3.2, 1.15]], segments: [[-3.7, 2.6, 3.7, -2.6]] },
  { id: "light", label: "Light", circles: [[0, 0, 9]], segments: [[-6.2, -6.2, 6.2, 6.2], [-6.2, 6.2, 6.2, -6.2]] },
  { id: "data", label: "Data", polylines: [[[-8, 0], [0, -8], [8, 0], [0, 8], [-8, 0]]], segments: [[-3.5, 0, 3.5, 0], [0, -3.5, 0, 3.5]] },
  { id: "camera", label: "Camera", circles: [[-2.5, 0, 5.5]], polylines: [[[3, -4], [9, -7], [9, 7], [3, 4]]], segments: [[-7.5, -7, 3.5, -7], [-7.5, 7, 3.5, 7], [-7.5, -7, -7.5, 7]] },
];

const SYMBOL_IDS = new Set(OBJECT_SYMBOLS.map((s) => s.id));
const MARKERS = new Set(["square", "symbol"]);
const LABEL_MODES = new Set(["none", "tag", "custom", "sequence"]);

export const defaultObjectStyle = () => ({ marker: "square", label_mode: "none", layer_id: null });
// Empty means "inherit the type layer". A future layer UI can write a string
// override, or explicit null to detach this one instance from the type layer.
export const newObjectInstance = () => ({});

/**
 * Reserve immutable per-instance labels for one placement gesture. The next
 * counter lives on the type, but the rendered CAM-17 string lives on the shape
 * so later edits never renumber already-issued plan identifiers.
 */
export function allocateSequentialObjectLabels(condition, count = 1) {
  const raw = plain(condition?.object_style) ? condition.object_style : {};
  if (raw.label_mode !== "sequence") return { labels: [], object_style: null };
  const prefix = typeof raw.label_prefix === "string" ? raw.label_prefix : "";
  const start = Number.isInteger(raw.next_sequence) && raw.next_sequence > 0 ? raw.next_sequence : 1;
  const n = Math.max(0, Math.floor(Number(count) || 0));
  return {
    labels: Array.from({ length: n }, (_, i) => `${prefix}${start + i}`),
    object_style: { ...raw, next_sequence: start + n },
  };
}

export function newLabeledObjectInstance(label = "") {
  return { ...newObjectInstance(), ...(label ? { label } : {}) };
}

/** Runtime defaults. Never mutates or migrates legacy data merely by reading it. */
/** @param {any} condition @param {any} [shape] */
export function resolveObjectStyle(condition, shape = null) {
  const raw = plain(condition?.object_style) ? condition.object_style : {};
  const marker = MARKERS.has(raw.marker) ? raw.marker : "square";
  const symbolId = SYMBOL_IDS.has(raw.symbol_id) ? raw.symbol_id : OBJECT_SYMBOLS[0].id;
  const labelMode = LABEL_MODES.has(raw.label_mode) ? raw.label_mode : "none";
  const instance = plain(shape?.object) ? shape.object : null;
  const instanceLabel = typeof instance?.label === "string" ? instance.label.trim() : "";
  const label = instanceLabel || (labelMode === "tag"
    ? String(condition?.finish_tag || "").trim()
    : labelMode === "custom" ? String(raw.label_text || "").trim() : "");
  return {
    marker,
    symbol_id: symbolId,
    label_mode: labelMode,
    label_text: typeof raw.label_text === "string" ? raw.label_text : "",
    label,
    layer_id: effectiveObjectLayerId(condition, shape),
  };
}

/** Instance presence wins, including explicit null (detach from the type layer). */
/** @param {any} condition @param {any} [shape] */
export function effectiveObjectLayerId(condition, shape = null) {
  const instance = plain(shape?.object) ? shape.object : null;
  if (instance && Object.prototype.hasOwnProperty.call(instance, "layer_id")) return cleanId(instance.layer_id);
  return cleanId(plain(condition?.object_style) ? condition.object_style.layer_id : null);
}

export function objectSymbol(id) {
  return OBJECT_SYMBOLS.find((s) => s.id === id) || OBJECT_SYMBOLS[0];
}

// Load gates preserve unknown future keys while making every known field safe.
export function sanitizeObjectStyle(raw) {
  if (!plain(raw)) return null;
  const out = { ...raw };
  if (!MARKERS.has(out.marker)) delete out.marker;
  if (!SYMBOL_IDS.has(out.symbol_id)) delete out.symbol_id;
  if (!LABEL_MODES.has(out.label_mode)) delete out.label_mode;
  if ("label_text" in out && typeof out.label_text !== "string") delete out.label_text;
  if ("label_prefix" in out && typeof out.label_prefix !== "string") delete out.label_prefix;
  if ("next_sequence" in out && (!Number.isInteger(out.next_sequence) || out.next_sequence < 1)) delete out.next_sequence;
  if ("layer_id" in out) out.layer_id = cleanId(out.layer_id);
  return out;
}

export function sanitizeConditionObjectStyles(conditions) {
  if (!Array.isArray(conditions)) return [];
  return conditions.map((c) => {
    if (!plain(c) || !("object_style" in c)) return c;
    const style = sanitizeObjectStyle(c.object_style);
    if (style) return { ...c, object_style: style };
    const out = { ...c }; delete out.object_style; return out;
  });
}

export function sanitizeCountObjects(shapes) {
  if (!Array.isArray(shapes)) return [];
  return shapes.map((s) => {
    if (!plain(s) || s.measure_role !== "count" || !("object" in s)) return s;
    if (!plain(s.object)) { const out = { ...s }; delete out.object; return out; }
    const object = { ...s.object };
    if ("layer_id" in object) object.layer_id = cleanId(object.layer_id);
    if ("label" in object && object.label !== null && typeof object.label !== "string") delete object.label;
    return { ...s, object };
  });
}
