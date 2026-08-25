import {TrialResult} from "../config/domain.ts";

export interface ExposurePoint {
  readonly index: number;
  readonly exposureMs: number;
}

/** Trials that carry an exposure stamp, in presentation order. */
export function extractExposureSeries(trials: readonly TrialResult[]): ExposurePoint[] {
  return trials
    .filter((trial): trial is TrialResult & {exposureMs: number} => typeof trial.exposureMs === "number")
    .map((trial) => ({index: trial.trialIndex, exposureMs: trial.exposureMs}));
}

const isNumberSeries = (input: readonly unknown[]): input is readonly number[] =>
  input.length > 0 && typeof input[0] === "number";

/**
 * Pure renderer: builds a lightweight inline SVG polyline of the exposure
 * schedule across trials (the doc's "дод. результати" dynamics graph).
 * Accepts either stamped TrialResult records or a plain ms series.
 * No chart library; the output is injected as trusted static markup.
 * Returns an empty string when there is nothing to draw.
 */
export function exposureCurveSvg(trialsOrSeries: readonly TrialResult[] | readonly number[] | readonly ExposurePoint[]): string {
  const points: ExposurePoint[] = isNumberSeries(trialsOrSeries)
    ? (trialsOrSeries as readonly number[]).map((exposureMs, index) => ({index, exposureMs}))
    : extractExposureSeries(trialsOrSeries as readonly TrialResult[]);

  if (points.length === 0) return "";

  const width = 600;
  const height = 160;
  const padX = 10;
  const padY = 16;

  const values = points.map((p) => p.exposureMs);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;

  // Map each point into the padded viewBox. A single-point or flat series
  // centers on the mid line (span === 0 must not divide by zero).
  const coords = points.map((point, i) => {
    const x = points.length === 1 ? width / 2 : padX + (i * (width - 2 * padX)) / (points.length - 1);
    const y = span === 0 ? height / 2 : padY + ((max - point.exposureMs) / span) * (height - 2 * padY);
    return {x: round1(x), y: round1(y)};
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const dots = coords.map((c) => `<circle cx="${c.x}" cy="${c.y}" r="2.5" />`).join("");

  return `<svg viewBox="0 0 ${width} ${height}" class="w-full" role="img" aria-label="exposure curve">`
    + `<polyline fill="none" stroke="currentColor" stroke-width="1.5" points="${polylinePoints}" />`
    + `${dots}</svg>`;
}

const round1 = (value: number): number => Math.round(value * 10) / 10;
