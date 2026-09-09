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

The exact first built-in symbol set remains to be selected. The milestone needs
only enough symbols to prove the model, picker, persistence, canvas rendering,
and takeoff behavior. A full symbol library and custom symbol import come
later.

### Discipline profile

Add a discipline profile that controls which interface sections OpenTakeoff
renders. The first useful split is:

- the current flooring-oriented workspace;
- an electrical workspace that omits flooring-only interface.

The profile is a presentation and capability-selection layer. It does not
create a second project schema, discard hidden settings, or fork quantity
calculation. Switching profiles restores the controls and data that belong to
the selected profile.

The first implementation must inventory the current flooring-specific
interface before it fixes the exact electrical profile. Roll-goods layout,
seams, flooring transitions, grout tools, and other finish-floor controls are
candidates for the flooring profile; the inventory decides the boundary.

### Acceptance criteria

The milestone is usable when:

1. The selected discipline profile persists across reloads.
2. The profile changes the rendered tool and panel surface without deleting
   data.
3. A user-defined object type stores either the colored-square marker or a
   built-in symbol identifier.
4. Existing project data continues to render with colored squares.
5. A placed object uses its selected marker consistently on the canvas and in
   every existing edit, save, import, and export round trip that carries the
   object.
6. Counts and quantity calculations remain independent of marker style.
7. Automated tests cover profile persistence, hidden-feature data retention,
   legacy marker defaults, symbol persistence, and marker-independent totals.

## Near-term reporting note

Length-based material rows need a waste-inclusive aggregate in metric work. A
custom column may already express this value, so it does not block the first
milestone. After the custom-column path is verified, add the calculation as a
predefined column when that improves the default electrical workflow.

The `feature/metric-materials` branch is the current metric foundation. It
converts material coverage input and display between square feet or linear feet
and square meters or meters, and it makes the live counter follow the selected
display units. Merge it into `selfhosted` separately from the first milestone.

## Later milestones

These capabilities follow the first usable milestone and need their own design
decisions:

- a larger symbol library and custom symbols;
- authored line styles and labels;
- snap behavior for authored plan geometry;
- layer management and saved views;
- objects and physical routes that participate in more than one system or
  layer, such as access-control and camera cables sharing one conduit;
- printable plan PDF output that combines the background PDF with selected
  authored layers while keeping their source records separate.

## Open decisions

Resolve these questions before implementation reaches the affected surface:

- the name and extensibility model of the discipline profiles;
- whether the selected profile belongs to one project or to the whole local
  workspace;
- the exact controls hidden by the first electrical profile;
- the initial built-in symbol set;
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
- `feature/metric-materials` predates this policy but currently shares the same
  base commit and can target `selfhosted` directly.
