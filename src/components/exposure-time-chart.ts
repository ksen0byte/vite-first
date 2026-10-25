import Chart from 'chart.js/auto';
import type {Scale} from 'chart.js';
import type {TrialResult} from '../config/domain.ts';
import {localize} from '../localization/localization.ts';
import {LanguageManager} from '../localization/LanguageManager.ts';

type ExposurePoint = {x: number; y: number};
type ExposureRange =
  | {kind: 'NoRecordedExposure'}
  | {kind: 'Available'; lowest: ExposurePoint; maximum: number};

export function drawExposureTimeChart(canvas: HTMLCanvasElement, trials: readonly TrialResult[], adjustmentStep: number): Chart {
  if (!Number.isFinite(adjustmentStep) || adjustmentStep <= 0) {
    throw new Error(`Exposure chart requires a positive adjustment step: ${adjustmentStep}`);
  }
  const data = [...trials].sort((a, b) => a.trialIndex - b.trialIndex).map(trial => {
    const x = trial.trialIndex + 1;
    // Older records may lack exposure stamps; Chart.js uses null for a gap.
    if (trial.exposureMs == null) return {x, y: null};
    if (!Number.isFinite(trial.exposureMs) || trial.exposureMs < 0) {
      throw new Error(`Invalid exposure duration for trial ${x}: ${trial.exposureMs}`);
    }
    return {x, y: trial.exposureMs};
  });
  const range = data.reduce<ExposureRange>((range, point) => {
    if (point.y === null) return range;
    const exposure = {x: point.x, y: point.y};
    if (range.kind === 'NoRecordedExposure') return {kind: 'Available', lowest: exposure, maximum: exposure.y};
    return {kind: 'Available', lowest: exposure.y < range.lowest.y ? exposure : range.lowest,
      maximum: Math.max(range.maximum, exposure.y)};
  }, {kind: 'NoRecordedExposure'});
  const min = range.kind === 'Available' ? range.lowest.y : 0;
  const max = range.kind === 'Available' ? range.maximum : adjustmentStep;
  const exposureTickStep = adjustmentStep * Math.max(1, Math.ceil((max - min) / adjustmentStep / 8));
  const axisMin = Math.max(0, (Math.floor(min / exposureTickStep) - 1) * exposureTickStep);
  const axisMax = (Math.ceil(max / exposureTickStep) + 1) * exposureTickStep;
  const lastTrial = data.reduce((last, point) => Math.max(last, point.x), 2);
  const trialTickStep = lastTrial <= 20 ? 1 : 10 * Math.ceil(lastTrial / 200);
  const includeTick = (value: number, spacing: number) => (scale: Scale) => {
    scale.ticks = [...scale.ticks.filter(tick => Math.abs(tick.value - value) >= spacing * 0.65), {value}]
      .sort((a, b) => a.value - b.value);
  };
  const number = new Intl.NumberFormat(LanguageManager.getCurrentLanguage(), {maximumFractionDigits: 2});
  const textColor = () => getComputedStyle(canvas).color || '#666';
  const themeToggle = document.getElementById('theme-toggle');
  const refreshTheme = () => chart.update('none');
  const chart: Chart = new Chart(canvas, {
    plugins: [{
      id: 'exposureTheme',
      beforeUpdate: chart => {
        const color = textColor();
        chart.options.plugins!.title!.color = color;
        chart.options.plugins!.subtitle!.color = color;
        chart.options.scales!.x!.title!.color = color;
        chart.options.scales!.y!.title!.color = color;
      },
      afterInit: () => themeToggle?.addEventListener('click', refreshTheme),
      afterDestroy: () => themeToggle?.removeEventListener('click', refreshTheme),
    }],
    type: 'line',
    data: {
      datasets: [
        {label: localize('exposureTimeLabel'), data, borderColor: '#36a2eb', borderWidth: 2,
          pointRadius: data.map(point => range.kind === 'Available' && point.x === range.lowest.x ? 5 : 2), spanGaps: false},
        ...(range.kind === 'Available' ? [{
          label: localize('minimumExposureLabel'),
          data: [{x: 1, y: range.lowest.y}, range.lowest, {x: range.lowest.x, y: axisMin}],
          borderColor: '#dc2626', borderDash: [3, 4], borderWidth: 2, pointRadius: 0,
        }] : []),
      ],
    },
    options: {
      animation: false,
      responsive: true, maintainAspectRatio: false,
      locale: LanguageManager.getCurrentLanguage(),
      scales: {
        x: {type: 'linear', min: 1, max: lastTrial,
          title: {display: true, text: localize('trialNumberLabel'), color: textColor()},
          grid: {color: 'rgba(128, 128, 128, 0.2)'},
          ...(range.kind === 'Available' ? {afterBuildTicks: includeTick(range.lowest.x, trialTickStep)} : {}),
          ticks: {stepSize: trialTickStep, precision: 0, autoSkip: false, maxRotation: 0,
            showLabelBackdrop: context => range.kind === 'Available' && context.tick.value === range.lowest.x,
            backdropColor: '#fee2e2', backdropPadding: 4,
            color: context => range.kind === 'Available' && context.tick.value === range.lowest.x
              ? '#dc2626' : textColor()}},
        y: {min: axisMin, max: axisMax,
          title: {display: true, text: `${localize('exposureTimeLabel')} (${localize('ms')})`, color: textColor()},
          grid: {color: 'rgba(128, 128, 128, 0.2)'},
          ...(range.kind === 'Available' ? {afterBuildTicks: includeTick(range.lowest.y, exposureTickStep)} : {}),
          ticks: {stepSize: exposureTickStep, autoSkip: false,
            showLabelBackdrop: context => range.kind === 'Available' && context.tick.value === range.lowest.y,
            backdropColor: '#fee2e2', backdropPadding: 4,
            color: context => range.kind === 'Available' && context.tick.value === range.lowest.y
              ? '#dc2626' : textColor(),
            callback: value => `${number.format(Number(value))} ${localize('ms')}`}},
      },
      plugins: {
        legend: {display: false},
        title: {display: true, text: localize('exposureTimeChartTitle'), color: textColor()},
        subtitle: {display: range.kind === 'NoRecordedExposure', text: localize('noExposureTimes'), color: textColor()},
        tooltip: {filter: item => item.datasetIndex === 0, callbacks: {
          title: items => items.map(item => {
            if (item.parsed.x === null) throw new Error('Exposure tooltip is missing its trial number');
            return `${localize('trialNumberLabel')}: ${number.format(item.parsed.x)}`;
          }),
          label: item => {
            if (item.parsed.y === null) throw new Error('Exposure tooltip is missing its exposure duration');
            return `${localize('exposureTimeLabel')}: ${number.format(item.parsed.y)} ${localize('ms')}`;
          },
        }},
      },
    },
  });
  return chart;
}
