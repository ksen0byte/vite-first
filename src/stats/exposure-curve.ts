import {TrialResult} from "../config/domain.ts";

export interface ExposurePoint {
  readonly index: number;
  readonly exposureMs: number;
}

export type ExposureTiming =
  | {readonly kind: "Available"; readonly valueMs: number}
  | {readonly kind: "Unavailable"; readonly reason: "InvalidPause" | "IncompleteExposureHistory" | "InvalidExposureDuration"};

export interface ExposureSummary {
  readonly minExposureMs: number;
  readonly reachedAfterTrial: number;
  readonly timeToMinimum: ExposureTiming;
  readonly totalTime: ExposureTiming;
  readonly processedCount: number;
}

/** Trials that carry an exposure stamp, in presentation order. */
export function extractExposureSeries(trials: readonly TrialResult[]): ExposurePoint[] {
  return trials
    .filter((trial): trial is TrialResult & {exposureMs: number} =>
      typeof trial.exposureMs === "number" && Number.isFinite(trial.exposureMs) && trial.exposureMs >= 0)
    .map((trial) => ({index: trial.trialIndex, exposureMs: trial.exposureMs}));
}

/** Summarize adaptation using human-facing, one-based trial numbers. */
export function summarizeExposure(trials: readonly TrialResult[], pauseMs?: number): ExposureSummary | null {
  const points = extractExposureSeries(trials);
  if (points.length === 0) return null;

  const minExposureMs = Math.min(...points.map((point) => point.exposureMs));
  const firstMinPosition = points.findIndex((point) => point.exposureMs === minExposureMs);
  // Exposure on a stimulus was selected after the preceding trial. The first
  // stimulus is the exception: its exposure is the configured initial value.
  const reachedAfterTrial = firstMinPosition === 0
    ? points[0].index + 1
    : points[firstMinPosition - 1].index + 1;

  // Feedback cadence: an initial pause, then exposure + pause for each trial.
  // The minimum is selected at the boundary before its first presentation.
  // An initially minimal exposure is already selected at test start.
  const precedingPoints = points.slice(0, firstMinPosition);
  const completeTiming = points.slice(0, firstMinPosition + 1).every((point, index) => point.index === index);
  let timeToMinimum: ExposureTiming;
  if (pauseMs === undefined || !Number.isFinite(pauseMs) || pauseMs < 0) {
    timeToMinimum = {kind: "Unavailable", reason: "InvalidPause"};
  } else if (!completeTiming) {
    timeToMinimum = {kind: "Unavailable", reason: "IncompleteExposureHistory"};
  } else {
    const valueMs = firstMinPosition === 0 ? 0
      : pauseMs + precedingPoints.reduce((total, point) => total + point.exposureMs + pauseMs, 0);
    timeToMinimum = Number.isFinite(valueMs)
      ? {kind: "Available", valueMs}
      : {kind: "Unavailable", reason: "InvalidExposureDuration"};
  }

  const totalTime = calculateExposureTime(points, pauseMs);
  return {minExposureMs, reachedAfterTrial, timeToMinimum, totalTime, processedCount: points.length};
}

/** Scheduled time from test start through the final feedback window. */
function calculateExposureTime(points: readonly ExposurePoint[], pauseMs?: number): ExposureTiming {
  if (pauseMs === undefined || !Number.isFinite(pauseMs) || pauseMs < 0) {
    return {kind: "Unavailable", reason: "InvalidPause"};
  }
  if (!points.every((point, index) => point.index === index)) {
    return {kind: "Unavailable", reason: "IncompleteExposureHistory"};
  }
  const valueMs = pauseMs + points.reduce((total, point) => total + point.exposureMs + pauseMs, 0);
  return Number.isFinite(valueMs)
    ? {kind: "Available", valueMs}
    : {kind: "Unavailable", reason: "InvalidExposureDuration"};
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
