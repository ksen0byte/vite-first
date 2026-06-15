// src/screens/user-profile-screen.ts
import {setupHeader} from '../components/header';
import {setupFooter} from '../components/footer';
import {updateLanguageUI} from '../localization/localization';
import {User, TestRecord} from "../db/db.ts";
import {MultiHandReactionTimeStats, OUTCOME_BREAKDOWN, OutcomeBreakdown, ReactionTimeStats} from "../stats/ReactionTimeStats.ts";
import {TestMode} from "../config/domain.ts";
import Router from "../routing/router.ts";
import {Chart} from "chart.js";
import {printConfig} from "../config/settings.ts";

let chartInstances: Chart[] = [];

export function setupProfileScreen(appContainer: HTMLElement, user: User, tests: TestRecord[]) {
  const sortedTests = tests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
          <!-- Test Cards -->
          ${sortedTests.map((test, index) => testCardHTML(index, test)).join("")}
      </div>
    </div>
  `;
  setupHeader(appContainer);

  setupFooter(appContainer, userProfileFooterHTML(), [
    {buttonFn: () => document.getElementById("main-page-btn")! as HTMLButtonElement, callback: () => Router.navigate("/")},
    {buttonFn: () => document.getElementById("print-btn")! as HTMLButtonElement, callback: () => handlePrint(user)},
  ]);
  chartInstances = renderHistograms(sortedTests);
  setupPrintHandlers();
  updateLanguageUI();
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
      <span><strong data-localize="surnameLabel"></strong>: ${lastName}</span>
      <span><strong data-localize="nameLabel"></strong>: ${firstName}</span>
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
        <p class="text-lg"><strong data-localize="surnameLabel"></strong>: <span>${lastName}</span></p>
        <p class="text-lg"><strong data-localize="nameLabel"></strong>: <span>${firstName}</span></p>
        <p class="text-lg"><strong data-localize="ageLabel"></strong>: <span>${age}</span></p>
        <p class="text-lg ${gender === "male" ? "" : "hidden"}"><strong data-localize="selectGender"></strong>: <span data-localize="male"></span></p>
        <p class="text-lg ${gender === "female" ? "" : "hidden"}"><strong data-localize="selectGender"></strong>: <span data-localize="female"></span></p>
      </div>
    </div>
  </div>
  `
}

function testCardHTML(index: number, test: TestRecord): string {
  const {testSettings, trials, date} = test;
  const {testMode, stimulusSize, exposureTime, exposureDelay, stimulusCount, testType} = testSettings;

  // Generate statistics using ReactionTimeStats
  const multiHandStats = new MultiHandReactionTimeStats(trials, exposureTime);
  const stats = multiHandStats.total;
  const statsRight = multiHandStats.right;
  const statsLeft = multiHandStats.left;
  const showHandBreakdown = testType === "crt2-3";

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
                <td><strong data-localize="stimulusSizeLabel"></strong></td>
                <td>${Math.round(stimulusSize)}<span data-localize="mm"></span></td>
              </tr>
              <tr class="text-center">
                <td><strong data-localize="exposureTimeLabel"></strong></td>
                <td>${Math.round(exposureTime)}<span data-localize="ms"></span></td>
              </tr>
              <tr class="text-center">
                <td><strong data-localize="exposureDelayMinMaxLabel"></strong></td>
                <td>${Math.round(Math.min(...exposureDelay))}<span data-localize="ms"></span> - ${Math.round(Math.max(...exposureDelay))}<span data-localize="ms"></span></td>
              </tr>
              <tr class="text-center">
                <td><strong data-localize="stimulusCountLabel"></strong></td>
                <td>${stimulusCount}</td>
              </tr>
              <tr class="text-center">
                <td><strong data-localize="testTypeLabel"></strong></td>
                <td><span data-localize="${getTestTypeLocalizationKey(testType)}"></span></td>
              </tr>
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
                    ${stats.count}
                    ${handBreakdownValueHtml(statsLeft.count, statsRight.count, showHandBreakdown)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="meanLabel"></strong></td>
                  <td>
                    ${stats.meanVal.toFixed(2)}<span data-localize="ms"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, showHandBreakdown, (handStats) => `${handStats.meanVal.toFixed(2)}<span data-localize="ms"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="modeLabel"></strong></td>
                  <td>
                    ${stats.modeVal ? stats.modeVal.toFixed(2) : "N/A"}<span data-localize="ms"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, showHandBreakdown, (handStats) => `${handStats.modeVal ? handStats.modeVal.toFixed(2) : "N/A"}<span data-localize="ms"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="stdevLabel"></strong></td>
                  <td>
                    ${stats.stdevVal.toFixed(2)}<span data-localize="ms"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, showHandBreakdown, (handStats) => `${handStats.stdevVal.toFixed(2)}<span data-localize="ms"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="cvLabel"></strong></td>
                  <td>
                    ${stats.cvVal.toFixed(2)}
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, showHandBreakdown, (handStats) => handStats.cvVal.toFixed(2))}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="entropyLabel"></strong></td>
                  <td>
                    ${stats.entropyVal.toFixed(3)} <span data-localize="bits"></span>
                    ${handBreakdownStatsValueHtml(statsLeft, statsRight, showHandBreakdown, (handStats) => `${handStats.entropyVal.toFixed(3)} <span data-localize="bits"></span>`)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="medianLabel"></strong></td>
                  <td>${stats.p50Val.toFixed(2)}<span data-localize="ms"></span></td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="p90Label"></strong></td>
                  <td>${stats.p90Val.toFixed(2)}<span data-localize="ms"></span></td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="p97Label"></strong></td>
                  <td>${stats.p97Val.toFixed(2)}<span data-localize="ms"></span></td>
                </tr>
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
                    ${handBreakdownValueHtml(statsLeft.errorCount, statsRight.errorCount, showHandBreakdown)}
                  </td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="statErrorsPercentage"></strong></td>
                  <td>
                    ${stats.errorPercentage.toFixed(2)}%
                    ${handBreakdownValueHtml(statsLeft.errorPercentage, statsRight.errorPercentage, showHandBreakdown, (value) => `${value.toFixed(2)}%`)}
                  </td>
                </tr>
                ${errorBreakdownRowsHtml(multiHandStats, showHandBreakdown)}
                <tr class="text-center">
                  <td><strong data-localize="statFunctionalLevel"></strong></td>
                  <td>${stats.calculateFunctionalLevel().toFixed(2)}</td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="statReactionStability"></strong></td>
                  <td>${stats.calculateReactionStability().toFixed(2)}</td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="statFunctionalCapabilities"></strong></td>
                  <td>${stats.calculateFunctionalCapabilities().toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Histogram -->
        <div class="flex flex-grow p-8 min-h-96">
          <canvas id="histogram-${index}"></canvas>
        </div>

      </div>
    </div>
  `;
}

function errorBreakdownRowsHtml(multiHandStats: MultiHandReactionTimeStats, showHandBreakdown: boolean): string {
  return OUTCOME_BREAKDOWN.map((outcome: OutcomeBreakdown) => {
    const leftCount = multiHandStats.left.outcomeCountsByOutcome[outcome];
    const rightCount = multiHandStats.right.outcomeCountsByOutcome[outcome];

    return `
      <tr class="text-center">
        <td><strong data-localize="${getTrialOutcomeLocalizationKey(outcome)}"></strong></td>
        <td>
          <div>${multiHandStats.total.outcomeCountsByOutcome[outcome]}</div>
          ${handBreakdownValueHtml(leftCount, rightCount, showHandBreakdown)}
        </td>
      </tr>
    `;
  }).join("");
}

function handBreakdownValueHtml(
  leftValue: number,
  rightValue: number,
  showHandBreakdown: boolean,
  formatValue: (value: number) => string = (value) => value.toString()
): string {
  if (!showHandBreakdown || (leftValue === 0 && rightValue === 0)) return "";

  return `
    <div class="text-xs opacity-70">
      <span data-localize="statLeftHand"></span>: ${formatValue(leftValue)}
      /
      <span data-localize="statRightHand"></span>: ${formatValue(rightValue)}
    </div>
  `;
}

function handBreakdownStatsValueHtml(
  leftStats: ReactionTimeStats,
  rightStats: ReactionTimeStats,
  showHandBreakdown: boolean,
  formatValue: (stats: ReactionTimeStats) => string
): string {
  if (!showHandBreakdown || (leftStats.count === 0 && rightStats.count === 0)) return "";

  return `
    <div class="text-xs opacity-70">
      <span data-localize="statLeftHand"></span>: ${leftStats.count > 0 ? formatValue(leftStats) : "N/A"}
      /
      <span data-localize="statRightHand"></span>: ${rightStats.count > 0 ? formatValue(rightStats) : "N/A"}
    </div>
  `;
}

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
  tests.forEach((test, index) => {
    const stats = new ReactionTimeStats(test.trials, test.testSettings.exposureTime);
    const canvasId = `histogram-${index}`;
    const chart = stats.drawHistogram(document.getElementById(canvasId)! as HTMLCanvasElement);
    charts.push(chart);
  });
  return charts;
}

function setupPrintHandlers() {
  const beforePrintHandler = () => {
    chartInstances.forEach(chart => {
      chart.resize(printConfig.chart.width, printConfig.chart.height);
    });
  };

  const afterPrintHandler = () => {
    chartInstances.forEach(chart => {
      chart.resize();
    });
  };

  window.addEventListener('beforeprint', beforePrintHandler);
  window.addEventListener('afterprint', afterPrintHandler);
}
