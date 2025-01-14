import {TestSettings} from "../config/settings-screen-config.ts";
import {setupFooter} from "../components/footer.ts";
import {updateLanguageUI} from "../localization/localization.ts";
import {setupHeader} from "../components/header.ts";
import {setupTestScreen} from "./test-screen.ts";

export function setupTestTypeSelectionScreen(appContainer: HTMLElement, testSettings: TestSettings) {
  appContainer.innerHTML = testTypeSelectionScreenHTML();
  setupTestTypeButtonsCallback(
    appContainer,
    document.getElementById("pzmr-button")! as HTMLButtonElement,
    document.getElementById("rv1-3-button")! as HTMLButtonElement,
    document.getElementById("rv2-3-button")! as HTMLButtonElement,
    testSettings
  );
  setupHeader(appContainer);
  setupFooter(appContainer, "testType");
  updateLanguageUI();
}

function setupTestTypeButtonsCallback(appContainer: HTMLElement, pzmrButton: HTMLButtonElement, rv13Button: HTMLButtonElement, rv23Button: HTMLButtonElement, testSettings: TestSettings) {
  pzmrButton.addEventListener("click", () => {
    testSettings!.testType = "svmr";
    setupTestScreen(appContainer, testSettings);
  });
  rv13Button.addEventListener("click", () => {
    testSettings!.testType = "sr1-3";
    setupTestScreen(appContainer, testSettings);
  });
  rv23Button.addEventListener("click", () => {
    testSettings!.testType = "sr2-3";
    setupTestScreen(appContainer, testSettings);
  });
}

function testTypeSelectionScreenHTML() {
  return `
  <div id="test-type-selection-screen" class="flex flex-grow flex-col items-center justify-center bg-base-200 text-base-content">
    <h2 class="text-2xl font-bold mb-8" data-localize="selectTestType">Select Test Type</h2>
    <div class="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3 w-full px-8">
      <button id="pzmr-button" class="btn btn-primary btn-lg w-full" data-localize="testTypePzmrShort">SVMR</button>
      <button id="rv1-3-button" class="btn btn-secondary btn-lg w-full" data-localize="testTypeRV13Short">SR1-3</button>
      <button id="rv2-3-button" class="btn btn-accent btn-lg w-full" data-localize="testTypeRV23Short">SR2-3</button>
    </div>
  </div>
  `;
}
