import {describe, expect, it} from 'vitest';
import {exposureCurveSvg, extractExposureSeries} from '../../src/stats/exposure-curve.ts';

const series = [900, 880, 860, 840, 900];

describe('extractExposureSeries', () => {
  it('returns trial index and exposure pairs for trials that carry exposureMs', () => {
    const points = extractExposureSeries([
      {trialIndex: 0, stimulus: 'square', reactionTime: 300, outcome: 'Success', expectedAction: 'RIGHT', actualAction: 'RIGHT', exposureMs: 900},
      {trialIndex: 1, stimulus: 'circle', reactionTime: -1, outcome: 'Miss', expectedAction: 'LEFT', actualAction: 'NONE', exposureMs: 880},
      {trialIndex: 2, stimulus: 'triangle', reactionTime: -1, outcome: 'CorrectRejection', expectedAction: 'NONE', actualAction: 'NONE', exposureMs: 860},
    ]);
    expect(points).toEqual([
      {index: 0, exposureMs: 900},
      {index: 1, exposureMs: 880},
      {index: 2, exposureMs: 860},
    ]);
  });

  it('omits trials without exposureMs (legacy data before backfill)', () => {
    const points = extractExposureSeries([
      {trialIndex: 0, stimulus: 'square', reactionTime: 300, outcome: 'Success', expectedAction: 'RIGHT', actualAction: 'RIGHT'},
      {trialIndex: 1, stimulus: 'circle', reactionTime: 200, outcome: 'Success', expectedAction: 'LEFT', actualAction: 'LEFT', exposureMs: 700},
    ] as never[]);
    expect(points).toEqual([{index: 1, exposureMs: 700}]);
  });
});

describe('exposureCurveSvg', () => {
  it('renders an svg polyline through all points inside the padded viewBox', () => {
    const svg = exposureCurveSvg(series);
    expect(svg.startsWith('<svg viewBox="0 0 600 160"')).toBe(true);
    expect(svg).toContain('<polyline');
    // Padded x-range: first point at padX, last at width-padX.
    expect(svg).toContain('cx="10"');
    expect(svg).toContain('cx="590"');
    // Values within [padY, height-padY] -> no NaN anywhere.
    expect(svg).not.toContain('NaN');
  });

  it('handles flat and single-point series without division by zero', () => {
    const flat = exposureCurveSvg([500, 500, 500]);
    expect(flat).toContain(',80 ');      // centered mid line (height/2)
    expect(flat).not.toContain('NaN');
    expect(exposureCurveSvg([700])).toContain('cx="300"'); // single dot, centered
    expect(exposureCurveSvg([])).toBe('');
  });

  it('scales to the series min/max, hitting the padded extremes', () => {
    const svg = exposureCurveSvg([100, 900]); // min->bottom (y=144), max->top (y=16)
    expect(svg).toContain('10,144');
    expect(svg).toContain('590,16');
  });

  it('accepts stamped TrialResult records directly', () => {
    const svg = exposureCurveSvg([
      {trialIndex: 0, stimulus: 'square', reactionTime: 100, outcome: 'Success', expectedAction: 'RIGHT', actualAction: 'RIGHT', exposureMs: 500},
      {trialIndex: 1, stimulus: 'circle', reactionTime: 100, outcome: 'Success', expectedAction: 'LEFT', actualAction: 'LEFT', exposureMs: 300},
    ] as never[]);
    expect(svg).not.toContain('NaN');
    expect(svg).toContain('<polyline');
  });
});
