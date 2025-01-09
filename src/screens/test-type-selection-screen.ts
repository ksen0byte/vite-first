import {TestSettings} from "../config/settings-screen-config.ts";
import {setupFooter} from "../components/footer.ts";
import {updateLanguageUI} from "../localization/localization.ts";
import {setupHeader} from "../components/header.ts";

export function setupTestTypeSelectionScreen(appContainer: HTMLElement, parameters?: TestSettings) {
  appContainer.innerHTML = testTypeSelectionScreenHTML();
  setupHeader(appContainer);
  setupFooter(appContainer, "testType");
  updateLanguageUI();
}

function testTypeSelectionScreenHTML() {
  return `
  <div id="test-mode-selection-screen" class="flex flex-grow flex-col items-center justify-center bg-base-200 text-base-content">
    <h2 class="text-2xl font-bold mb-8" data-localize="selectTestType">Select Test Type</h2>
    <div class="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3 w-full px-8">
      <button id="pzmr-button" class="btn btn-primary btn-lg w-full" data-localize="testModePzmrShort">SVMR</button>
      <button id="rv1-3-button" class="btn btn-secondary btn-lg w-full" data-localize="testModeRV13Short">SR1-3</button>
      <button id="rv2-3-button" class="btn btn-accent btn-lg w-full" data-localize="testModeRV23Short">SR2-3</button>
    </div>
  </div>
  `;
}
