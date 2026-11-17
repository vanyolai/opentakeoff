# Self-hosted product direction

> **Status: ACTIVE DIRECTION.** This document defines the downstream
> `selfhosted` product direction. It does not describe the upstream OpenTakeoff
> roadmap and does not change the upstream `main` branch.

## Purpose

Extend OpenTakeoff from a flooring-first measurement canvas into a
discipline-aware planning and takeoff tool. A user can measure an existing PDF
and add authored plan content without maintaining a separate drawing model.

The plan and the takeoff use the same project data. The source PDF remains the
background document; authored objects, symbols, lines, labels, and other plan
content remain separate project records above it.

The first downstream use case is electrical and low-voltage construction. The
underlying model stays general enough for other disciplines.

## Product principles

- Keep object types user-defined. Do not hard-code a closed electrical catalog.
- Preserve the existing colored-square marker as a supported representation.
- Add built-in symbols as another representation of the same user-defined
  object type.
- Keep measurement, drawing, and reporting on one project model.
- Treat the imported PDF as background source material, not editable authored
  geometry.
- Hide discipline-specific interface that does not apply to the active work.
  Hiding a feature must not delete its project data.
- Keep upstream changes easy to absorb. Downstream behavior belongs on
  `selfhosted`; `main` stays an upstream-tracking branch.

## First usable milestone

The first milestone establishes symbols and discipline-aware rendering without
replacing the current free-form condition and object workflow.

### User-defined objects and marker styles

A user can continue to define object types as the app allows today. Each object
type can choose one of these marker styles:

- the existing colored square;
- one symbol from a small built-in symbol set.

Existing projects and object types default to the colored square. Opening an
older project must not require migration choices or change its visible
markers.

The first built-in library is grouped around low-voltage work: CCTV,
data/network, intrusion alarm, access/intercom, fire alarm and supporting
infrastructure, with the original electrical proof symbols retained. Its line
art is shared by the picker, condition list, canvas, Report and Marked Set
export. Custom symbol import and company-specific libraries come later.

### Upstream Trade integration

Do **not** introduce a parallel downstream discipline-profile schema. Upstream
now owns the domain filter through its Trade model and ships an
**Electrical & low voltage** suite. Downstream electrical/low-voltage work must
build on that model:

- the condition's upstream `trade` field remains the trade/domain assignment;
- the canvas Trade view remains the show/hide surface for trade-scoped work;
- downstream `object_style` controls how Count objects inside those conditions
  render (square/symbol, plan label, authored-layer default);
- project-level `authored_layers` is the registry for our own Count-object
  layers; condition `object_style.layer_id` supplies the default and
  per-instance `shape.object.layer_id` can inherit, detach or override it
  without changing the upstream quantity model. Authored layers are explicitly
  separate from PDF/OCG source layers.

CCTV, Data, Access, Intrusion and Fire therefore remain user-defined conditions
inside the upstream Electrical & low-voltage trade rather than becoming a second
classification system.

### Acceptance criteria

The integrated milestone is usable when:

1. Upstream Trade view and Electrical & low-voltage suites continue to work.
2. A user-defined condition stores either the colored-square marker or a
   built-in symbol identifier without changing its EA math.
3. Existing projects continue to render with colored squares.
4. Plan labels support none, condition tag, custom text and stable sequential
   instance labels.
5. Main canvas, reference pane, Report legend and Marked Set use the same object
   presentation model.
6. Save/load, copy/paste, templates and undo/redo preserve object presentation.
7. Supporting-material coverage follows imperial/metric display units without
   changing stored rates or upstream assembly rules.
8. Authored-layer show/hide is view-only, lock blocks UI editing/placement,
   dangling ids fail open, and referenced layers cannot be deleted silently.
9. Automated tests cover legacy defaults, symbol/label/layer persistence,
   marker-independent totals and metric coverage.

## Near-term reporting note

Length-based material rows need a waste-inclusive aggregate in metric work. A
custom column may already express this value, so it does not block the first
milestone. After the custom-column path is verified, add the calculation as a
predefined column when that improves the default electrical workflow.

Metric materials are now part of the self-hosted integration. Coverage input
and display convert between SF/LF and m²/m, CSV/XLSX coverage labels follow the
active unit mode, and the live counter uses the same display units. Upstream
assembly order rules and item waste remain authoritative.

## Later milestones

These capabilities follow the first usable milestone and need their own design
decisions:

- replace browser-only persistence with an optional self-hosted project service
  that saves a versioned sidecar dataset beside the source PDF; keep portable
  import/export and define the sidecar format before adding server-only fields;
- a larger symbol library and custom symbols;
- authored line styles and labels;
- snap behavior for authored plan geometry;
- layer management and saved views;
- objects and physical routes that participate in more than one system or
  layer, such as access-control and camera cables sharing one conduit;
- printable plan PDF output that combines the background PDF with selected
  authored layers while keeping their source records separate.

The sidecar-backed project service is the next architectural milestone after
the built-in symbol/label milestone. It comes before custom symbol libraries so
new authored data has a durable, inspectable storage boundary instead of adding
more browser-only state.

## Open decisions

Resolve these questions before implementation reaches the affected surface:

- whether downstream needs saved Trade-view presets beyond upstream's current
  Trade selector;
- which finish-only controls should eventually collapse automatically while the
  Electrical & low voltage trade is active, without creating a second profile;
- whether symbols are colorized, fixed-color, or offer both behaviors;
- symbol size, rotation, anchor, and scale rules;
- where marker selection lives in the current condition and object editor;
- which exports show graphical symbols and which remain quantity-only;
- the data model for devices, cables, routes, conduits, connections, racks, and
  rooms after the symbol milestone.

## Branch policy

- `main` follows `Kentucky-ai/opentakeoff` and carries no downstream product
  development.
- `selfhosted` is the downstream integration branch.
- Feature branches start from `selfhosted` and open pull requests back to
  `selfhosted`.
- Temporary sync branches may merge upstream into `selfhosted`, but downstream
  feature work stays off `main`.
