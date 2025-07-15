// src/screens/user-profile-screen.ts
import {setupHeader} from '../components/header';
import {setupFooter} from '../components/footer';
import {updateLanguageUI} from '../localization/localization';
import {User, TestRecord} from "../db/db.ts";
import {ReactionTimeStats} from "../stats/ReactionTimeStats.ts";
import {TestMode} from "../config/domain.ts";
import Router from "../routing/router.ts";
import {getAllUsers, getTestsForUser} from "../db/operations.ts";

/**
 * Exports all users and their test data as a JSON file
 */
async function exportAllUsersData() {
  try {
    // Get all users
    const users = await getAllUsers();

    // Create an array to store all user data with their tests
    const exportData = [];

    // For each user, get their tests and add to the export data
    for (const user of users) {
      const tests = await getTestsForUser(user.firstName, user.lastName);
      exportData.push({
        user,
        tests
      });
    }

    // Convert the data to a JSON string
    const jsonData = JSON.stringify(exportData, null, 2);

    // Create a blob from the JSON string
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `users_data_${date}.json`;

    // Append the link to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Release the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting users data:', error);
    alert('Error exporting users data. Please try again.');
  }
}

export function setupProfileScreen(appContainer: HTMLElement, user: User, tests: TestRecord[]) {
  const sortedTests = tests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  appContainer.innerHTML = `
    <div id="user-profile-screen" class="flex flex-col flex-grow bg-base-200 text-base-content p-4">
      <div class="flex-1 space-y-4">
          ${personalDataCardHtml(user)}
          <!-- Test Cards -->
          ${sortedTests.map((test, index) => testCardHTML(index, test)).join("")}
      </div>
    </div>
  `;
  setupHeader(appContainer);

  setupFooter(appContainer, userProfileFooterHTML(), [
    {buttonFn: () => document.getElementById("export-data-btn")! as HTMLButtonElement, callback: exportAllUsersData},
    {buttonFn: () => document.getElementById("main-page-btn")! as HTMLButtonElement, callback: () => Router.navigate("/settings")},
  ]);
  renderHistograms(sortedTests);
  updateLanguageUI();
}

function personalDataCardHtml(user: User) {
  const {firstName, lastName, gender, age} = user;
  return `
  <div class="card shadow-md bg-base-100">
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
  const {testSettings, reactionTimes, date} = test;
  const {testMode, stimulusSize, exposureTime, exposureDelay, stimulusCount, testType} = testSettings;

  // Generate statistics using ReactionTimeStats
  const stats = new ReactionTimeStats(reactionTimes, exposureTime);

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
                <td>${stimulusSize}<span data-localize="mm"></span></td>
              </tr>
              <tr class="text-center">
                <td><strong data-localize="exposureTimeLabel"></strong></td>
                <td>${exposureTime}<span data-localize="ms"></span></td>
              </tr>
              <tr class="text-center">
                <td><strong data-localize="exposureDelayMinMaxLabel"></strong></td>
                <td>${Math.min(...exposureDelay)}<span data-localize="ms"></span> - ${Math.max(...exposureDelay)}<span data-localize="ms"></span></td>
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
                  <td>${stats.count}</td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="meanLabel"></strong></td>
                  <td>${stats.meanVal.toFixed(2)}<span data-localize="ms"></span></td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="modeLabel"></strong></td>
                  <td>${stats.modeVal ? stats.modeVal.toFixed(2) : "N/A"}<span data-localize="ms"></span></td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="stdevLabel"></strong></td>
                  <td>${stats.stdevVal.toFixed(2)}<span data-localize="ms"></span></td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="cvLabel"></strong></td>
                  <td>${stats.cvVal.toFixed(2)}</td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="p3Label"></strong></td>
                  <td>${stats.p3Val.toFixed(2)}<span data-localize="ms"></span></td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="p10Label"></strong></td>
                  <td>${stats.p10Val.toFixed(2)}<span data-localize="ms"></span></td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="p25Label"></strong></td>
                  <td>${stats.p25Val.toFixed(2)}<span data-localize="ms"></span></td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="medianLabel"></strong></td>
                  <td>${stats.p50Val.toFixed(2)}<span data-localize="ms"></span></td>
                </tr>
                <tr class="text-center">
                  <td><strong data-localize="p75Label"></strong></td>
                  <td>${stats.p75Val.toFixed(2)}<span data-localize="ms"></span></td>
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

function userProfileFooterHTML(): string {
  return `
    <footer id="user-profile-footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
      <div class="flex-1"></div>
      <button id="export-data-btn" class="btn btn-outline btn-primary mr-2" data-localize="exportData"></button>
      <button id="main-page-btn" class="btn btn-outline btn-success" data-localize="backToMainPage"></button>
    </footer>
  `;
}

function getTestModeLocalizationKey(testMode: TestMode): string {
  switch (testMode) {
    case "shapes":
      return "shapesOption";
    case "words":
      return "wordsOption";
    case "syllables":
      return "syllablesOption";
    default:
      throw new Error("Invalid test mode");
  }
}

function getTestTypeLocalizationKey(testType: string): string {
  switch (testType) {
    case "svmr":
      return "testTypePzmrLong";
    case "sr1-3":
      return "testTypeRV13Long";
    case "sr2-3":
      return "testTypeRV23Long";
    default:
      throw new Error("Invalid test type");
  }
}

function renderHistograms(tests: TestRecord[]) {
  tests.forEach((test, index) => {
    const stats = new ReactionTimeStats(test.reactionTimes, test.testSettings.exposureTime);
    const canvasId = `histogram-${index}`;

    stats.drawHistogram(document.getElementById(canvasId)! as HTMLCanvasElement);
  });
}
