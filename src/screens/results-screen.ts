// results-screen.ts

import {setupHeader} from "../components/header.ts";
import {setupFooter} from "../components/footer.ts";
import {localize, updateLanguageUI} from "../localization/localization.ts";
import {MultiHandReactionTimeStats, OUTCOME_BREAKDOWN, ReactionTimeStats} from "../stats/ReactionTimeStats.ts";
import {getTestsForUser, saveTestRecord, upsertUser} from "../db/operations.ts";
import {TestRecord} from "../db/db.ts";
import AppContextManager from "../config/AppContextManager.ts";
import Router from "../routing/router.ts";
import {TrialResult, isFeedback, feedbackTuning} from "../config/domain.ts";
import {summarizeExposure} from "../stats/exposure-curve.ts";
import {getHandLocalizationKey} from "../config/settings.ts";
import {calculateCpiFromStats, getTestStats, CrtTestType} from "../stats/central-processing.ts";

export function setupResultsScreen(
  appContainer: HTMLElement,
  reactionTimes: Map<number, TrialResult>
) {
  const trialResults = Array.from(reactionTimes.values());

  if (!trialResults.length) {
    appContainer.innerHTML = `
      <div id="results-screen" class="flex flex-col flex-grow bg-base-200 text-base-content p-4">
        <h2 class="text-2xl font-bold mb-4" data-localize="noReactionTimes">No Reaction Times</h2>
      </div>
    `;
    setupHeader(appContainer);
    setupFooter(appContainer, footerHtml(), []);
    updateLanguageUI();
    return;
  }

  // Frequency distribution
  const testSettings = AppContextManager.getContext().testSettings;
  const isFeedbackSession = isFeedback(testSettings);
  const testType = testSettings.testType;
  // Late answers legitimately exceed the fixed exposure, so feedback sessions
  // bound the RT cleaning by maxExposure + pause instead of exposureTime.
  const rtUpperBound = isFeedbackSession
    ? feedbackTuning(testSettings).maxExposure + feedbackTuning(testSettings).pause
    : testSettings.exposureTime;
  const multiHandStats = new MultiHandReactionTimeStats(trialResults, rtUpperBound, 100, "Current test results", testType);
  const reactionTimeStats = multiHandStats.total;
  const showHandBreakdown = testType === "crt2-3";
  const errorBreakdownStats = errorBreakdownStatsHtml(multiHandStats, showHandBreakdown);
  const exposureSummary = isFeedbackSession ? feedbackExposureStatsHtml(trialResults) : "";

  const functionalLevelVal = reactionTimeStats.calculateFunctionalLevel();
  const reactionStability = reactionTimeStats.calculateReactionStability();
  const functionalCapabilities = reactionTimeStats.calculateFunctionalCapabilities();

  // Render
  appContainer.innerHTML = `
    <div id="results-screen" class="flex flex-col flex-1 min-h-0 lg:h-[calc(100vh-8rem)] lg:max-h-[calc(100vh-8rem)] p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto lg:overflow-hidden">
      <!-- Title & Info -->
      <div class="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h2 class="text-xl sm:text-2xl font-bold" data-localize="testResultsTitle">Test Results</h2>
        ${testType !== "crt2-3" ? `
        <div id="results-hand-badge" class="badge badge-md sm:badge-lg badge-outline gap-2">
          <strong data-localize="handLabel"></strong>:
          <span data-localize="${getHandLocalizationKey(testSettings.hand)}"></span>
        </div>` : ""}
      </div>

      <!-- Primary Statistics Grid (Count, Mean, Mode, Std Dev, CV, Entropy, Motor, CPI/Sensory) -->
      <div id="primary-stats-grid" class="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">

        <!-- Count -->
        <div class="stat bg-base-100 rounded-box shadow p-2 sm:p-3 place-items-center text-center">
          <div class="stat-title text-xs font-medium" data-localize="statCount">Count</div>
          <div class="stat-value text-base sm:text-lg font-bold">${reactionTimeStats.count}${filteredCountHtml(reactionTimeStats.filteredCount)}</div>
          ${handBreakdownDescHtml(multiHandStats.left.count, multiHandStats.right.count, showHandBreakdown)}
        </div>

        <!-- Mean -->
        <div class="stat bg-base-100 rounded-box shadow p-2 sm:p-3 place-items-center text-center">
          <div class="stat-title text-xs font-medium" data-localize="statMean">Mean</div>
          <div class="stat-value text-base sm:text-lg font-bold">${(reactionTimeStats.meanVal === null ? "N/A" : `${reactionTimeStats.meanVal.toFixed(2)} ${localize("ms")}`)}</div>
          ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) => `${stats.meanVal.toFixed(2)} ${localize("ms")}`)}
        </div>

        <!-- Mode -->
        <div class="stat bg-base-100 rounded-box shadow p-2 sm:p-3 place-items-center text-center">
          <div class="stat-title text-xs font-medium" data-localize="statMode">Median</div>
          <div class="stat-value text-base sm:text-lg font-bold">${(reactionTimeStats.modeVal === null ? "N/A" : `${reactionTimeStats.modeVal.toFixed(2)} ${localize("ms")}`)}</div>
          ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) => stats.modeVal === null ? "N/A" : `${stats.modeVal.toFixed(2)} ${localize("ms")}`)}
        </div>

        <!-- Std Dev -->
        <div class="stat bg-base-100 rounded-box shadow p-2 sm:p-3 place-items-center text-center">
          <div class="stat-title text-xs font-medium" data-localize="statStdDev">Std Dev</div>
          <div class="stat-value text-base sm:text-lg font-bold">${reactionTimeStats.stdevVal.toFixed(2)} <span data-localize="ms"></span></div>
          ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) => `${stats.stdevVal.toFixed(2)} ${localize("ms")}`)}
        </div>
        
        <!-- Coefficient of Variation -->
        <div class="stat bg-base-100 rounded-box shadow p-2 sm:p-3 place-items-center text-center">
          <div class="stat-title text-xs font-medium" data-localize="statCV">CV</div>
          <div class="stat-value text-base sm:text-lg font-bold">${reactionTimeStats.cvVal.toFixed(2)}%</div>
          ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) => `${stats.cvVal.toFixed(2)}%`)}
        </div>

        <!-- Discretized Shannon Entropy -->
        <div class="stat bg-base-100 rounded-box shadow p-2 sm:p-3 place-items-center text-center">
          <div class="stat-title text-xs font-medium" data-localize="statEntropy">Shannon Entropy</div>
          <div class="stat-value text-base sm:text-lg font-bold">${reactionTimeStats.entropyVal.toFixed(3)} <span data-localize="bits"></span></div>
          ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) => `${stats.entropyVal.toFixed(3)} ${localize("bits")}`)}
        </div>

        <!-- Motor Component -->
        <div class="stat bg-base-100 rounded-box shadow p-2 sm:p-3 place-items-center text-center">
          <div class="stat-title text-xs font-medium flex items-center justify-center gap-1">
            <span data-localize="motorComponentLabel">Motor Component</span>
            <span class="tooltip tooltip-bottom cursor-help text-xs opacity-70 hover:opacity-100" data-localize-tip="motorComponentHelp" data-tip="${localize('motorComponentHelp')}">(?)</span>
          </div>
          <div class="stat-value text-base sm:text-lg font-bold">
            ${formatMotorComponentHtml(reactionTimeStats)}
          </div>
          ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) =>
            formatMotorComponentText(stats)
          )}
        </div>

        <!-- Sensory Component (SVMR only) / CPI (CRT tests) -->
        ${testType === "svmr" ? `
        <div class="stat bg-base-100 rounded-box shadow p-2 sm:p-3 place-items-center text-center">
          <div class="stat-title text-xs font-medium flex items-center justify-center gap-1">
            <span data-localize="sensoryComponentLabel">Sensory Component</span>
            <span class="tooltip tooltip-bottom cursor-help text-xs opacity-70 hover:opacity-100" data-localize-tip="sensoryComponentHelp" data-tip="${localize('sensoryComponentHelp')}">(?)</span>
          </div>
          <div class="stat-value text-base sm:text-lg font-bold">
            ${formatSensoryComponentHtml(reactionTimeStats)}
          </div>
        </div>
        ` : `
        <div id="cpi-result-stat" class="stat bg-base-100 rounded-box shadow p-2 sm:p-3 place-items-center text-center">
          <div class="stat-title text-xs font-medium flex items-center justify-center gap-1">
            <span data-localize="${testType === 'crt1-3' ? 'statCpi13' : 'statCpi23'}"></span>
            <span class="tooltip tooltip-bottom cursor-help text-xs opacity-70 hover:opacity-100" data-localize-tip="cpiBaselineHelp" data-tip="${localize('cpiBaselineHelp')}">(?)</span>
          </div>
          <div id="cpi-result-value" class="stat-value text-base sm:text-lg font-bold">
            <span class="loading loading-spinner loading-xs"></span>
          </div>
          <div id="cpi-result-desc" class="stat-desc w-full max-w-full whitespace-normal break-words text-[10px] leading-tight sm:text-xs"></div>
        </div>
        `}

      </div>

      <!-- Secondary Stats Row (Errors + Percentiles + Loskutova functional-state metrics) -->
      <div id="secondary-stats-grid" class="grid grid-cols-1 lg:grid-cols-12 gap-2 w-full">
        <!-- Errors block -->
        <div id="error-stats-group" class="grid grid-cols-3 sm:grid-cols-7 lg:col-span-7 bg-base-100 rounded-box border border-base-300 shadow divide-x divide-base-300 w-full overflow-hidden">
          <!-- Errors Total -->
          <div class="stat p-1 sm:p-2 place-items-center text-center">
            <div class="stat-title whitespace-normal text-xs leading-tight font-medium" data-localize="statErrorsTotal">Errors Total</div>
            <div class="stat-value text-base sm:text-lg font-bold">${reactionTimeStats.errorCount}</div>
            ${handBreakdownDescHtml(multiHandStats.left.errorCount, multiHandStats.right.errorCount, showHandBreakdown)}
          </div>

          <!-- Error Percentage -->
          <div class="stat p-1 sm:p-2 place-items-center text-center">
            <div class="stat-title whitespace-normal text-xs leading-tight font-medium" data-localize="statErrorsPercentage">Error Rate</div>
            <div class="stat-value text-base sm:text-lg font-bold">${reactionTimeStats.errorPercentage.toFixed(2)}%</div>
            ${handBreakdownDescHtml(multiHandStats.left.errorPercentage, multiHandStats.right.errorPercentage, showHandBreakdown, (value) => `${value.toFixed(2)}%`)}
          </div>

          ${errorBreakdownStats}
        </div>

        <!-- Reaction-time percentiles block -->
        <div id="percentile-stats-group" class="grid grid-cols-2 lg:col-span-2 bg-base-100 rounded-box border border-base-300 shadow divide-x divide-base-300 w-full overflow-hidden">
          <!-- p50 -->
          <div class="stat p-1 sm:p-2 place-items-center text-center">
            <div class="stat-title text-xs font-medium" data-localize="statP50">p50</div>
            <div class="stat-value text-base sm:text-lg font-bold">${reactionTimeStats.p50Val.toFixed(2)} <span data-localize="ms"></span></div>
            ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) => `${stats.p50Val.toFixed(2)} ${localize("ms")}`)}
          </div>

          <!-- p90 -->
          <div class="stat p-1 sm:p-2 place-items-center text-center">
            <div class="stat-title text-xs font-medium" data-localize="statP90">p90</div>
            <div class="stat-value text-base sm:text-lg font-bold">${reactionTimeStats.p90Val.toFixed(2)} <span data-localize="ms"></span></div>
            ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) => `${stats.p90Val.toFixed(2)} ${localize("ms")}`)}
          </div>
        </div>

        <!-- Loskutova functional-state metrics block -->
        <div id="functional-stats-group" class="grid grid-cols-3 lg:col-span-3 bg-base-100 rounded-box border border-base-300 shadow divide-x divide-base-300 w-full overflow-hidden">
          <!-- Functional Level -->
          <div class="stat p-1 sm:p-2 place-items-center text-center">
            <div class="stat-title text-xs font-medium" data-localize="statFunctionalLevel">Count</div>
            <div class="stat-value text-base sm:text-lg font-bold">${functionalLevelVal ? functionalLevelVal.toFixed(2) : "N/A"} <span data-localize="au"></span></div>
            ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) => formatNullableStatistic(stats.calculateFunctionalLevel()))}
          </div>
          
          <!-- Reaction Stability -->
          <div class="stat p-1 sm:p-2 place-items-center text-center">
            <div class="stat-title text-xs font-medium" data-localize="statReactionStability">Count</div>
            <div class="stat-value text-base sm:text-lg font-bold">${reactionStability ? reactionStability.toFixed(2) : "N/A"} <span data-localize="au"></span></div>
            ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) => formatNullableStatistic(stats.calculateReactionStability()))}
          </div>
          
          <!-- Functional Capabilities -->
          <div class="stat p-1 sm:p-2 place-items-center text-center">
            <div class="stat-title text-xs font-medium" data-localize="statFunctionalCapabilities">Count</div>
            <div class="stat-value text-base sm:text-lg font-bold">${functionalCapabilities ? functionalCapabilities.toFixed(2) : "N/A"} <span data-localize="au"></span></div>
            ${handBreakdownDescHtmlForStats(multiHandStats.left, multiHandStats.right, showHandBreakdown, (stats) => formatNullableStatistic(stats.calculateFunctionalCapabilities()))}
          </div>
        </div>
      </div>

      ${exposureSummary}

      <!-- Frequency Distribution Table -->
      <div id="results-chart-container" class="flex-1 relative min-h-[220px] w-full p-2 sm:p-3 bg-base-100 rounded-box shadow flex items-center justify-center overflow-hidden">
        <canvas id="frequencyChart" class="w-full h-full max-w-full max-h-full"></canvas>
      </div>
    </div>
  `;

  setupHeader(appContainer);
  setupFooter(appContainer, footerHtml(), [
    {buttonFn: () => document.getElementById("dont-save-and-quit-btn")! as HTMLButtonElement, callback: () => Router.navigate("/settings")},
    {
      buttonFn: () => document.getElementById("save-results-btn")! as HTMLButtonElement,
      callback: async () => await saveResultsAndSetupNextScreen(reactionTimes)
    }
  ]);
  reactionTimeStats.drawHistogram(document.getElementById('frequencyChart')! as HTMLCanvasElement);
  updateLanguageUI();

  if (testType !== "svmr") {
    // Rendering the rest of the results must not wait on IndexedDB; the CPI card
    // owns its loading and failure states while the baseline query completes.
    void loadAndDisplayCpi(appContainer, reactionTimeStats, testType as CrtTestType);
  }
}

async function loadAndDisplayCpi(
  appContainer: HTMLElement,
  crtStats: ReactionTimeStats,
  crtType: CrtTestType
): Promise<void> {
  const valueEl = appContainer.querySelector<HTMLElement>('#cpi-result-value');
  const descEl = appContainer.querySelector<HTMLElement>('#cpi-result-desc');
  if (!valueEl) throw new Error('Required element #cpi-result-value is missing from the results screen');
  if (!descEl) throw new Error('Required element #cpi-result-desc is missing from the results screen');

  try {
    const appContext = AppContextManager.getContext();
    const { firstName, lastName } = appContext.personalData;
    const getTestsResult = await getTestsForUser(firstName, lastName);
    if (getTestsResult._tag === 'Failure') {
      // A storage failure is operationally different from a user who has never
      // completed SVMR, so do not let it fall through to the "no baseline" UI.
      const dbError = getTestsResult.error;
      const detail = 'error' in dbError ? `: ${String(dbError.error)}` : '';
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(`Failed to read CPI baseline tests (${dbError._tag})${detail}`);
    }

    // get latest pzmr result
    const pzmrTests = getTestsResult.value
      .filter((t) => t.testSettings.testType === 'svmr')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const baselinePzmr: TestRecord | null = pzmrTests[0] ?? null;

    if (!baselinePzmr) {
      valueEl.innerHTML = `<span class="badge badge-warning badge-outline text-xs" data-localize="cpiNoBaseline">${localize('cpiNoBaseline')}</span>`;
      descEl.textContent = '';
      updateLanguageUI(valueEl);
      return;
    }

    const pzmrStats = getTestStats(baselinePzmr);
    const result = calculateCpiFromStats({
      crtStats,
      pzmrStats,
      crtType,
      pzmrDate: baselinePzmr.date,
      pzmrTestId: baselinePzmr.id,
    });

    if (result.kind === 'Available') {
      const crtShortKey = crtType === 'crt1-3' ? 'testTypeRV13Short' : 'testTypeRV23Short';
      valueEl.innerHTML = `<span class="font-mono font-semibold">${result.valueMs.toFixed(2)}</span> <span class="text-xs font-normal font-sans" data-localize="ms"></span>`;
      descEl.innerHTML = `<span class="font-mono whitespace-normal">μ(<span data-localize="${crtShortKey}"></span>) ${result.crtMeanMs.toFixed(2)} <span data-localize="ms"></span> − μ(<span data-localize="testTypePzmrShort"></span>) ${result.pzmrMeanMs.toFixed(2)} <span data-localize="ms"></span></span>`;
    } else if (result.kind === 'NoValidSamples') {
      valueEl.innerHTML = `<span class="badge badge-error badge-outline text-xs" data-localize="cpiNoValidData">${localize('cpiNoValidData')}</span>`;
      descEl.textContent = '';
    } else {
      valueEl.innerHTML = `<span class="badge badge-warning badge-outline text-xs" data-localize="cpiNoBaseline">${localize('cpiNoBaseline')}</span>`;
      descEl.textContent = '';
    }
    updateLanguageUI(valueEl);
    updateLanguageUI(descEl);
  } catch (err) {
    console.error('Failed to load CPI baseline for results screen', err);
    // Keep the failed-read state visible to the user instead of leaving the
    // loading spinner in place or presenting the failure as missing data.
    valueEl.innerHTML = '<span class="badge badge-error badge-outline text-xs" data-localize="cpiLoadError"></span>';
    descEl.textContent = '';
    updateLanguageUI(valueEl);
  }
}

function filteredCountHtml(filteredCount: number): string {
  return filteredCount > 0
    ? ` <span class="text-error" title="Filtered reactions">(${filteredCount})</span>`
    : "";
}

function formatNullableStatistic(value: number | null): string {
  return value === null ? 'N/A' : `${value.toFixed(2)} ${localize('au')}`;
}

function formatMotorComponentHtml(stats: ReactionTimeStats): string {
  if (stats.motorComponent.kind === "NotRecorded") {
    return `<span data-localize="notRecorded"></span>`;
  }
  if (stats.motorComponent.kind === "NoValidSamples") {
    return `<span data-localize="noValidMotorData"></span>`;
  }
  return `${stats.motorComponent.meanMs.toFixed(2)} <span data-localize="ms"></span>`;
}

function formatMotorComponentText(stats: ReactionTimeStats): string {
  if (stats.motorComponent.kind === "NotRecorded") {
    return localize("notRecorded");
  }
  if (stats.motorComponent.kind === "NoValidSamples") {
    return localize("noValidMotorData");
  }
  return `${stats.motorComponent.meanMs.toFixed(2)} ${localize("ms")}`;
}

function formatSensoryComponentHtml(stats: ReactionTimeStats): string {
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

/**
 * Feedback-only results block: minimum exposure reached, when it was reached
 * (trial number), and the exposure-dynamics curve (doc §2.1/§2.2 "дод.
 * результати"). Hidden entirely for optimal-protocol sessions.
 */
function feedbackExposureStatsHtml(trialResults: readonly TrialResult[]): string {
  const summary = summarizeExposure(trialResults);
  if (!summary) return "";

  return `
    <div class="stats stats-vertical lg:stats-horizontal shadow w-full mb-4">
      <div class="stat place-items-center">
        <div class="stat-title text-base" data-localize="statMinExposure"></div>
        <div class="stat-value text-lg">${summary.minExposureMs} ${localize("ms")}</div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title text-base" data-localize="statMinExposureTrial"></div>
        <div class="stat-value text-lg">#${summary.reachedAfterTrial}</div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title text-base" data-localize="statStimuliProcessed"></div>
        <div class="stat-value text-lg">${summary.processedCount}</div>
      </div>
    </div>`;
}

function errorBreakdownStatsHtml(multiHandStats: MultiHandReactionTimeStats, showHandBreakdown: boolean): string {
  return OUTCOME_BREAKDOWN.map((outcome) => {
    const leftCount = multiHandStats.left.outcomeCountsByOutcome[outcome];
    const rightCount = multiHandStats.right.outcomeCountsByOutcome[outcome];
    // Correct rejection records NONE/NONE, so assigning it to either hand would fabricate data.
    const handBreakdown = handBreakdownDescHtml(
      leftCount,
      rightCount,
      showHandBreakdown && outcome !== "CorrectRejection",
    );

    return `
      <div class="stat p-1 sm:p-2 place-items-center text-center">
        <div class="stat-title whitespace-normal text-xs leading-tight font-medium" data-localize="${getTrialOutcomeLocalizationKey(outcome)}"></div>
        <div class="stat-value text-base sm:text-lg font-bold">${multiHandStats.total.outcomeCountsByOutcome[outcome]}</div>
        ${handBreakdown}
      </div>
    `;
  }).join("");
}

function handBreakdownDescHtml(
  leftValue: number,
  rightValue: number,
  showHandBreakdown: boolean,
  formatValue: (value: number) => string = (value) => value.toString()
): string {
  if (!showHandBreakdown) return "";

  return `
    <div class="stat-desc flex flex-wrap justify-center gap-x-1">
      <span class="whitespace-nowrap"><span title="${localize('statLeftHand')}">L</span>: ${formatValue(leftValue)}</span>
      <span class="whitespace-nowrap">· <span title="${localize('statRightHand')}">R</span>: ${formatValue(rightValue)}</span>
    </div>
  `;
}

function handBreakdownDescHtmlForStats(
  leftStats: ReactionTimeStats,
  rightStats: ReactionTimeStats,
  showHandBreakdown: boolean,
  formatValue: (stats: ReactionTimeStats) => string
): string {
  if (!showHandBreakdown || (leftStats.count === 0 && rightStats.count === 0)) return "";

  return `
    <div class="stat-desc flex flex-wrap justify-center gap-x-1">
      <span class="whitespace-nowrap"><span title="${localize('statLeftHand')}">L</span>: ${leftStats.count > 0 ? formatValue(leftStats) : "N/A"}</span>
      <span class="whitespace-nowrap">· <span title="${localize('statRightHand')}">R</span>: ${rightStats.count > 0 ? formatValue(rightStats) : "N/A"}</span>
    </div>
  `;
}

function getTrialOutcomeLocalizationKey(outcome: keyof ReactionTimeStats["outcomeCountsByOutcome"]): string {
  return `trialOutcome${outcome}`;
}

async function saveResultsAndSetupNextScreen(
  reactionTimes: Map<number, TrialResult>
) {
  const appContext = AppContextManager.getContext();
  const trialResults = Array.from(reactionTimes.values());

  try {
    const upsertResult = await upsertUser({
      firstName: appContext.personalData.firstName,
      lastName: appContext.personalData.lastName,
      gender: appContext.personalData.gender,
      age: appContext.personalData.age
    });

    if (upsertResult._tag === 'Failure') {
      console.error("Error saving user", upsertResult.error);
      return;
    }

    const user = upsertResult.value;
    console.log(`User saved: ${JSON.stringify(user)}`);

    // Save the test linked to this user
    const saveResult = await saveTestRecord(user, appContext.testSettings, trialResults);
    if (saveResult._tag === 'Failure') {
      console.error("Error saving test record", saveResult.error);
      return;
    }

    const testId = saveResult.value;
    console.log(`Test saved with ID: ${testId}`);

    const getTestsResult = await getTestsForUser(user.firstName, user.lastName);
    if (getTestsResult._tag === 'Failure') {
      console.error("Error retrieving tests", getTestsResult.error);
      return;
    }

    const tests = getTestsResult.value;

    // Navigate to the user profile screen
    Router.navigate('/profile', {user, tests}); // Pass user and tests to profile route
  } catch (err) {
    console.error("Error in saveResultsAndSetupNextScreen", err);
  }
}


function footerHtml(): string {
  return `
    <footer id="results-screen-footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
      <div class="flex-1"></div>
      <div class="flex space-x-2">
        <button id="dont-save-and-quit-btn" class="btn btn-outline btn-error" data-localize="dontSaveAndQuit"></button>
        <button id="save-results-btn" class="btn btn-success" data-localize="saveResults"></button>
      </div>
    </footer>
  `;
}
