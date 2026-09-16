// src/screens/user-profile-screen.ts
import {setupHeader} from '../components/header';
import {setupFooter} from '../components/footer';
import {updateLanguageUI} from '../localization/localization';
import {User, TestRecord} from "../db/db.ts";
import {MultiHandReactionTimeStats, OUTCOME_BREAKDOWN, OutcomeBreakdown, ReactionTimeStats} from "../stats/ReactionTimeStats.ts";
import {TestMode, isFeedback, isFeedbackStrength, feedbackTuning, OptimalSettings, FeedbackMobilitySettings, FeedbackStrengthSettings} from "../config/domain.ts";
import {localize} from "../localization/localization";
import Router, {Cleanup} from "../routing/router.ts";
import {Chart} from "chart.js";
import {printConfig, getHandLocalizationKey} from "../config/settings.ts";
import {escapeHtml} from "../util/html.ts";
import {summarizeExposure} from "../stats/exposure-curve.ts";
import {
  calculateCpiFromRecords,
  computeUserProfileCpiSummary,
  CentralProcessingSummary,
  CentralProcessingResult,
  CrtTestType,
} from "../stats/central-processing.ts";

let chartInstances: Chart[] = [];

export function setupProfileScreen(appContainer: HTMLElement, user: User, tests: TestRecord[]): Cleanup {
  const sortedTests = [...tests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let selectedPzmrId: number | undefined;
  let selectedCrt13Id: number | undefined;
  let selectedCrt23Id: number | undefined;

  let cpiSummary = computeUserProfileCpiSummary(sortedTests, {
    selectedPzmrId,
    selectedCrt13Id,
    selectedCrt23Id,
  });

  // Set CSS variables for print configuration
  document.documentElement.style.setProperty('--print-chart-width', `${printConfig.chart.width}px`);
  document.documentElement.style.setProperty('--print-chart-height', `${printConfig.chart.height}px`);
  document.documentElement.style.setProperty('--print-page-margin', printConfig.page.margin);
  document.documentElement.style.setProperty('--print-table-cell-height', printConfig.table.cellHeight);
  document.documentElement.style.setProperty('--print-font-size', printConfig.fontSize);
  document.documentElement.style.setProperty('--print-line-height', printConfig.lineHeight.toString());

  appContainer.innerHTML = `
    <div id="user-profile-screen" class="flex flex-col flex-grow bg-base-200 text-base-content p-4">
      ${printHeaderHtml(user)}
      <div class="flex-1 space-y-4">
          ${personalDataCardHtml(user)}
          <div id="cpi-summary-container">
            ${centralProcessingSummaryCardHtml(cpiSummary)}
          </div>
          <!-- Test Cards -->
          ${sortedTests.map((test, index) => testCardHTML((sortedTests.length - index), test, cpiSummary.selectedPzmrTest)).join("")}
      </div>
    </div>
  `;
  setupHeader(appContainer);

  const cpiSummaryContainer = appContainer.querySelector<HTMLElement>('#cpi-summary-container');
  if (!cpiSummaryContainer) throw new Error('Required element #cpi-summary-container is missing from the profile screen');

  const updateCpi = (): void => {
    cpiSummary = computeUserProfileCpiSummary(sortedTests, {
      selectedPzmrId,
      selectedCrt13Id,
      selectedCrt23Id,
    });

    cpiSummaryContainer.innerHTML = centralProcessingSummaryCardHtml(cpiSummary);
    updateLanguageUI(cpiSummaryContainer);

    // Every historical CRT card uses the same selected SVMR baseline, so a
    // baseline change must refresh the cards as well as the summary widget.
    appContainer.querySelectorAll<HTMLElement>('.cpi-card-value').forEach((cell) => {
      const testIdValue = cell.dataset.testId;
      if (!testIdValue) throw new Error('A CPI test card is missing its required data-test-id');

      const testId = Number(testIdValue);
      if (!Number.isSafeInteger(testId)) throw new Error(`Invalid CPI test card ID: ${testIdValue}`);

      const testRecord = sortedTests.find((test) => test.id === testId);
      if (!testRecord) throw new Error(`No test record exists for CPI test card ID ${testId}`);

      cell.innerHTML = formatCpiForTestCard(testRecord, cpiSummary.selectedPzmrTest);
      updateLanguageUI(cell);
    });
  };

  // The stable parent keeps this listener alive when updateCpi replaces the
  // select elements inside it, avoiding recursive rebinding and nullable selects.
  const handleCpiSelectionChange = (event: Event): void => {
    if (!(event.target instanceof HTMLSelectElement)) return;

    const selectedId = Number(event.target.value);
    if (!Number.isSafeInteger(selectedId)) {
      throw new Error(`Invalid CPI selection value: ${event.target.value}`);
    }

    switch (event.target.id) {
      case 'cpi-pzmr-select':
        selectedPzmrId = selectedId;
        break;
      case 'cpi-crt13-select':
        selectedCrt13Id = selectedId;
        break;
      case 'cpi-crt23-select':
        selectedCrt23Id = selectedId;
        break;
      default:
        return;
    }

    updateCpi();
  };
  cpiSummaryContainer.addEventListener('change', handleCpiSelectionChange);

  setupFooter(appContainer, userProfileFooterHTML(), [
    {buttonFn: () => document.getElementById("main-page-btn")! as HTMLButtonElement, callback: () => Router.navigate("/")},
    {buttonFn: () => document.getElementById("print-btn")! as HTMLButtonElement, callback: () => handlePrint(user)},
  ]);
  chartInstances = renderHistograms(sortedTests);
  const cleanupPrintHandlers = setupPrintHandlers();
  updateLanguageUI();

  return () => {
    cpiSummaryContainer.removeEventListener('change', handleCpiSelectionChange);
    cleanupPrintHandlers();
    chartInstances.forEach((chart) => chart.destroy());
    chartInstances = [];
  };
}

function handlePrint(user: User): void {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '');
  const filename = `${user.lastName}_${user.firstName}_${dateStr}_${timeStr}`;

  const originalTitle = document.title;
  document.title = filename;

  window.print();

  setTimeout(() => {
    document.title = originalTitle;
  }, 100);
}

function printHeaderHtml(user: User): string {
  const {firstName, lastName, gender, age} = user;
  const currentDate = new Date().toLocaleDateString();
  const genderText = gender === "male" ? `<span data-localize="male"></span>` : `<span data-localize="female"></span>`;

  return `
  <div id="print-header" class="hidden print:block mb-4">
    <h1 class="text-2xl font-bold mb-2" data-localize="printReportTitle"></h1>
    <div class="flex gap-4 text-sm">
      <span><strong data-localize="surnameLabel"></strong>: ${escapeHtml(lastName)}</span>
      <span><strong data-localize="nameLabel"></strong>: ${escapeHtml(firstName)}</span>
      <span><strong data-localize="ageLabel"></strong>: ${age}</span>
      <span><strong data-localize="selectGender"></strong>: ${genderText}</span>
      <span><strong data-localize="printReportDate"></strong>: ${currentDate}</span>
    </div>
    <hr class="my-2 border-black">
  </div>
  `;
}

function personalDataCardHtml(user: User) {
  const {firstName, lastName, gender, age} = user;
  return `
  <div class="card shadow-md bg-base-100 print:hidden">
    <div class="card-body">
      <div class="flex space-x-2">
        <p class="text-lg"><strong data-localize="surnameLabel"></strong>: <span>${escapeHtml(lastName)}</span></p>
        <p class="text-lg"><strong data-localize="nameLabel"></strong>: <span>${escapeHtml(firstName)}</span></p>
        <p class="text-lg"><strong data-localize="ageLabel"></strong>: <span>${age}</span></p>
        <p class="text-lg ${gender === "male" ? "" : "hidden"}"><strong data-localize="selectGender"></strong>: <span data-localize="male"></span></p>
        <p class="text-lg ${gender === "female" ? "" : "hidden"}"><strong data-localize="selectGender"></strong>: <span data-localize="female"></span></p>
      </div>
    </div>
  </div>
  `
}

function testCardHTML(index: number, test: TestRecord, baselinePzmr: TestRecord | null = null): string {
  const {testSettings, trials, date} = test;
  const {testMode, stimulusSize, testType} = testSettings;
  const isOptimalArm = testSettings.protocolMode === 'optimal';
  const isFeedbackSession = isFeedback(testSettings);
  const protocolKey = testSettings.protocolMode === 'optimal' ? 'optimalProtocol' : 'feedbackProtocol';
  const submodeKey = testSettings.protocolMode === 'feedback-strength' ? 'feedbackStrength' : 'feedbackMobility';

  // Late answers legitimately exceed the fixed exposure in feedback mode, so
  // bound RT cleaning by maxExposure + pause instead of exposureTime.
  const rtUpperBound = isFeedbackSession
    ? feedbackTuning(testSettings).maxExposure + feedbackTuning(testSettings).pause
    : (testSettings as OptimalSettings).exposureTime;
  const statsDebugLabel = `Profile test #${index} (${new Date(date).toLocaleString()}, ${testType})`;

  const showHandBreakdown = testType === "crt2-3";
  const multiHandStats = showHandBreakdown
    ? new MultiHandReactionTimeStats(trials, rtUpperBound, 100, statsDebugLabel, testType)
    : null;
  const stats = multiHandStats?.total ?? new ReactionTimeStats(trials, rtUpperBound, 100, testType, statsDebugLabel);
  const statsRight = multiHandStats?.right;
  const statsLeft = multiHandStats?.left;

  return `
    <div class="card shadow-md bg-base-100">
      <div class="card-body">
        <h2 class="card-title flex justify-between">
          <!-- Localized Test Card Title -->
          <div>
            <span data-localize="testCardTitle"></span>
            <span> #${index}</span>
          </div>
          <span>${new Date(date).toLocaleString()}</span>
        </h2>

        <div class="flex justify-between">
          <!-- Test Settings -->
          <div class="overflow-x-auto mt-4 w-full">          
            <table class="table table-zebra table-md w-full">
              <thead>
                <tr class="text-center">
                  <th data-localize="testSettingLabel"></th>
                  <th data-localize="testSettingValueLabel"></th>
                </tr>
              </thead>
              <tr class="text-center">
                <td><strong data-localize="testModeLabel"></strong></td>
                <td><span data-localize="${getTestModeLocalizationKey(testMode)}"></span></td>
              </tr>
              <tr class="text-center">
                <td><strong data-localize="protocolLabel"></strong></td>
                <td><span data-localize="${protocolKey}"></span></td>
              </tr>
              ${isFeedbackSession ? `
              <tr class="text-center">
                <td><strong data-localize="submodeLabel"></strong></td>
                <td><span data-localize="${submodeKey}"></span></td>
              </tr>` : ""}
              <tr class="text-center">
                <td><strong data-localize="stimulusSizeLabel"></strong></td>
                <td>${Math.round(stimulusSize)} <span data-localize="mm"></span></td>
              </tr>
              ${isOptimalArm ? `
              <tr class="text-center">
                <td><strong data-localize="exposureTimeLabel"></strong></td>
                <td>${Math.round(testSettings.exposureTime)} <span data-localize="ms"></span></td>
              </tr>
              <tr class="text-center">
                <td><strong data-localize="exposureDelayMinMaxLabel"></strong></td>
                <td>${Math.round(Math.min(...testSettings.exposureDelay))} <span data-localize="ms"></span> - ${Math.round(Math.max(...testSettings.exposureDelay))} <span data-localize="ms"></span></td>
              </tr>` : `
              <tr class="text-center">
                <td><strong data-localize="feedbackInitialExposure"></strong></td>
                <td>${Math.round(feedbackTuning(testSettings).initialExposure)} <span data-localize="ms"></span></td>
              </tr>
              <tr class="text-center">
                <td><strong data-localize="feedbackPause"></strong></td>
                <td>${Math.round(feedbackTuning(testSettings).pause)} <span data-localize="ms"></span></td>
              </tr>`}
              <tr class="text-center">
                <td><strong data-localize="${isFeedbackStrength(testSettings) ? 'durationLabel' : 'stimulusCountLabel'}"></strong></td>
                <td>${isFeedbackStrength(testSettings) ? `${(testSettings as FeedbackStrengthSettings).feedback.duration} ${localize('s')}` : `${(testSettings as OptimalSettings | FeedbackMobilitySettings).stimulusCount}`}</td>
              </tr>
              <tr class="text-center">
                <td><strong data-localize="testTypeLabel"></strong></td>
                <td><span data-localize="${getTestTypeLocalizationKey(testType)}"></span></td>
              </tr>
              ${testType !== "crt2-3" ? `
              <tr class="text-center">
                <td><strong data-localize="handLabel"></strong></td>
                <td><span data-localize="${getHandLocalizationKey(testSettings.hand)}"></span></td>
              </tr>` : ""}
            </table>
          </div>
          <!-- Divider -->
          <div class="divider divider-horizontal"></div>
          <!-- Reaction Time Statistics Table -->
          <div class="overflow-x-auto mt-4 w-full">
            <table class="table table-zebra table-md w-full">
              <thead>
                <tr class="text-center">
                  <th data-localize="statLabel"></th>
                  <th data-localize="valueLabel"></th>
                </tr>
              </thead>
              <tbody>
                <!-- Table Rows Localized -->
                <tr class="text-center">
                  <td><strong data-localize="countLabel"></strong></td>
                  <td>
                    ${stats.count}${filteredCountHtml(stats.filteredCount)}
                    ${handBreakdownValueHtml(statsLeft?.count, statsRight?.count)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="meanLabel"></strong></td>
                  <td>
                    ${stats.meanVal.toFixed(2)} <span data-localize="ms"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${handStats.meanVal.toFixed(2)} <span data-localize="ms"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td>
                    <div class="inline-flex items-center justify-center gap-1">
                      <strong data-localize="motorComponentLabel"></strong>
                      <span class="tooltip tooltip-right cursor-help text-xs opacity-70 hover:opacity-100" data-localize-tip="motorComponentHelp" data-tip="${localize('motorComponentHelp')}">(?)</span>
                    </div>
                  </td>
                  <td>
                    ${formatMotorComponent(stats)}
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => formatMotorComponent(handStats))}
                  </td>
                </tr>
                ${testType === "svmr" ? `
                <tr class="text-center">
                  <td>
                    <div class="inline-flex items-center justify-center gap-1">
                      <strong data-localize="sensoryComponentLabel"></strong>
                      <span class="tooltip tooltip-right cursor-help text-xs opacity-70 hover:opacity-100" data-localize-tip="sensoryComponentHelp" data-tip="${localize('sensoryComponentHelp')}">(?)</span>
                    </div>
                  </td>
                  <td>
                    ${formatSensoryComponent(stats)}
                  </td>
                </tr>` : `
                <tr class="text-center">
                  <td>
                    <div class="inline-flex items-center justify-center gap-1">
                      <strong data-localize="cpiCardRowLabel"></strong>
                      <span class="tooltip tooltip-right cursor-help text-xs opacity-70 hover:opacity-100" data-localize-tip="cpiBaselineHelp" data-tip="${localize('cpiBaselineHelp')}">(?)</span>
                    </div>
                  </td>
                  <td class="cpi-card-value" data-test-id="${test.id ?? ''}">
                    ${formatCpiForTestCard(test, baselinePzmr)}
                  </td>
                </tr>`}
                <tr class="text-center">
                  <td><strong data-localize="statisticalModeLabel"></strong></td>
                  <td>
                    ${stats.modeVal ? stats.modeVal.toFixed(2) : "N/A"} <span data-localize="ms"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${handStats.modeVal ? handStats.modeVal.toFixed(2) : "N/A"} <span data-localize="ms"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="stdevLabel"></strong></td>
                  <td>
                    ${stats.stdevVal.toFixed(2)} <span data-localize="ms"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${handStats.stdevVal.toFixed(2)} <span data-localize="ms"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="cvLabel"></strong></td>
                  <td>
                    ${stats.cvVal.toFixed(2)}%
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${handStats.cvVal.toFixed(2)}%`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="entropyLabel"></strong></td>
                  <td>
                    ${stats.entropyVal.toFixed(3)} <span data-localize="bits"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${handStats.entropyVal.toFixed(3)} <span data-localize="bits"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="medianLabel"></strong></td>
                  <td>
                    ${stats.p50Val.toFixed(2)} <span data-localize="ms"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${handStats.p50Val.toFixed(2)} <span data-localize="ms"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="p90Label"></strong></td>
                  <td>
                    ${stats.p90Val.toFixed(2)} <span data-localize="ms"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${handStats.p90Val.toFixed(2)} <span data-localize="ms"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="p97Label"></strong></td>
                  <td>
                    ${stats.p97Val.toFixed(2)} <span data-localize="ms"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${handStats.p97Val.toFixed(2)} <span data-localize="ms"></span>`)}
                  </td>
                </tr>
                ${isFeedbackSession ? feedbackStatsRowsHtml(trials) : ""}
              </tbody>
            </table>
          </div>
          <!-- Divider -->
          <div class="divider divider-horizontal"></div>
          <!-- Reaction Time Advanced Statistics Table -->
          <div class="overflow-x-auto mt-4 w-full">
            <table class="table table-zebra table-md w-full">
              <thead>
                <tr class="text-center">
                  <th data-localize="statLabel"></th>
                  <th data-localize="valueLabel"></th>
                </tr>
              </thead>
              <tbody>
                <!-- Table Rows Localized -->
                <tr class="text-center">
                  <td><strong data-localize="statErrorsTotal"></strong></td>
                  <td>
                    ${stats.errorCount}
                    ${handBreakdownValueHtml(statsLeft?.errorCount, statsRight?.errorCount)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="statErrorsPercentage"></strong></td>
                  <td>
                    ${stats.errorPercentage.toFixed(2)}%
                    ${handBreakdownValueHtml(statsLeft?.errorPercentage, statsRight?.errorPercentage, (value) => `${value.toFixed(2)}%`)}
                  </td>
                </tr>
                ${errorBreakdownRowsHtml(stats, multiHandStats)}
                <tr class="text-center">
                  <td><strong data-localize="statFunctionalLevel"></strong></td>
                  <td>
                    ${formatStatistic(stats.calculateFunctionalLevel())} <span data-localize="au"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${formatStatistic(handStats.calculateFunctionalLevel())} <span data-localize="au"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="statReactionStability"></strong></td>
                  <td>
                    ${formatStatistic(stats.calculateReactionStability())} <span data-localize="au"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${formatStatistic(handStats.calculateReactionStability())} <span data-localize="au"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="statFunctionalCapabilities"></strong></td>
                  <td>
                    ${formatStatistic(stats.calculateFunctionalCapabilities())} <span data-localize="au"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, (handStats) => `${formatStatistic(handStats.calculateFunctionalCapabilities())} <span data-localize="au"></span>`)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Histogram -->
        <div class="flex flex-grow p-8 min-h-96">
          <canvas id="histogram-${test.id!}"></canvas>
        </div>

      </div>
    </div>
  `;
}

/**
 * Feedback-only per-test rows: minimum exposure reached, when it was reached,
 * and how many stimuli carried an exposure stamp. Hidden for optimal sessions.
 */
function feedbackStatsRowsHtml(trials: TestRecord["trials"]): string {
  const summary = summarizeExposure(trials);
  if (!summary) return "";

  return `
    <tr class="text-center">
      <td><strong data-localize="statMinExposure"></strong></td>
      <td>${summary.minExposureMs} <span data-localize="ms"></span></td>
    </tr>
    <tr class="text-center">
      <td><strong data-localize="statMinExposureTrial"></strong></td>
      <td>#${summary.reachedAfterTrial}</td>
    </tr>
    <tr class="text-center">
      <td><strong data-localize="statStimuliProcessed"></strong></td>
      <td>${summary.processedCount}</td>
    </tr>`;
}

function filteredCountHtml(filteredCount: number): string {
  return filteredCount > 0
    ? ` <span class="text-error" title="Filtered reactions">(${filteredCount})</span>`
    : "";
}

function formatMotorComponent(stats: ReactionTimeStats): string {
  if (stats.motorComponent.kind === "NotRecorded") {
    return `<span data-localize="notRecorded"></span>`;
  }
  if (stats.motorComponent.kind === "NoValidSamples") {
    return `<span data-localize="noValidMotorData"></span>`;
  }
  return `${stats.motorComponent.meanMs.toFixed(2)} <span data-localize="ms"></span>`;
}

function formatSensoryComponent(stats: ReactionTimeStats): string {
  if (stats.sensoryComponent.kind === "NotRecorded") {
    return `<span data-localize="notRecorded"></span>`;
  }
  if (stats.sensoryComponent.kind === "NoValidMotorData") {
    return `<span data-localize="noValidMotorData"></span>`;
  }
  if (stats.sensoryComponent.kind === "NoValidReactionData" || stats.sensoryComponent.kind === "InvalidComponentOrder") {
    return `<span data-localize="noValidSensoryData"></span>`;
  }
  if (stats.sensoryComponent.kind === "NotApplicable") {
    return `N/A`;
  }
  return `${stats.sensoryComponent.valueMs.toFixed(2)} <span data-localize="ms"></span>`;
}

function formatCpiForTestCard(test: TestRecord, baselinePzmr: TestRecord | null): string {
  if (!baselinePzmr) {
    return `<span class="text-xs opacity-60" data-localize="cpiNoBaseline"></span>`;
  }
  const result = calculateCpiFromRecords(test, baselinePzmr, test.testSettings.testType as CrtTestType);
  if (result.kind === "Available") {
    return `<span class="font-mono font-medium">${result.valueMs.toFixed(2)}</span> <span data-localize="ms"></span>`;
  }
  if (result.kind === "NoValidSamples") {
    return `<span class="text-xs opacity-60" data-localize="cpiNoValidData"></span>`;
  }
  return `<span class="text-xs opacity-60" data-localize="cpiNoBaseline"></span>`;
}

function centralProcessingSummaryCardHtml(summary: CentralProcessingSummary): string {
  const {
    cpi13,
    cpi23,
    selectedPzmrTest,
    selectedCrt13Test,
    selectedCrt23Test,
    availablePzmrTests,
    availableCrt13Tests,
    availableCrt23Tests,
  } = summary;

  const renderSelect = (
    id: string,
    labelKey: string,
    tests: readonly TestRecord[],
    selectedTest: TestRecord | null,
    emptyKey: string
  ) => {
    if (tests.length === 0) {
      return `
        <div class="form-control w-full">
          <label class="label py-0.5"><span class="label-text text-xs font-semibold" data-localize="${labelKey}"></span></label>
          <div class="text-xs text-base-content/60 italic p-1.5 bg-base-200 rounded border border-base-300" data-localize="${emptyKey}"></div>
        </div>
      `;
    }
    return `
      <div class="form-control w-full">
        <label class="label py-0.5" for="${id}">
          <span class="label-text text-xs font-semibold" data-localize="${labelKey}"></span>
        </label>
        <select id="${id}" class="select select-bordered select-xs sm:select-sm w-full">
          ${tests
            .map((t, idx) => {
              const isSelected = selectedTest?.id === t.id;
              const dateStr = new Date(t.date).toLocaleString();
              const badge = idx === 0 ? ` · ${localize("cpiLatestAuto")}` : "";
              return `<option value="${t.id}" ${isSelected ? "selected" : ""}>${dateStr}${badge}</option>`;
            })
            .join("")}
        </select>
      </div>
    `;
  };

  const renderCpiValueCard = (
    titleKey: string,
    result: CentralProcessingResult,
  ) => {
    let contentHtml: string;

    if (result.kind === "Available") {
      const crtShortKey = result.crtType === "crt1-3" ? "testTypeRV13Short" : "testTypeRV23Short";
      contentHtml = `
        <div class="font-mono text-xl sm:text-2xl font-semibold text-base-content tracking-tight">
          ${result.valueMs.toFixed(2)} <span class="text-xs sm:text-sm font-normal font-sans" data-localize="ms"></span>
        </div>
        <div class="font-mono text-xs opacity-80 mt-1.5 flex flex-wrap items-center gap-1">
          <span>μ(<span data-localize="${crtShortKey}"></span>) ${result.crtMeanMs.toFixed(2)} <span data-localize="ms"></span></span>
          <span>−</span>
          <span>μ(<span data-localize="testTypePzmrShort"></span>) ${result.pzmrMeanMs.toFixed(2)} <span data-localize="ms"></span></span>
        </div>
      `;
    } else if (result.kind === "NoBaselinePzmr") {
      contentHtml = `
        <div class="badge badge-warning badge-outline gap-1 py-3 text-xs">
          <span data-localize="cpiNoBaseline"></span>
        </div>
      `;
    } else if (result.kind === "NoCrtTest") {
      const key = result.crtType === "crt1-3" ? "cpiNoCrt13" : "cpiNoCrt23";
      contentHtml = `
        <div class="badge badge-ghost gap-1 py-3 text-xs opacity-70">
          <span data-localize="${key}"></span>
        </div>
      `;
    } else {
      contentHtml = `
        <div class="badge badge-error badge-outline gap-1 py-3 text-xs">
          <span data-localize="cpiNoValidData"></span>
        </div>
      `;
    }

    return `
      <div class="card bg-base-200/60 p-4 border border-base-300 rounded-box flex flex-col justify-between h-full">
        <div>
          <div class="font-bold text-sm mb-2" data-localize="${titleKey}"></div>
          <div class="my-2">${contentHtml}</div>
        </div>
        <div class="text-[11px] opacity-60 mt-2 italic" data-localize="cpiFormulaHint"></div>
      </div>
    `;
  };

  return `
    <div id="cpi-summary-card" class="card shadow-md bg-base-100">
      <div class="card-body">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-base-200 pb-3">
          <div>
            <h2 class="card-title text-lg flex items-center gap-2">
              <span data-localize="centralProcessingSummaryTitle"></span>
              <span class="tooltip tooltip-right cursor-help text-xs opacity-70 hover:opacity-100" data-localize-tip="cpiBaselineHelp" data-tip="${localize('cpiBaselineHelp')}">(?)</span>
            </h2>
            <p class="text-xs opacity-70 mt-0.5" data-localize="centralProcessingSummaryDesc"></p>
          </div>
        </div>

        <!-- 3-Column Layout (Selectors on Left, Result Cards in Middle and Right) -->
        <div class="grid grid-cols-1 md:grid-cols-3 print:grid-cols-2 gap-4 mt-3">
          <!-- Col 1: Selectors Panel (Hidden in print) -->
          <div class="card bg-base-200/40 p-3 border border-base-300 rounded-box flex flex-col justify-between gap-2 print:hidden">
            <div class="flex flex-col gap-2">
              ${renderSelect("cpi-pzmr-select", "cpiPzmrBaseline", availablePzmrTests, selectedPzmrTest, "cpiNoBaseline")}
              ${renderSelect("cpi-crt13-select", "cpiTargetCrt13", availableCrt13Tests, selectedCrt13Test, "cpiNoCrt13")}
              ${renderSelect("cpi-crt23-select", "cpiTargetCrt23", availableCrt23Tests, selectedCrt23Test, "cpiNoCrt23")}
            </div>
          </div>

          <!-- Col 2: CPI 1-3 Card -->
          ${renderCpiValueCard("cpi13Label", cpi13)}

          <!-- Col 3: CPI 2-3 Card -->
          ${renderCpiValueCard("cpi23Label", cpi23)}
        </div>
      </div>
    </div>
  `;
}

function errorBreakdownRowsHtml(stats: ReactionTimeStats, multiHandStats: MultiHandReactionTimeStats | null): string {
  return OUTCOME_BREAKDOWN.map((outcome: OutcomeBreakdown) => {
    const leftCount = multiHandStats?.left.outcomeCountsByOutcome[outcome];
    const rightCount = multiHandStats?.right.outcomeCountsByOutcome[outcome];
    // Correct rejection records NONE/NONE, so assigning it to either hand would fabricate data.
    const handBreakdown = outcome === "CorrectRejection" ? "" : handBreakdownValueHtml(leftCount, rightCount);

    return `
      <tr class="text-center">
        <td><strong data-localize="${getTrialOutcomeLocalizationKey(outcome)}"></strong></td>
        <td>
          <div>${stats.outcomeCountsByOutcome[outcome]}</div>
          ${handBreakdown}
        </td>
      </tr>
    `;
  }).join("");
}

function handBreakdownValueHtml(
  leftValue: number | undefined,
  rightValue: number | undefined,
  formatValue: (value: number) => string = (value) => value.toString()
): string {
  if (leftValue === undefined || rightValue === undefined) return "";

  return `
    <div class="text-xs opacity-70">
      <span data-localize="statLeftHand"></span>: ${formatValue(leftValue)}
      /
      <span data-localize="statRightHand"></span>: ${formatValue(rightValue)}
    </div>
  `;
}

function handBreakdownStatsValueHtml(
  leftStats: ReactionTimeStats | undefined,
  rightStats: ReactionTimeStats | undefined,
  formatValue: (stats: ReactionTimeStats) => string
): string {
  if (!leftStats || !rightStats || (leftStats.count === 0 && rightStats.count === 0)) return "";

  return `
    <div class="text-xs opacity-70">
      <span data-localize="statLeftHand"></span>: ${leftStats.count > 0 ? formatValue(leftStats) : "N/A"}
      /
      <span data-localize="statRightHand"></span>: ${rightStats.count > 0 ? formatValue(rightStats) : "N/A"}
    </div>
  `;
}

const formatStatistic = (value: number | null): string => value === null ? 'N/A' : value.toFixed(2);

function getTrialOutcomeLocalizationKey(outcome: keyof ReactionTimeStats["outcomeCountsByOutcome"]): string {
  return `trialOutcome${outcome}`;
}

function userProfileFooterHTML(): string {
  return `
    <footer id="user-profile-footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
      <div class="flex-1"></div>
      <button id="print-btn" class="btn btn-outline btn-primary" data-localize="printButton"></button>
      <button id="main-page-btn" class="btn btn-outline btn-success ml-2" data-localize="backToMainPage"></button>
    </footer>
  `;
}

function getTestModeLocalizationKey(testMode: TestMode): string {
  switch (testMode) {
    case "shapes":
      return "shapesOption";
    case "words":
      return "wordsOption";
    case "colors":
      return "colorsOption";
    case "combined":
      return "combinedOption";
    default:
      throw new Error("Invalid test mode");
  }
}

function getTestTypeLocalizationKey(testType: string): string {
  switch (testType) {
    case "svmr":
      return "testTypePzmrLong";
    case "crt1-3":
      return "testTypeRV13Long";
    case "crt2-3":
      return "testTypeRV23Long";
    default:
      throw new Error("Invalid test type");
  }
}

function renderHistograms(tests: TestRecord[]): Chart[] {
  const charts: Chart[] = [];
  tests.forEach((test) => {
    // Match the stats table's cleaning bound (feedback late answers exceed the
    // fixed exposure legitimately).
    const upperBound = isFeedback(test.testSettings)
      ? feedbackTuning(test.testSettings).maxExposure + feedbackTuning(test.testSettings).pause
      : test.testSettings.exposureTime;
    const stats = new ReactionTimeStats(test.trials, upperBound, 100, test.testSettings.testType, undefined);
    const canvasId = `histogram-${test.id!}`;
    const chart = stats.drawHistogram(document.getElementById(canvasId)! as HTMLCanvasElement);
    charts.push(chart);
  });
  return charts;
}

function setupPrintHandlers(): Cleanup {
  const beforePrintHandler = () => {
    chartInstances.forEach(chart => {
      chart.resize(printConfig.chart.width, printConfig.chart.height);
    });
  };

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  const afterPrintHandler = () => {
    resizeTimeout = setTimeout(() => {
      chartInstances.forEach(chart => {
        chart.resize();
      });
    }, printConfig.resize.timeoutAfterPrint)
  };

  window.addEventListener('beforeprint', beforePrintHandler);
  window.addEventListener('afterprint', afterPrintHandler);

  return () => {
    window.removeEventListener('beforeprint', beforePrintHandler);
    window.removeEventListener('afterprint', afterPrintHandler);
    if (resizeTimeout !== undefined) clearTimeout(resizeTimeout);
  };
}
