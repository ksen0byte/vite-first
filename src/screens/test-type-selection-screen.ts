import {TestMode, TestType} from "../config/domain.ts";
import {setupFooter} from "../components/footer.ts";
import {updateLanguageUI} from "../localization/localization.ts";
import {setupHeader} from "../components/header.ts";
import AppContextManager from "../config/AppContextManager.ts";
import Router from "../routing/router.ts";
import {getShapeSvgWithStroke} from "../components/Shapes.ts";
import {getColorRectangleHtml} from "../components/ColorRectangles.ts";
import {getWordCategoryHtml, type WordCategory} from "../components/Words.ts";
import {toCssDimension} from "../presentation/sizing.ts";

// ==================== Types ====================

type PreviewAction = "space" | "right" | "left" | "ignore";
type PreviewItem = { pictureHtml: string; instructionKey: string | null };

// ==================== Constants ====================

/**
 * Scale factor for stimuli in combined mode (shapes + colors + words).
 * Reduces size to fit all three stimulus types in a compact grid layout.
 */
const COMBINED_MODE_SIZE_RATIO = 0.52;

/**
 * Maximum size cap for compact stimuli in combined mode (mm).
 */
const COMBINED_MODE_MAX_SIZE_MM = 18;

/**
 * Maximum preview size to ensure stimuli fit in instruction preview area (mm).
 */
const MAX_PREVIEW_SIZE_MM = 36;

/**
 * Scale factor for word stimuli relative to shape/color stimuli.
 */
const WORD_SIZE_RATIO = 0.5;

/**
 * Container height for preview items (mm).
 */
const PREVIEW_CONTAINER_HEIGHT_MM = 42;

/**
 * Combined mode preview container dimensions (mm).
 */
const COMBINED_PREVIEW_HEIGHT_MM = 38;
const COMBINED_PREVIEW_WIDTH_MM = 46;

// ==================== Public API ====================

export function setupTestTypeSelectionScreen(appContainer: HTMLElement) {
  const appContext = AppContextManager.getContext();
  const {testType, testMode, stimulusSize} = appContext.testSettings;

  appContainer.innerHTML = mainHtml(testType);
  setupHeader(appContainer);
  setupFooter(
    appContainer,
    footerHtml(),
    [
      {
        buttonFn: () => document.getElementById("test-back-btn")! as HTMLButtonElement,
        callback: () => Router.navigate("/settings"),
      }
    ]
  );

  updateLanguageUI();
  setupTestTypeButtonsCallback(testType, testMode, stimulusSize);
}

// ==================== Event Handlers ====================

function setupTestTypeButtonsCallback(testType: TestType, testMode: TestMode, stimulusSize: number) {
  const pzmrButton = document.getElementById("pzmr-button") as HTMLButtonElement;
  const rv13Button = document.getElementById("rv1-3-button") as HTMLButtonElement;
  const rv23Button = document.getElementById("rv2-3-button") as HTMLButtonElement;
  const nextButton = document.getElementById("test-next-btn") as HTMLButtonElement;
  const instructionText = document.getElementById("test-instruction-text") as HTMLElement;
  const instructionPreview = document.getElementById("test-instruction-preview") as HTMLElement;

  const clearActive = () => {
    [pzmrButton, rv13Button, rv23Button].forEach(btn => btn.classList.remove("btn-active"));
  };

  const updateInstruction = (testType: TestType) => {
    const instructionKey = testType === "svmr" ? "instructionSvmr" : testType === "crt1-3" ? `instructionCRT13_${testMode}` : `instructionCRT23_${testMode}`;
    instructionText.dataset.localizeHtml = instructionKey;
    instructionPreview.innerHTML = instructionPreviewHtml(testType, testMode, stimulusSize);
    updateLanguageUI();
  };

  const handleTestTypeSelection = (newTestType: TestType, button: HTMLButtonElement) => {
    clearActive();
    button.classList.add("btn-active");
    updateInstruction(newTestType);
    const current = AppContextManager.getContext();
    AppContextManager.setContext({
      ...current,
      testSettings: { ...current.testSettings, testType: newTestType }
    });
  };

  pzmrButton.addEventListener("click", () => handleTestTypeSelection("svmr", pzmrButton));
  rv13Button.addEventListener("click", () => handleTestTypeSelection("crt1-3", rv13Button));
  rv23Button.addEventListener("click", () => handleTestTypeSelection("crt2-3", rv23Button));
  nextButton.addEventListener("click", () => Router.navigate("/test"));

  updateInstruction(testType);
}

// ==================== Domain Helpers ====================

function wordCategoryForAction(action: PreviewAction): WordCategory {
  return action === "right" || action === "space" ? "animal" : action === "left" ? "plant" : "nonLiving";
}

// ==================== Preview Generation ====================

function getInstructionPreviewItems(
  testType: TestType,
  testMode: TestMode,
  stimulusSize: number,
): PreviewItem[] {
  if (testType === "svmr") {
    return [
      {pictureHtml: stimulusPreviewHtml(testMode, "space", stimulusSize), instructionKey: "instructionPreviewSpace"},
    ];
  }

  if (testType === "crt1-3") {
    return [
      {pictureHtml: stimulusPreviewHtml(testMode, "left", stimulusSize), instructionKey: null},
      {pictureHtml: stimulusPreviewHtml(testMode, "space", stimulusSize), instructionKey: "instructionPreviewSpace"},
      {pictureHtml: stimulusPreviewHtml(testMode, "ignore", stimulusSize), instructionKey: null},
    ];
  }

  return [
    {pictureHtml: stimulusPreviewHtml(testMode, "left", stimulusSize), instructionKey: "statLeftHand"},
    {pictureHtml: stimulusPreviewHtml(testMode, "ignore", stimulusSize), instructionKey: null},
    {pictureHtml: stimulusPreviewHtml(testMode, "right", stimulusSize), instructionKey: "statRightHand"},
  ];
}

function stimulusPreviewHtml(
  testMode: TestMode,
  action: PreviewAction,
  stimulusSize: number,
): string {
  if (testMode === "shapes") {
    return renderShapePreview(action, stimulusSize);
  }

  if (testMode === "colors") {
    return renderColorPreview(action, stimulusSize);
  }

  if (testMode === "words") {
    return renderWordPreview(action, stimulusSize);
  }

  return renderCombinedPreview(action, stimulusSize);
}

function renderShapePreview(action: PreviewAction, stimulusSize: number): string {
  const shape = action === "right" || action === "space" ? "square" : action === "left" ? "circle" : "triangle";
  return getShapeSvgWithStroke(stimulusSize, "currentColor", shape);
}

function renderColorPreview(action: PreviewAction, stimulusSize: number): string {
  const color = action === "right" || action === "space" ? "red" : action === "left" ? "green" : "yellow";
  return getColorRectangleHtml(stimulusSize, color);
}

function renderWordPreview(action: PreviewAction, stimulusSize: number): string {
  return getWordCategoryHtml(wordCategoryForAction(action), stimulusSize * WORD_SIZE_RATIO, "currentColor");
}

function renderCombinedPreview(action: PreviewAction, stimulusSize: number): string {
  const color = action === "right" || action === "space" ? "red" : action === "left" ? "green" : "yellow";
  const shape = action === "right" || action === "space" ? "square" : action === "left" ? "circle" : "triangle";
  const compactSize = Math.min(stimulusSize * COMBINED_MODE_SIZE_RATIO, COMBINED_MODE_MAX_SIZE_MM);
  const wordSize = compactSize * WORD_SIZE_RATIO;

  const containerHeight = toCssDimension(COMBINED_PREVIEW_HEIGHT_MM);
  const containerWidth = toCssDimension(COMBINED_PREVIEW_WIDTH_MM);

  return `
    <div class="grid grid-cols-2 grid-rows-[1fr_auto] items-center justify-items-center gap-1" style="height: ${containerHeight}; width: ${containerWidth}">
      <div class="flex items-center justify-center">
        ${getColorRectangleHtml(compactSize, color)}
      </div>
      <div class="flex items-center justify-center">
        ${getShapeSvgWithStroke(compactSize, "currentColor", shape)}
      </div>
      <div class="col-span-2 flex max-w-full items-center justify-center overflow-hidden">
        ${getWordCategoryHtml(wordCategoryForAction(action), wordSize, "currentColor")}
      </div>
    </div>
  `;
}

// ==================== HTML Templates ====================

function mainHtml(testType: TestType): string {
  return `
  <div id="test-type-selection-screen" class="flex flex-grow flex-col items-center justify-center bg-base-200 px-6 py-8 text-base-content">
    <div class="flex w-full max-w-7xl flex-col lg:flex-row lg:items-stretch">
      <div class="flex flex-1 flex-col justify-center">
        <h2 class="mb-8 text-center text-2xl font-bold" data-localize="selectTestType">Select Test Type</h2>
        <div class="grid grid-cols-1 gap-4">
          <button id="pzmr-button" class="btn btn-soft btn-primary btn-xl w-full ${testType === "svmr" ? "btn-active" : ""}" data-localize="testTypePzmrShort">
            SVMR
          </button>
          <button id="rv1-3-button" class="btn btn-soft btn-secondary btn-xl w-full ${testType === "crt1-3" ? "btn-active" : ""}" data-localize="testTypeRV13Short">
            CRT1-3
          </button>
          <button id="rv2-3-button" class="btn btn-soft btn-accent btn-xl w-full ${testType === "crt2-3" ? "btn-active" : ""}" data-localize="testTypeRV23Short">
            CRT2-3
          </button>
        </div>
      </div>
      <div class="divider lg:divider-horizontal"></div>
      <div class="flex flex-[1.4] flex-col justify-center">
        <p class="text-center" id="test-instruction-text"></p>
        <div id="test-instruction-preview" class="mt-8"></div>
      </div>
    </div>
  </div>
  `;
}

function instructionPreviewHtml(testType: TestType, testMode: TestMode, stimulusSize: number): string {
  const previewSize = Math.min(stimulusSize, MAX_PREVIEW_SIZE_MM);
  const items = getInstructionPreviewItems(testType, testMode, previewSize);
  const gridColumnsClass = items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-2" : "grid-cols-3";
  const containerHeight = toCssDimension(PREVIEW_CONTAINER_HEIGHT_MM);

  return `
    <div class="grid ${gridColumnsClass} gap-4 md:gap-6 items-end justify-items-center">
      ${items.map(item => `
        <div class="flex w-full min-w-0 items-center justify-center overflow-hidden" style="height: ${containerHeight}">
          ${item.pictureHtml}
        </div>
      `).join("")}
      ${items.map(item => `
        <div class="h-6 text-center text-lg font-semibold" ${item.instructionKey ? `data-localize="${item.instructionKey}"` : ""}>
        </div>
      `).join("")}
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
