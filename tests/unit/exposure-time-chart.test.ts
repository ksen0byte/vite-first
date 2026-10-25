// @vitest-environment happy-dom
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {TrialResult} from '../../src/config/domain.ts';

const {chart} = vi.hoisted(() => ({chart: vi.fn(function () {})}));
vi.mock('chart.js/auto', () => ({default: chart}));
import {drawExposureTimeChart} from '../../src/components/exposure-time-chart.ts';

const trial = (exposureMs: number, trialIndex = 0): TrialResult => ({
  trialIndex, exposureMs, stimulus: 'circle', reactionTime: 200,
  outcome: 'Success', expectedAction: 'DEFAULT', actualAction: 'DEFAULT',
});

describe('exposure chart edge cases', () => {
  beforeEach(() => chart.mockClear());

  it.each([[0], [10], [20, 40], []])('keeps the Y axis nonnegative for %j', (...values: number[]) => {
    drawExposureTimeChart(document.createElement('canvas'), values.map(trial), 20);
    const config = chart.mock.calls[0][1];
    expect(config.options.scales.y.min).toBeGreaterThanOrEqual(0);
    expect(config.options.scales.y.max).toBeGreaterThan(config.options.scales.y.min);
  });

  it('gives a flat series space above and below', () => {
    drawExposureTimeChart(document.createElement('canvas'), [trial(260), trial(260, 1)], 20);
    const y = chart.mock.calls[0][1].options.scales.y;
    expect(y.min).toBeLessThan(260);
    expect(y.max).toBeGreaterThan(260);
  });

  it('rejects invalid steps and durations', () => {
    const canvas = document.createElement('canvas');
    expect(() => drawExposureTimeChart(canvas, [], 0)).toThrow('positive adjustment step');
    expect(() => drawExposureTimeChart(canvas, [trial(-1)], 20)).toThrow('Invalid exposure duration');
  });

  it('supports histories larger than the function argument limit', () => {
    const trials = Array.from({length: 150_000}, (_, index) => trial(260, index));
    drawExposureTimeChart(document.createElement('canvas'), trials, 20);
    expect(chart.mock.calls[0][1].options.scales.x.max).toBe(150_000);
  });
});
