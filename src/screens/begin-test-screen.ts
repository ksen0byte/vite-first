import {AppContext} from "../config/domain.ts";
import {setupHeader} from "../components/header.ts";
import {setupFooter} from "../components/footer.ts";
import {localize, updateLanguageUI} from "../localization/localization.ts";
import {capitalize} from "../util/util.ts";
import AppContextManager from "../config/AppContextManager.ts";
import Router from "../routing/router.ts";

export function setupBeginTestScreen(appContainer: HTMLElement) {
  const appContext = AppContextManager.getContext();

  appContainer.innerHTML = beginTestScreenHTML(appContext);
  setupHeader(appContainer);
  setupFooter(
    appContainer,
    footerHtml(),
    [
      {buttonFn: () => document.getElementById("test-begin-back-btn")! as HTMLButtonElement, callback: () => Router.navigate("/testTypeSelection")}
    ]
  );
  setupStartTestButtonCallback();
  updateLanguageUI();
}

function setupStartTestButtonCallback() {
  const startTestButton = document.getElementById("start-test-button")! as HTMLButtonElement
  startTestButton.addEventListener("click", () => Router.navigate("/testTypeSelection"));
}

function beginTestScreenHTML(appContext: AppContext): string {
  // Convert potential null values to 'N/A' for display
  const firstName = appContext.personalData.firstName || 'N/A';
  const lastName = appContext.personalData.lastName || 'N/A';
  const gender = appContext.personalData.gender || 'N/A';
  const age = appContext.personalData.age || 'N/A';
  const testType = (appContext.testSettings.testType! === 'svmr') ? localize("testTypePzmrShort") : (appContext.testSettings.testType! === 'sr1-3') ? localize("testTypeRV13Short") : localize("testTypeRV23Short");
  const exposureDelay = `${appContext.testSettings.exposureDelay[0]}-${appContext.testSettings.exposureDelay[1]} ${localize("ms")}`;

  return `
    <div id="begin-test-screen" class="flex flex-col flex-grow bg-base-200 text-base-content">
      
      <!-- Test settings summary in a grid layout -->
      <div id="test-settings-summary" class="grid grid-cols-1 gap-4 p-4">
        <!-- Personal Details -->
        <div class="text-xs bg-base-100 shadow-md rounded-lg p-4">
          <table class="table table-zebra w-full text-left">
            <tbody>
              <tr><th class="pr-2" data-localize="appContextSummaryFirstName">First Name:</th><td>${firstName}</td></tr>
              <tr><th class="pr-2" data-localize="appContextSummaryLastName">Last Name:</th><td>${lastName}</td></tr>
              <tr><th class="pr-2" data-localize="appContextSummaryGender">Gender:</th><td>${capitalize(localize(gender))}</td></tr>
              <tr><th class="pr-2" data-localize="appContextSummaryAge">Age:</th><td>${age}</td></tr>
              <tr><th class="pr-2" data-localize="appContextSummaryTestMode">Test Mode:</th><td class="font-mono">${capitalize(localize(appContext.testSettings.testMode + "Option"))}</td></tr>
              <tr><th class="pr-2" data-localize="appContextSummaryStimulusSize">Stimulus Size:</th><td class="font-mono">${appContext.testSettings.stimulusSize} ${localize("mm")}</td></tr>
              <tr><th class="pr-2" data-localize="appContextSummaryExposureTime">Exposure Time:</th><td class="font-mono">${appContext.testSettings.exposureTime} ${localize("ms")}</td></tr>
              <tr><th class="pr-2" data-localize="appContextSummaryExposureDelay">Exposure Delay:</th><td class="font-mono">${exposureDelay}</td></tr>
              <tr><th class="pr-2" data-localize="appContextSummaryStimulusCount">Stimulus Count:</th><td class="font-mono">${appContext.testSettings.stimulusCount}</td></tr>
              <tr><th class="pr-2" data-localize="appContextSummaryTestType">Test Type:</th><td class="font-mono">${testType}</td></tr>
            </tbody>
          </table>
        </div>
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
        <button id="start-test-button" class="btn btn-success" data-localize="startTest">Start</button>
      </div>
    </footer>
  `;

}