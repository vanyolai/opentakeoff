// Count-object presentation and future authored-layer seam.
//
// Conditions are the user-defined object TYPES. `condition.object_style`
// supplies the type defaults; a count shape's optional `shape.object` block is
// the instance override seam. Layer management has no UI yet, but both levels
// already carry `layer_id`, and every consumer resolves it through this module.
// That keeps the later layer panel additive instead of requiring a data rewrite.

const plain = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const cleanId = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
const arc = (cx, cy, r, fromDeg, toDeg, steps = 8) => Array.from({ length: steps + 1 }, (_, i) => {
  const a = (fromDeg + (toDeg - fromDeg) * i / steps) * Math.PI / 180;
  return [Number((cx + Math.cos(a) * r).toFixed(3)), Number((cy + Math.sin(a) * r).toFixed(3))];
});

export const OBJECT_SYMBOL_GROUPS = [
  { id: "electrical", label: "Electrical" },
  { id: "cctv", label: "CCTV" },
  { id: "network", label: "Data & network" },
  { id: "intrusion", label: "Intrusion alarm" },
  { id: "access", label: "Access & intercom" },
  { id: "fire", label: "Fire alarm" },
  { id: "infrastructure", label: "Infrastructure" },
];

// Deliberately small line-art primitives keep one source of truth for canvas,
// marked-PDF export and the picker. IDs are persistence keys: add new symbols,
// but never rename an existing one merely to improve its visible label.
export const OBJECT_SYMBOLS = [
  { id: "outlet", group: "electrical", label: "Outlet", circles: [[0, 0, 9]], segments: [[-3.2, -4, -3.2, 4], [3.2, -4, 3.2, 4]] },
  { id: "switch", group: "electrical", label: "Switch", circles: [[0, 0, 9], [-4.6, 3.2, 1.15], [4.6, -3.2, 1.15]], segments: [[-3.7, 2.6, 3.7, -2.6]] },
  { id: "light", group: "electrical", label: "Light", circles: [[0, 0, 9]], segments: [[-6.2, -6.2, 6.2, 6.2], [-6.2, 6.2, 6.2, -6.2]] },

  { id: "camera", group: "cctv", label: "Bullet camera", circles: [[5.8, -1.2, 1.35]], polylines: [rect(-7.5, -4.8, 12.5, 7.2), [[-2.5, 2.4], [-5.8, 7.2], [-8.2, 7.2]], [[4.9, -4], [9, -6.3], [9, 3.9], [4.9, 2.2]]] },
  { id: "camera_dome", group: "cctv", label: "Dome camera", circles: [[0, 2.1, 2.1]], polylines: [arc(0, -0.5, 8.5, 12, 168, 12), arc(0, 1.2, 6.6, 0, 180, 12)], segments: [[-9, -1, 9, -1]] },
  { id: "camera_ptz", group: "cctv", label: "PTZ camera", circles: [[0, 1.5, 5.6], [0, 2.2, 1.8]], polylines: [arc(0, -4.2, 7.2, 195, 345, 10)], segments: [[-7.6, -5.7, 7.6, -5.7], [0, 7.1, 0, 9.5]] },

  { id: "data", group: "network", label: "Data outlet", polylines: [[[-8, 0], [0, -8], [8, 0], [0, 8], [-8, 0]]], segments: [[-3.5, 0, 3.5, 0], [0, -3.5, 0, 3.5]] },
  { id: "wifi_ap", group: "network", label: "Wi-Fi access point", circles: [[0, 4.6, 1.1], [0, 0, 9.3]], polylines: [arc(0, 4.5, 8, 218, 322, 10), arc(0, 4.5, 4.7, 218, 322, 8)] },
  { id: "network_rack", group: "network", label: "Network rack", polylines: [rect(-7.8, -10, 15.6, 20)], segments: [[-7.8, -5.8, 7.8, -5.8], [-7.8, -1.8, 7.8, -1.8], [-7.8, 2.2, 7.8, 2.2], [-7.8, 6.2, 7.8, 6.2], [-4.8, -7.9, -2.4, -7.9], [-4.8, -3.8, -2.4, -3.8], [-4.8, 0.2, -2.4, 0.2], [-4.8, 4.2, -2.4, 4.2], [-4.8, 8.1, -2.4, 8.1]] },

  { id: "pir", group: "intrusion", label: "PIR motion detector", circles: [[0, -3.2, 2.2]], polylines: [arc(0, -3.2, 9, 30, 150, 10), arc(0, -3.2, 6.2, 35, 145, 9), arc(0, -3.2, 3.8, 45, 135, 7)] },
  { id: "pir_mw", group: "intrusion", label: "Dual-tech PIR + MW", circles: [[0, -3.2, 2.2]], polylines: [arc(0, -3.2, 8.8, 32, 148, 10), arc(0, -3.2, 5.6, 38, 142, 8), arc(-4.7, 2.4, 3.3, 270, 450, 8), arc(4.7, 2.4, 3.3, 90, 270, 8)] },
  { id: "magnetic_contact", group: "intrusion", label: "Magnetic contact", polylines: [rect(-8, -7, 5.2, 14), rect(1.2, -7, 6.8, 14)], segments: [[-1, -4.5, -1, 4.5]] },
  { id: "glass_break", group: "intrusion", label: "Glass-break detector", circles: [[0, 0, 9]], polylines: [[[0, -8], [-2, -2], [2, 0], [-3, 3], [0, 8]], [[-2, -2], [-7, -4]], [[2, 0], [7, -3]], [[-3, 3], [-7, 6]]] },
  { id: "shock_detector", group: "intrusion", label: "Shock detector", circles: [[0, 0, 9]], polylines: [[[-1.2, -8], [-5, 0], [-0.8, 0], [-3, 8], [5, -2], [0.8, -2], [-1.2, -8]]] },
  { id: "siren", group: "intrusion", label: "Indoor sounder", polylines: [[[-6, 4], [-4, -4], [4, -4], [6, 4], [-6, 4]], [[-4, 4], [-2, 7], [2, 7], [4, 4]]], segments: [[-9, -5, -7, -3], [9, -5, 7, -3], [0, -9, 0, -7]] },
  { id: "siren_strobe", group: "intrusion", label: "Outdoor siren + strobe", polylines: [rect(-7.5, -8.5, 15, 17), [[-5, 3], [-3.5, -3], [3.5, -3], [5, 3], [-5, 3]]], segments: [[-5.5, -5.5, 5.5, -5.5], [-9.5, 0, -7.5, 0], [9.5, 0, 7.5, 0]] },
  { id: "alarm_panel", group: "intrusion", label: "Alarm control panel", circles: [[-4.2, -4.2, 1], [4.2, -4.2, 1], [0, 4.5, 1]], polylines: [rect(-9, -9, 18, 18)], segments: [[-4.2, -3.2, -1, 1], [4.2, -3.2, 1, 1], [-1, 1, 0, 3.5], [1, 1, 0, 3.5]] },
  { id: "alarm_keypad", group: "intrusion", label: "Alarm keypad", circles: [[-3.5, -1.5, 0.7], [0, -1.5, 0.7], [3.5, -1.5, 0.7], [-3.5, 2, 0.7], [0, 2, 0.7], [3.5, 2, 0.7], [-3.5, 5.5, 0.7], [0, 5.5, 0.7], [3.5, 5.5, 0.7]], polylines: [rect(-7.5, -10, 15, 20), rect(-4.8, -7.4, 9.6, 3)] },
  { id: "panic_button", group: "intrusion", label: "Panic button", circles: [[0, 0, 9], [0, 0, 5], [0, 4.5, 0.35]], segments: [[0, -3, 0, 1.5]] },

  { id: "card_reader", group: "access", label: "Card reader", polylines: [rect(-6.5, -9.5, 13, 19), rect(-3.8, 1.5, 7.6, 4.5), arc(0, -5.2, 2.2, 205, 335, 6), arc(0, -5.2, 4.2, 205, 335, 8)] },
  { id: "electric_lock", group: "access", label: "Electric lock", polylines: [rect(-7, -1.5, 14, 10), arc(0, -1.5, 5.3, 180, 360, 10)], circles: [[0, 3.1, 1.2]], segments: [[0, 4.3, 0, 6.2]] },
  { id: "exit_button", group: "access", label: "Exit button", circles: [[0, 0, 9]], polylines: [[[-5, 0], [4.5, 0], [1, -3.5]], [[4.5, 0], [1, 3.5]]] },
  { id: "access_controller", group: "access", label: "Door controller", circles: [[-4.5, -5.2, 0.9], [4.5, -5.2, 0.9]], polylines: [rect(-9, -9, 18, 18), rect(-3.5, -2.5, 7, 9)], segments: [[0, -2.5, 0, 6.5], [3.5, 2, 7, 2]] },
  { id: "intercom", group: "access", label: "Intercom station", circles: [[0, -4.5, 2.5], [0, 5.5, 1.4]], polylines: [rect(-6.5, -10, 13, 20)], segments: [[-3.2, 0, 3.2, 0], [-3.2, 2.2, 3.2, 2.2]] },

  { id: "smoke_detector", group: "fire", label: "Smoke detector", circles: [[0, 0, 9], [0, 0, 4.5]], polylines: [arc(0, 2.2, 6.7, 205, 335, 9)], segments: [[-9.5, 0, -6.8, 0], [9.5, 0, 6.8, 0]] },
  { id: "heat_detector", group: "fire", label: "Heat detector", circles: [[0, 0, 9]], polylines: [[[-6, 5], [-3, -5], [0, 5], [3, -5], [6, 5]]] },
  { id: "manual_call_point", group: "fire", label: "Manual call point", circles: [[0, 1, 4]], polylines: [rect(-8.5, -8.5, 17, 17)], segments: [[-4, -5.5, 4, -5.5]] },
  { id: "fire_sounder", group: "fire", label: "Fire sounder", circles: [[0, 0, 5.2]], polylines: [arc(0, 0, 8.8, 210, 330, 8), arc(0, 0, 8.8, 30, 150, 8)] },
  { id: "fire_panel", group: "fire", label: "Fire alarm panel", circles: [[-4.2, -4.3, 0.9], [0, -4.3, 0.9], [4.2, -4.3, 0.9]], polylines: [rect(-9, -9, 18, 18), [[0, -1.5], [-3.4, 4.8], [0, 3.2], [3.4, 4.8], [0, -1.5]]] },

  { id: "junction_box", group: "infrastructure", label: "Junction box", polylines: [rect(-8, -8, 16, 16)], segments: [[-6, -6, 6, 6], [-6, 6, 6, -6]] },
  { id: "power_supply", group: "infrastructure", label: "Power supply", polylines: [rect(-9, -7, 18, 14)], segments: [[-6, -2, -2, -2], [-4, -4, -4, 0], [2, -2, 7, -2], [2, 2, 7, 2]] },
  { id: "ups", group: "infrastructure", label: "UPS", circles: [[0, 0, 2.2]], polylines: [rect(-9, -7.5, 18, 15), arc(0, 0, 5.5, 180, 360, 8), arc(0, 0, 5.5, 0, 180, 8)], segments: [[-9, -3.5, -11, -3.5], [9, -3.5, 11, -3.5]] },
];

export const objectSymbolsByGroup = () => OBJECT_SYMBOL_GROUPS.map((group) => ({
  ...group,
  symbols: OBJECT_SYMBOLS.filter((symbol) => symbol.group === group.id),
}));

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
  const prefix = sequenceObjectLabelPrefix(condition);
  const start = Number.isInteger(raw.next_sequence) && raw.next_sequence > 0 ? raw.next_sequence : 1;
  const n = Math.max(0, Math.floor(Number(count) || 0));
  return {
    labels: Array.from({ length: n }, (_, i) => `${prefix}${start + i}`),
    object_style: { ...raw, next_sequence: start + n },
  };
}

/** A newly enabled sequence starts from the condition tag, but an explicitly
 * stored string (including empty) always wins. `CAM` and `CAM-` both become
 * the useful default `CAM-`; already-issued instance labels never consult it. */
export function sequenceObjectLabelPrefix(condition) {
  const raw = plain(condition?.object_style) ? condition.object_style : {};
  if (typeof raw.label_prefix === "string") return raw.label_prefix;
  const tag = typeof condition?.finish_tag === "string" ? condition.finish_tag.trim() : "";
  return !tag || /[-_.:/\s]$/.test(tag) ? tag : `${tag}-`;
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
