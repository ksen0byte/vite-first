import 'nouislider/dist/nouislider.css';
import {AppContext, TestMode, TestType} from "../config/domain.ts";
import {localize, updateLanguageUI} from "../localization/localization.ts";
import {setupFooter} from "../components/footer.ts";
import {setupHeader} from "../components/header.ts";
import {defaultAppContext} from "../config/settings.ts";
import {getShapeSvgWithStroke} from "../components/Shapes.ts";
import AppContextManager from "../config/AppContextManager.ts";
import Router from "../routing/router.ts";
import {getColorRectangleHtml} from "../components/ColorRectangles.ts";
import {getWordCategoryHtml} from "../components/Words.ts";
import {escapeHtml} from "../util/html.ts";

type ParameterFieldConfig = {
  id: string;
  localizationKey: string;
  min: number;
  max: number;
  step: number;
  unit: string;
};

const parameterLimits = {
  stimulusSize: {min: 10, max: 70, step: 10, unit: "mm"},
  stimulusCount: {min: 10, max: 480, step: 10, unit: "units"},
  exposure: {min: 100, max: 1500, step: 50, unit: "ms"},
  feedbackExposure: {min: 20, max: 900, step: 10, unit: "ms"},
  feedbackStep: {min: 1, max: 100, step: 1, unit: "ms"},
  feedbackPause: {min: 0, max: 2500, step: 10, unit: "ms"},
  feedbackDuration: {min: 30, max: 1800, step: 30, unit: "s"},
  delay: {min: 0, max: 2500, step: 50, unit: "ms"},
} as const;

const PREVIEW_STIMULUS_SIZE = 28;
const PREVIEW_COMBINED_COMPONENT_SIZE = 14;
const PREVIEW_WORD_SIZE = 8;

const parameterField = (config: ParameterFieldConfig, value: number): string => `
  <label class="floating-label relative w-full min-w-0">
    <span class="text-xs" data-localize="${config.localizationKey}"></span>
    <input id="${config.id}" class="input input-bordered input-sm w-full pr-14 text-right" type="number" value="${value}" min="${config.min}" max="${config.max}" step="${config.step}" placeholder=" " required />
    <div class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-base-content">${localize(config.unit)}</div>
  </label>`;

const renderDelayRangeFields = (minValue: number, maxValue: number): string => `
  <div class="col-span-full grid min-w-0 grid-cols-2 gap-3">
    ${parameterField({id: "compact-delay-min", localizationKey: "exposureDelayMinLabel", ...parameterLimits.delay}, minValue)}
    ${parameterField({id: "compact-delay-max", localizationKey: "exposureDelayMaxLabel", ...parameterLimits.delay}, maxValue)}
  </div>`;

const renderPregeneratedOptions = (settings: AppContext["testSettings"]): string => `
  <div class="col-span-full grid min-w-0 grid-cols-1 gap-3 border-t border-base-300 pt-3 sm:grid-cols-2">
    <label class="flex min-w-0 cursor-pointer items-start gap-2">
      <input id="compact-use-pregenerated-delay" type="checkbox" class="checkbox checkbox-sm mt-0.5 shrink-0" ${settings.usePregenerated.exposureDelay ? "checked" : ""} />
      <span class="min-w-0 text-xs leading-5" data-localize="usePregeneratedDelay"></span>
    </label>
    <label class="flex min-w-0 cursor-pointer items-start gap-2">
      <input id="compact-use-pregenerated-stimuli" type="checkbox" class="checkbox checkbox-sm mt-0.5 shrink-0" ${settings.usePregenerated.stimuli ? "checked" : ""} />
      <span class="min-w-0 text-xs leading-5" data-localize="usePregeneratedStimuli"></span>
    </label>
  </div>`;

function settingsScreenFooterHTML() {
  return `
    <footer id="footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
      <div class="flex-1"></div>
      <div class="flex space-x-2">
        <button id="reset-settings-btn" class="btn btn-outline btn-error" data-localize="resetSettings"></button>
        <button id="start-test-btn" class="btn btn-success" data-localize="startTest"></button>
      </div>
    </footer>
  `;
}


export function setupSettingsScreen(appContainer: HTMLElement): void {
  const appContext = AppContextManager.getContext();

  appContainer.innerHTML = compactSettingsScreenHTML(appContext);
  setupHeader(appContainer);
  setupCompactSettings(appContext);

  // footer
  setupFooter(
    appContainer,
    settingsScreenFooterHTML(),
    [
      {buttonFn: () => document.getElementById("start-test-btn")! as HTMLButtonElement, callback: () => compactStartButtonCallback()},
      {buttonFn: () => document.getElementById("reset-settings-btn")! as HTMLButtonElement, callback: () => resetSettingsButtonCallback()},
    ]
  );
  updateLanguageUI();
}

function compactSettingsScreenHTML(appContext: AppContext): string {
  const mode = appContext.testSettings.protocolMode;
  return `<main class="flex-grow bg-base-200" id="main"><form id="personal-data-form" class="mx-auto w-full max-w-[1800px] space-y-3 px-4 py-3">
    <section class="card bg-base-100 shadow-sm"><div class="card-body p-4">
      <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
        <label class="floating-label w-full"><span data-localize="surnameLabel"></span><input class="input input-bordered input-sm" type="text" id="surname-input" placeholder=" " value="${escapeHtml(appContext.personalData.lastName)}" required minlength="2" /></label>
        <label class="floating-label w-full"><span data-localize="nameLabel"></span><input class="input input-bordered input-sm" type="text" id="name-input" placeholder=" " value="${escapeHtml(appContext.personalData.firstName)}" required minlength="2" /></label>
        <label class="floating-label w-full"><span data-localize="ageLabel"></span><input class="input input-bordered input-sm" type="number" id="age-input" placeholder=" " value="${appContext.personalData.age || ''}" min="10" max="99" required /></label>
        <label class="floating-label w-full"><span data-localize="genderLabel"></span><select class="select select-bordered select-sm" id="gender-select" required><option value="male" ${appContext.personalData.gender === 'male' ? 'selected' : ''} data-localize="male"></option><option value="female" ${appContext.personalData.gender === 'female' ? 'selected' : ''} data-localize="female"></option></select></label>
      </div>
    </div></section>

    <section class="card bg-base-100 shadow-sm"><div class="card-body p-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label class="floating-label w-full"><span data-localize="protocolLabel"></span><select id="protocol-select" class="select select-bordered select-sm"><option value="optimal" ${mode === 'optimal' ? 'selected' : ''} data-localize="optimalProtocol"></option><option value="feedback" ${mode === 'feedback' ? 'selected' : ''} data-localize="feedbackProtocol"></option></select></label>
        <label class="floating-label w-full"><span data-localize="regimeLabel"></span><select id="mode-select" class="select select-bordered select-sm"></select></label>
        <label class="floating-label w-full"><span data-localize="submodeLabel"></span><select id="test-type-select" class="select select-bordered select-sm"></select></label>
        <label class="floating-label w-full"><span data-localize="stimulusTypeLabel"></span><select id="stimulus-select" class="select select-bordered select-sm"></select></label>
      </div>
    </div></section>

    <section class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div class="card min-w-0 bg-base-100 shadow-sm"><div class="card-body min-w-0 p-4"><h2 class="card-title text-base" data-localize="testSettingsTitle"></h2><div id="compact-parameters" class="grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4"></div></div></div>
      <div class="card min-w-0 bg-base-100 shadow-sm"><div class="card-body min-w-0 p-4"><h2 class="card-title text-base" data-localize="instructionTitle"></h2><div id="compact-preview" class="mb-3 flex min-h-28 min-w-0 items-center justify-center rounded-box bg-black p-3"></div><p id="compact-instruction" class="text-center text-sm leading-relaxed"></p></div></div>
    </section>
  </form></main>`;
}

function setupCompactSettings(appContext: AppContext): void {
  const protocol = document.getElementById("protocol-select") as HTMLSelectElement;
  const mode = document.getElementById("mode-select") as HTMLSelectElement;
  const testType = document.getElementById("test-type-select") as HTMLSelectElement;
  const stimulus = document.getElementById("stimulus-select") as HTMLSelectElement;
  let selectedProtocol = appContext.testSettings.protocolMode;
  let selectedMode = appContext.testSettings.protocolMode === "feedback" ? appContext.testSettings.feedbackSubmode : "standard";
  let selectedTestType = appContext.testSettings.testType;
  let selectedStimulus = appContext.testSettings.testMode;
  const modes = () => selectedProtocol === "feedback" ? [{value: "mobility", key: "feedbackMobility"}, {
    value: "strength",
    key: "feedbackStrength"
  }] : [{value: "standard", key: "optimalMode"}];
  const fill = (select: HTMLSelectElement, values: { value: string, key: string }[], selected: string) => {
    select.innerHTML = values.map(v => `<option value="${v.value}" ${v.value === selected ? "selected" : ""} data-localize="${v.key}"></option>`).join("");
  };
  const refresh = () => {
    fill(mode, modes(), selectedMode);
    fill(testType, [{value: "svmr", key: "testTypePzmrShort"}, {value: "crt1-3", key: "testTypeRV13Short"}, {
      value: "crt2-3",
      key: "testTypeRV23Short"
    }], selectedTestType);
    fill(stimulus, [{value: "shapes", key: "shapesOption"}, {value: "words", key: "wordsOption"}, {value: "colors", key: "colorsOption"}, {
      value: "combined",
      key: "combinedOption"
    }], selectedStimulus);
    renderCompactParameters(appContext, selectedProtocol);
    renderCompactInstruction(selectedTestType, selectedStimulus);
    updateLanguageUI();
    renderCompactPreview(selectedStimulus, selectedTestType);
  };
  protocol.addEventListener("change", () => {
    selectedProtocol = protocol.value as "optimal" | "feedback";
    selectedMode = selectedProtocol === "feedback" ? "mobility" : "standard";
    refresh();
  });
  mode.addEventListener("change", () => {
    selectedMode = mode.value;
    refresh();
  });
  testType.addEventListener("change", () => {
    selectedTestType = testType.value as TestType;
    refresh();
  });
  stimulus.addEventListener("change", () => {
    selectedStimulus = stimulus.value as TestMode;
    refresh();
  });
  document.getElementById("compact-parameters")!.addEventListener("input", () => renderCompactPreview(selectedStimulus, selectedTestType));
  refresh();
}

function renderCompactParameters(appContext: AppContext, protocol: "optimal" | "feedback"): void {
  const size = appContext.testSettings.stimulusSize;
  const f = appContext.testSettings.feedback;
  const commonFields = [
    parameterField({id: "compact-stimulus-size", localizationKey: "stimulusSizeLabel", ...parameterLimits.stimulusSize}, size),
    parameterField({
      id: "compact-stimulus-count",
      localizationKey: "stimulusCountLabel", ...parameterLimits.stimulusCount
    }, appContext.testSettings.stimulusCount),
  ];
  const rows = protocol === "feedback"
    ? [
      ...commonFields,
      parameterField({id: "compact-initial-exposure", localizationKey: "feedbackInitialExposure", ...parameterLimits.feedbackExposure}, f.initialExposure),
      parameterField({id: "compact-adjustment-step", localizationKey: "feedbackAdjustmentStep", ...parameterLimits.feedbackStep}, f.adjustmentStep),
      parameterField({id: "compact-exposure-min", localizationKey: "feedbackMinExposure", ...parameterLimits.feedbackExposure}, f.minExposure),
      parameterField({id: "compact-exposure-max", localizationKey: "feedbackMaxExposure", ...parameterLimits.feedbackExposure}, f.maxExposure),
      parameterField({id: "compact-pause", localizationKey: "feedbackPause", ...parameterLimits.feedbackPause}, f.pause),
      parameterField({id: "compact-duration", localizationKey: "feedbackDuration", ...parameterLimits.feedbackDuration}, f.duration),
    ]
    : [
      ...commonFields,
      parameterField({id: "compact-exposure-time", localizationKey: "exposureTimeLabel", ...parameterLimits.exposure}, appContext.testSettings.exposureTime),
      renderDelayRangeFields(appContext.testSettings.exposureDelay[0], appContext.testSettings.exposureDelay[1]),
    ];
  document.getElementById("compact-parameters")!.innerHTML = rows.join("") + renderPregeneratedOptions(appContext.testSettings);
}

function renderCompactInstruction(testType: TestType, testMode: TestMode): void {
  const key = testType === "svmr" ? "instructionSvmr" : testType === "crt1-3" ? `instructionCRT13_${testMode}` : `instructionCRT23_${testMode}`;
  document.getElementById("compact-instruction")!.dataset.localizeHtml = key;
}

function renderCompactPreview(testMode: TestMode, testType: TestType): void {
  const preview = document.getElementById("compact-preview")!;
  const count = readNumberInput("compact-stimulus-count", 50);
  const exposure = readNumberInput("compact-exposure-time", readNumberInput("compact-initial-exposure", 700));
  const stimulusSize = PREVIEW_STIMULUS_SIZE;
  const stimulusColumns = testType === "crt2-3"
    ? `${previewReactionColumn(testMode, "left", stimulusSize)}${previewReactionColumn(testMode, "ignore", stimulusSize)}${previewReactionColumn(testMode, "right", stimulusSize)}`
    : previewReactionColumn(testMode, testType === "crt1-3" ? "right" : "space", stimulusSize);
  const stimulus = `<div class="grid w-full ${testType === "crt2-3" ? "grid-cols-3" : "grid-cols-1"} items-end gap-2 px-2">${stimulusColumns}</div>`;
  const delayMin = readNumberInput("compact-delay-min", readNumberInput("compact-pause", 0));
  const delayMax = readNumberInput("compact-delay-max", delayMin);
  const pauseLabel = `${localize("previewPauseState")} [${delayMin}-${delayMax} ${localize("ms")}]`;
  const stateDiagram = `<div class="absolute bottom-2 left-3 right-3 flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-300"><span class="rounded border border-gray-700 px-2 py-1">${pauseLabel}</span><span>→</span><span class="rounded border border-gray-500 px-2 py-1">${localize("previewStimulusState")} [${exposure} ${localize("ms")}]</span><span>→</span><span class="rounded border border-gray-700 px-2 py-1">${pauseLabel}</span><span class="font-mono">× ${count} ${localize("units")}</span></div>`;
  preview.innerHTML = `<div class="relative flex min-h-[30rem] w-full items-center justify-center overflow-hidden rounded-box bg-black py-10 text-white">${stimulus}${stateDiagram}</div>`;
  updateLanguageUI();
}

function previewReactionColumn(testMode: TestMode, action: "left" | "right" | "space" | "ignore", size: number): string {
  const instruction = action === "left" ? "statLeftHand" : action === "right" ? "statRightHand" : action === "space" ? "testScreenTestPZMRActionButtonName" : "previewIgnore";
  return `<div class="flex min-w-0 flex-col items-center justify-end gap-2 text-center"><div class="flex h-56 w-full items-center justify-center">${compactStimulusForAction(testMode, action, size)}</div><span class="text-xs font-semibold text-gray-200" data-localize="${instruction}"></span></div>`;
}

function compactStimulusForAction(testMode: TestMode, action: "left" | "right" | "space" | "ignore", size: number): string {
  const color = action === "left" ? "green" : action === "right" || action === "space" ? "red" : "yellow";
  const shape = action === "left" ? "circle" : action === "right" || action === "space" ? "square" : "triangle";
  const category = action === "left" ? "plant" : action === "right" || action === "space" ? "animal" : "nonLiving";
  if (testMode === "shapes") return getShapeSvgWithStroke(size, "currentColor", shape);
  if (testMode === "colors") return getColorRectangleHtml(size, color);
  if (testMode === "words") return getWordCategoryHtml(category, PREVIEW_WORD_SIZE, "white");
  return `<div class="grid grid-cols-2 grid-rows-[auto_auto] items-center justify-items-center gap-1 overflow-hidden"><div>${getColorRectangleHtml(PREVIEW_COMBINED_COMPONENT_SIZE, color)}</div><div>${getShapeSvgWithStroke(PREVIEW_COMBINED_COMPONENT_SIZE, "currentColor", shape)}</div><div class="col-span-2 max-w-full overflow-hidden">${getWordCategoryHtml(category, PREVIEW_WORD_SIZE, "white")}</div></div>`;
}

function readNumberInput(id: string, fallback = 0): number {
  const element = document.getElementById(id);
  return element instanceof HTMLInputElement ? Number(element.value) : fallback;
}

function compactStartButtonCallback(): void {
  const form = document.getElementById("personal-data-form") as HTMLFormElement;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const current = AppContextManager.getContext();
  const protocolMode = (document.getElementById("protocol-select") as HTMLSelectElement).value as "optimal" | "feedback";
  const feedbackSubmode = (document.getElementById("mode-select") as HTMLSelectElement).value as "mobility" | "strength";
  const testType = (document.getElementById("test-type-select") as HTMLSelectElement).value as TestType;
  const testMode = (document.getElementById("stimulus-select") as HTMLSelectElement).value as TestMode;
  const number = (id: string) => readNumberInput(id);
  const feedback = {
    ...current.testSettings.feedback,
    initialExposure: number("compact-initial-exposure") || current.testSettings.feedback.initialExposure,
    adjustmentStep: number("compact-adjustment-step") || current.testSettings.feedback.adjustmentStep,
    minExposure: number("compact-exposure-min") || current.testSettings.feedback.minExposure,
    maxExposure: number("compact-exposure-max") || current.testSettings.feedback.maxExposure,
    pause: number("compact-pause") || current.testSettings.feedback.pause,
    duration: number("compact-duration") || current.testSettings.feedback.duration
  };
  const usePregenerated = {
    exposureDelay: (document.getElementById("compact-use-pregenerated-delay") as HTMLInputElement).checked,
    stimuli: (document.getElementById("compact-use-pregenerated-stimuli") as HTMLInputElement).checked
  };
  AppContextManager.setContext({
    ...current,
    personalData: {
      firstName: (document.getElementById("name-input") as HTMLInputElement).value,
      lastName: (document.getElementById("surname-input") as HTMLInputElement).value,
      gender: (document.getElementById("gender-select") as HTMLSelectElement).value as "male" | "female",
      age: Number((document.getElementById("age-input") as HTMLInputElement).value),
    },
    testSettings: {
      ...current.testSettings,
      protocolMode,
      feedbackSubmode,
      testType,
      testMode,
      stimulusSize: number("compact-stimulus-size"),
      stimulusCount: number("compact-stimulus-count"),
      exposureTime: number("compact-exposure-time") || current.testSettings.exposureTime,
      exposureDelay: [number("compact-delay-min") || current.testSettings.exposureDelay[0], number("compact-delay-max") || current.testSettings.exposureDelay[1]],
      feedback,
      usePregenerated
    },
  });
  Router.navigate("/test");
}

const resetSettingsButtonCallback: () => void = () => {
  AppContextManager.setContext(defaultAppContext);
  Router.navigate("/settings");
}
