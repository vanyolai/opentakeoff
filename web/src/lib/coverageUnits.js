import { M_PER_FT, M2_PER_SF } from "./units";

/**
 * Supporting-material coverage is stored internally in the engine's native
 * units: SF/unit, LF/unit or EA/unit.
 *
 * Metric mode is display/input only.
 */
export function coverageToDisplay(per, basis = "area", units = "imperial") {
  const value = Number(per) || 0;
  if (units !== "metric") return value;

  if (basis === "linear" || basis === "seam_lf") {
    return value * M_PER_FT;
  }
  if (basis === "area") {
    return value * M2_PER_SF;
  }
  return value; // count / EA
}

export function coverageFromDisplay(per, basis = "area", units = "imperial") {
  const value = Number(per) || 0;
  if (units !== "metric") return value;

  if (basis === "linear" || basis === "seam_lf") {
    return value / M_PER_FT;
  }
  if (basis === "area") {
    return value / M2_PER_SF;
  }
  return value; // count / EA
}

export function coverageBasisLabel(basis = "area", units = "imperial") {
  if (basis === "count") return "EA";

  if (basis === "linear") {
    return units === "metric" ? "m" : "LF";
  }
  if (basis === "seam_lf") {
    return units === "metric" ? "seam m" : "seam LF";
  }

  return units === "metric" ? "m²" : "SF";
}