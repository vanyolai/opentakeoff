import test from "node:test";
import assert from "node:assert/strict";

import {
  coverageToDisplay,
  coverageFromDisplay,
  coverageBasisLabel,
} from "../src/lib/coverageUnits.js";

test("linear coverage converts LF/unit to m/unit", () => {
  assert.equal(
    coverageToDisplay(1, "linear", "metric"),
    0.3048
  );
});

test("linear coverage converts m/unit back to LF/unit", () => {
  const ft = coverageFromDisplay(1, "linear", "metric");

  assert.ok(
    Math.abs(ft - 3.280839895013123) < 1e-10
  );
});

test("area coverage converts SF/unit to m2/unit", () => {
  assert.equal(
    coverageToDisplay(1, "area", "metric"),
    0.09290304
  );
});

test("area coverage converts m2/unit back to SF/unit", () => {
  const sf = coverageFromDisplay(1, "area", "metric");

  assert.ok(
    Math.abs(sf - 10.763910416709722) < 1e-10
  );
});

test("count coverage is unchanged", () => {
  assert.equal(
    coverageToDisplay(3, "count", "metric"),
    3
  );

  assert.equal(
    coverageFromDisplay(3, "count", "metric"),
    3
  );
});

test("seam coverage follows linear units", () => {
  assert.equal(
    coverageToDisplay(10, "seam_lf", "metric"),
    3.048
  );
});

test("coverage basis labels follow display units", () => {
  assert.equal(coverageBasisLabel("area", "metric"), "m²");
  assert.equal(coverageBasisLabel("linear", "metric"), "m");
  assert.equal(coverageBasisLabel("seam_lf", "metric"), "seam m");
  assert.equal(coverageBasisLabel("count", "metric"), "EA");

  assert.equal(coverageBasisLabel("area", "imperial"), "SF");
  assert.equal(coverageBasisLabel("linear", "imperial"), "LF");
});
