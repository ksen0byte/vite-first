import {AppContext, TestType} from "../config/domain.ts";
import {setupFooter} from "../components/footer.ts";
import {updateLanguageUI} from "../localization/localization.ts";
import {setupHeader} from "../components/header.ts";
import {setupBeginTestScreen} from "./begin-test-screen.ts";
import {setupSettingsScreen} from "./settings-screen.ts";
import AppContextManager from "../config/AppContextManager.ts";

export function setupTestTypeSelectionScreen(appContainer: HTMLElement) {
  const appContext = AppContextManager.getContext();
  // Insert main content
  appContainer.innerHTML = mainHtml(appContext.testSettings.testType);

  // Setup header and footer
  setupHeader(appContainer);
  setupFooter(
    appContainer,
    footerHtml(),
    [
      {
        buttonFn: () => document.getElementById("test-back-btn")! as HTMLButtonElement,
        callback: () => setupSettingsScreen(appContainer)
      }
    ]
  );

  // Update localized strings
  updateLanguageUI();

  // Setup event listeners for test type buttons and Next button
  setupTestTypeButtonsCallback(appContainer, appContext);
}

function setupTestTypeButtonsCallback(appContainer: HTMLElement, appContext: AppContext) {
  // Get references to the test type buttons and the Next button from the DOM
  const pzmrButton = document.getElementById("pzmr-button") as HTMLButtonElement;
  const rv13Button = document.getElementById("rv1-3-button") as HTMLButtonElement;
  const rv23Button = document.getElementById("rv2-3-button") as HTMLButtonElement;
  const nextButton = document.getElementById("test-next-btn") as HTMLButtonElement;

  // Helper function to clear the active state from all buttons
  function clearActive() {
    [pzmrButton, rv13Button, rv23Button].forEach(btn => btn.classList.remove("btn-active"));
  }

  // Attach event listeners to each test type button. On click, update the appContext,
  // visually mark the selected button, and enable the Next button.
  pzmrButton.addEventListener("click", () => {
    clearActive();
    pzmrButton.classList.add("btn-active");
    appContext.testSettings.testType = "svmr";
  });

  rv13Button.addEventListener("click", () => {
    clearActive();
    rv13Button.classList.add("btn-active");
    appContext.testSettings.testType = "sr1-3";
  });

  rv23Button.addEventListener("click", () => {
    clearActive();
    rv23Button.classList.add("btn-active");
    appContext.testSettings.testType = "sr2-3";
  });

  // Only proceed to the Begin Test screen if a test type has been selected.
  nextButton.addEventListener("click", () => {
    setupBeginTestScreen(appContainer, appContext);
  });
}

function mainHtml(testType: TestType) {
  return `
  <div id="test-type-selection-screen" class="flex flex-grow flex-col items-center justify-center bg-base-200 text-base-content">
    <h2 class="text-2xl font-bold mb-8" data-localize="selectTestType">Select Test Type</h2>
    <div class="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-3 w-full px-8">
      <button id="pzmr-button" class="btn btn-soft btn-primary btn-xl w-full ${testType === "svmr" ? "btn-active" : ""}" data-localize="testTypePzmrShort">
        SVMR
      </button>
      <button id="rv1-3-button" class="btn btn-soft btn-secondary btn-xl btn-disabled w-full ${testType === "sr1-3" ? "btn-active" : ""}" data-localize="testTypeRV13Short">
        SR1-3
      </button>
      <button id="rv2-3-button" class="btn btn-soft btn-accent btn-xl btn-disabled w-full ${testType === "sr2-3" ? "btn-active" : ""}" data-localize="testTypeRV23Short">
        SR2-3
      </button>
    </div>
  </div>
  `;
}

function footerHtml(): string {
  return `
    <footer id="test-type-selection-screen-footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
      <div class="flex-1"></div>
      <div class="flex space-x-2">
        <button id="test-back-btn" class="btn btn-outline btn-warning" data-localize="back"></button>
        <button id="test-next-btn" class="btn btn-success" data-localize="next"></button>
      </div>
    </footer>
  `;
}
