import {TestSettings} from "../config/settings-screen-config.ts";
import {setupHeader} from "../components/header.ts";
import {setupFooter} from "../components/footer.ts";
import {setupSettingsScreen} from "./settings-screen.ts";
import {localize, updateLanguageUI} from "../localization/localization.ts";
import {capitalize} from "../util/util.ts";

export function setupBeginTestScreen(appContainer: HTMLElement, testSettings: TestSettings) {
  console.log("Test Screen:", testSettings);

  appContainer.innerHTML = beginTestScreenHTML(testSettings);
  setupHeader(appContainer);
  setupFooter(
    appContainer,
    footerHtml(),
    [
      {buttonFn: () => document.getElementById("test-begin-back-btn")! as HTMLButtonElement, callback: () => setupSettingsScreen(appContainer, testSettings)}
    ]
  );
  updateLanguageUI();
}

function beginTestScreenHTML(testSettings: TestSettings): string {
  // Convert potential null values to 'N/A' for display
  const firstName = testSettings.firstName || 'N/A';
  const lastName = testSettings.lastName || 'N/A';
  const gender = testSettings.gender || 'N/A';
  const age = testSettings.age || 'N/A';
  const testType = (testSettings.testType! === 'svmr') ? localize("testTypePzmrShort") : (testSettings.testType! === 'sr1-3') ? localize("testTypeRV13Short") : localize("testTypeRV23Short");
  const exposureDelay = `${testSettings.exposureDelay[0]}-${testSettings.exposureDelay[1]} ${localize("ms")}`;

  return `
    <div id="begin-test-screen" class="flex flex-col flex-grow bg-base-200 text-base-content">
      
      <!-- Test settings summary in a grid layout -->
      <div id="test-settings-summary" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <!-- Personal Details -->
        <div class="text-xs bg-base-100 shadow-md rounded-lg p-4">
          <table class="table table-xs table-zebra w-full text-left">
            <tbody>
              <tr><th class="pr-2" data-localize="testSettingsSummaryFirstName">First Name:</th><td>${firstName}</td></tr>
              <tr><th class="pr-2" data-localize="testSettingsSummaryLastName">Last Name:</th><td>${lastName}</td></tr>
              <tr><th class="pr-2" data-localize="testSettingsSummaryGender">Gender:</th><td>${capitalize(localize(gender))}</td></tr>
              <tr><th class="pr-2" data-localize="testSettingsSummaryAge">Age:</th><td>${age}</td></tr>
            </tbody>
          </table>
        </div>
        <!-- Test Settings -->
        <div class="text-xs bg-base-100 shadow-md rounded-lg p-4">
          <table class="table table-xs table-zebra w-full text-left">
            <tbody>
              <tr><th class="pr-2" data-localize="testSettingsSummaryTestMode">Test Mode:</th><td class="font-mono">${capitalize(testSettings.testMode)}</td></tr>
              <tr><th class="pr-2" data-localize="testSettingsSummaryStimulusSize">Stimulus Size:</th><td class="font-mono" data-localize-add="mm">${testSettings.stimulusSize} </td></tr>
              <tr><th class="pr-2" data-localize="testSettingsSummaryExposureTime">Exposure Time:</th><td class="font-mono" data-localize-add="ms">${testSettings.exposureTime} </td></tr>
              <tr><th class="pr-2" data-localize="testSettingsSummaryExposureDelay">Exposure Delay:</th><td class="font-mono">${exposureDelay}</td></tr>
              <tr><th class="pr-2" data-localize="testSettingsSummaryStimulusCount">Stimulus Count:</th><td class="font-mono">${testSettings.stimulusCount}</td></tr>
              <tr><th class="pr-2" data-localize="testSettingsSummaryTestType">Test Type:</th><td class="font-mono">${testType}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Main content -->
      <div class="flex flex-col items-center justify-center flex-grow px-8">
        <!-- Start button -->
        <button id="start-test-button" class="btn btn-success btn-lg w-full max-w-md" data-localize="startTest">Start</button>
      </div>
    </div>
  `;
}

function footerHtml() {
  return `
    <footer id="begin-test-screen-footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
      <div class="flex-1"></div>
      <div class="flex space-x-2">
        <button id="test-begin-back-btn" class="btn btn-outline btn-warning" data-localize="back"></button>
      </div>
    </footer>
  `;

}