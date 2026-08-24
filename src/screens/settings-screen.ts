import {AppContext, TestMode, ProtocolMode, TestType} from "../config/domain.ts";
import {defaultAppContext, parameters, ParameterDefinition} from "../config/settings.ts";
import {localize, updateLanguageUI} from "../localization/localization.ts";
import {setupFooter} from "../components/footer.ts";
import {setupHeader} from "../components/header.ts";
import {getShapeSvgWithStroke} from "../components/Shapes.ts";
import AppContextManager from "../config/AppContextManager.ts";
import Router from "../routing/router.ts";
import {getColorRectangleHtml} from "../components/ColorRectangles.ts";
import {getWordCategoryHtml} from "../components/Words.ts";
import {escapeHtml} from "../util/html.ts";

const PREVIEW_STIMULUS_SIZE = 28;
const PREVIEW_COMBINED_COMPONENT_SIZE = 14;
const PREVIEW_WORD_SIZE = 8;

/**
 * Renders one numeric parameter as a responsive text input, driven entirely by
 * its ParameterDefinition: the id, the always-visible localized label, the
 * localized unit suffix rendered after the field (so the native spin controls
 * never sit between the value and the unit), the min/max/step constraints and
 * the daisyUI validator hint all come from the shared config in settings.ts.
 * The hint reserves no space while valid; fields in a cross-field min/max pair
 * carry a specific error message that replaces the generic range text.
 */
const parameterField = (definition: ParameterDefinition, value: number, errorKey: string | null = null): string => `
  <div class="block w-full min-w-0">
    <span class="mb-1 block text-sm font-medium" data-localize="${definition.labelKey}"></span>
    <div class="flex items-center gap-2">
      <input id="${definition.id}" class="input input-md input-bordered validator w-full text-base" type="number" value="${value}" min="${definition.min}" max="${definition.max}" step="${definition.step}" placeholder=" " required aria-describedby="${definition.id}-hint" />
      <div class="shrink-0 text-sm font-bold" data-localize="${definition.unitKey}"></div>
    </div>
    <div class="validator-hint hidden text-left" id="${definition.id}-hint">
      <span class="hint-range"><span data-localize="allowedRangeHint"></span> ${definition.min}–${definition.max} <span data-localize="${definition.unitKey}"></span></span>
      ${errorKey ? `<span class="hint-error hidden" data-localize="${errorKey}"></span>` : ""}
    </div>
  </div>`;

const renderDelayRangeFields = (minValue: number, maxValue: number): string => `
  <div class="col-span-full grid min-w-0 grid-cols-2 gap-3">
    ${parameterField(parameters.exposureDelayMin, minValue, "delayMinExceedsMaxError")}
    ${parameterField(parameters.exposureDelayMax, maxValue)}
  </div>`;

const renderPregeneratedOptions = (settings: AppContext["testSettings"]): string => `
  <div class="col-span-full grid min-w-0 grid-cols-1 gap-3 border-t border-base-300 pt-3 sm:grid-cols-2">
    <label class="flex min-w-0 cursor-pointer items-start gap-2">
      <input id="compact-use-pregenerated-delay" type="checkbox" class="checkbox checkbox-md mt-0.5 shrink-0" ${settings.usePregenerated.exposureDelay ? "checked" : ""} />
      <span class="min-w-0 text-sm leading-6" data-localize="usePregeneratedDelay"></span>
    </label>
    <label class="flex min-w-0 cursor-pointer items-start gap-2">
      <input id="compact-use-pregenerated-stimuli" type="checkbox" class="checkbox checkbox-md mt-0.5 shrink-0" ${settings.usePregenerated.stimuli ? "checked" : ""} />
      <span class="min-w-0 text-sm leading-6" data-localize="usePregeneratedStimuli"></span>
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
        <label class="block w-full min-w-0"><span class="mb-1 block text-sm font-medium" data-localize="surnameLabel"></span><input class="input input-md input-bordered w-full text-base" type="text" id="surname-input" inputmode="text" placeholder=" " value="${escapeHtml(appContext.personalData.lastName)}" required minlength="2" maxlength="50" /></label>
        <label class="block w-full min-w-0"><span class="mb-1 block text-sm font-medium" data-localize="nameLabel"></span><input class="input input-md input-bordered w-full text-base" type="text" id="name-input" inputmode="text" placeholder=" " value="${escapeHtml(appContext.personalData.firstName)}" required minlength="2" maxlength="50" /></label>
        <label class="block w-full min-w-0"><span class="mb-1 block text-sm font-medium" data-localize="ageLabel"></span><input class="input input-md input-bordered w-full text-base" type="number" id="age-input" inputmode="numeric" placeholder=" " value="${appContext.personalData.age || ''}" min="10" max="99" step="1" required /></label>
        <label class="block w-full min-w-0"><span class="mb-1 block text-sm font-medium" data-localize="genderLabel"></span><select class="select select-md select-bordered w-full text-base" id="gender-select" required><option value="" disabled ${appContext.personalData.gender ? '' : 'selected'} data-localize="selectGender"></option><option value="male" ${appContext.personalData.gender === 'male' ? 'selected' : ''} data-localize="male"></option><option value="female" ${appContext.personalData.gender === 'female' ? 'selected' : ''} data-localize="female"></option></select></label>
      </div>
    </div></section>

    <section class="card bg-base-100 shadow-sm"><div class="card-body p-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label class="block w-full min-w-0"><span class="mb-1 block text-sm font-medium" data-localize="protocolLabel"></span><select id="protocol-select" class="select select-md select-bordered w-full text-base"><option value="optimal" ${mode === 'optimal' ? 'selected' : ''} data-localize="optimalProtocol"></option><option value="feedback" ${mode === 'feedback' ? 'selected' : ''} data-localize="feedbackProtocol"></option></select></label>
        <label class="block w-full min-w-0"><span class="mb-1 block text-sm font-medium" data-localize="regimeLabel"></span><select id="mode-select" class="select select-md select-bordered w-full text-base"></select></label>
        <label class="block w-full min-w-0"><span class="mb-1 block text-sm font-medium" data-localize="submodeLabel"></span><select id="test-type-select" class="select select-md select-bordered w-full text-base"></select></label>
        <label class="block w-full min-w-0"><span class="mb-1 block text-sm font-medium" data-localize="stimulusTypeLabel"></span><select id="stimulus-select" class="select select-md select-bordered w-full text-base"></select></label>
      </div>
    </div></section>

    <section class="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <div class="card min-w-0 bg-base-100 shadow-sm"><div class="card-body min-w-0 p-4"><h2 class="card-title text-lg" data-localize="testSettingsTitle"></h2><div id="compact-parameters" class="mt-2 grid min-w-0 grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4"></div></div></div>
      <div class="card min-w-0 bg-base-100 shadow-sm"><div class="card-body min-w-0 p-4"><h2 class="card-title text-lg" data-localize="instructionTitle"></h2><div id="compact-preview" class="mb-3 flex min-h-28 min-w-0 items-center justify-center rounded-box bg-black p-3"></div><p id="compact-instruction" class="text-center text-sm leading-relaxed"></p></div></div>
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
    renderCompactPreview(selectedStimulus, selectedTestType, selectedProtocol);
    validateParameterRanges();
    syncParameterHints();
  };
  const onParametersChanged = () => {
    validateParameterRanges();
    syncParameterHints();
    renderCompactPreview(selectedStimulus, selectedTestType, selectedProtocol);
  };
  protocol.addEventListener("change", () => {
    selectedProtocol = protocol.value as ProtocolMode;
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
  const parametersRoot = document.getElementById("compact-parameters")!;
  parametersRoot.addEventListener("input", onParametersChanged);
  // :user-invalid only matches once the field loses focus, so re-sync on blur.
  parametersRoot.addEventListener("focusout", () => syncParameterHints());
  refresh();
}

function renderCompactParameters(appContext: AppContext, protocol: ProtocolMode): void {
  const testSettings = appContext.testSettings;
  const feedback = testSettings.feedback;
  const rows = protocol === "feedback"
    ? [
      parameterField(parameters.stimulusSize, testSettings.stimulusSize),
      parameterField(parameters.stimulusCount, testSettings.stimulusCount),
      parameterField(parameters.feedbackInitialExposure, feedback.initialExposure),
      parameterField(parameters.feedbackAdjustmentStep, feedback.adjustmentStep),
      parameterField(parameters.feedbackMinExposure, feedback.minExposure, "exposureMinExceedsMaxError"),
      parameterField(parameters.feedbackMaxExposure, feedback.maxExposure),
      parameterField(parameters.feedbackPause, feedback.pause),
      parameterField(parameters.feedbackDuration, feedback.duration),
    ]
    : [
      parameterField(parameters.stimulusSize, testSettings.stimulusSize),
      parameterField(parameters.stimulusCount, testSettings.stimulusCount),
      parameterField(parameters.exposureTime, testSettings.exposureTime, "col-span-2"),
      renderDelayRangeFields(testSettings.exposureDelay[0], testSettings.exposureDelay[1]),
    ];
  document.getElementById("compact-parameters")!.innerHTML = rows.join("") + renderPregeneratedOptions(testSettings);
}

function renderCompactInstruction(testType: TestType, testMode: TestMode): void {
  const key = testType === "svmr" ? "instructionSvmr" : testType === "crt1-3" ? `instructionCRT13_${testMode}` : `instructionCRT23_${testMode}`;
  document.getElementById("compact-instruction")!.dataset.localizeHtml = key;
}

function renderCompactPreview(testMode: TestMode, testType: TestType, protocol: ProtocolMode): void {
  const preview = document.getElementById("compact-preview")!;
  const count = readNumberInput(parameters.stimulusCount);
  const exposure = protocol === "feedback"
    ? readNumberInput(parameters.feedbackInitialExposure)
    : readNumberInput(parameters.exposureTime);
  const stimulusSize = PREVIEW_STIMULUS_SIZE;
  const stimulusColumns = testType === "crt2-3"
    ? `${previewReactionColumn(testMode, "left", stimulusSize)}${previewReactionColumn(testMode, "ignore", stimulusSize)}${previewReactionColumn(testMode, "right", stimulusSize)}`
    : previewReactionColumn(testMode, testType === "crt1-3" ? "right" : "space", stimulusSize);
  const stimulus = `<div class="grid w-full ${testType === "crt2-3" ? "grid-cols-3" : "grid-cols-1"} items-end gap-2 px-2">${stimulusColumns}</div>`;
  const delayMin = protocol === "feedback" ? readNumberInput(parameters.feedbackPause) : readNumberInput(parameters.exposureDelayMin);
  const delayMax = protocol === "feedback" ? delayMin : readNumberInput(parameters.exposureDelayMax);
  const pauseLabel = `<span data-localize="previewPauseState"></span>&nbsp;[${delayMin}–${delayMax}&nbsp;<span data-localize="ms"></span>]`;
  const stateDiagram = `<div class="absolute bottom-2 left-3 right-3 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-300"><span class="rounded border border-gray-700 px-2 py-1">${pauseLabel}</span><span>→</span><span class="rounded border border-gray-500 px-2 py-1"><span data-localize="previewStimulusState"></span>&nbsp;[${exposure}&nbsp;<span data-localize="ms"></span>]</span><span>→</span><span class="rounded border border-gray-700 px-2 py-1">${pauseLabel}</span><span class="font-mono">× ${count}&nbsp;<span data-localize="units"></span></span></div>`;
  preview.innerHTML = `<div class="relative flex min-h-[30rem] w-full items-center justify-center overflow-hidden rounded-box bg-black py-10 text-white">${stimulus}${stateDiagram}</div>`;
  updateLanguageUI();
}

function previewReactionColumn(testMode: TestMode, action: "left" | "right" | "space" | "ignore", size: number): string {
  const instruction = action === "left" ? "statLeftHand" : action === "right" ? "statRightHand" : action === "space" ? "testScreenTestPZMRActionButtonName" : "previewIgnore";
  return `<div class="flex min-w-0 flex-col items-center justify-end gap-2 text-center"><div class="flex h-56 w-full items-center justify-center">${compactStimulusForAction(testMode, action, size)}</div><span class="text-sm font-semibold text-gray-200" data-localize="${instruction}"></span></div>`;
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

/**
 * Reads a numeric parameter strictly against its ParameterDefinition. Empty or
 * non-numeric input falls back to the definition default; valid numbers are
 * rounded and clamped to [min, max]. Unlike a `value || fallback` check this
 * preserves legitimate zero values (e.g. a 0 ms pause).
 */
function readNumberInput(definition: ParameterDefinition): number {
  const element = document.getElementById(definition.id);
  const raw = element instanceof HTMLInputElement ? Number(element.value) : Number.NaN;
  if (!Number.isFinite(raw)) {
    return definition.defaultValue;
  }
  return Math.min(definition.max, Math.max(definition.min, Math.round(raw)));
}

/**
 * Live cross-field validation for the min/max parameter pairs (delay range,
 * feedback exposure range). Uses the native constraint API (setCustomValidity)
 * plus an aria-invalid flag, so daisyUI's validator styling and hint show the
 * problem exactly like a built-in range error - no alerts, and the form cannot
 * be submitted while the pair is inconsistent.
 */
function validateParameterRanges(): void {
  const markRange = (minDefinition: ParameterDefinition, errorKey: string | null) => {
    const minInput = document.getElementById(minDefinition.id);
    if (!(minInput instanceof HTMLInputElement)) return;
    minInput.setCustomValidity(errorKey ? localize(errorKey) : "");
    const hint = document.getElementById(`${minDefinition.id}-hint`);
    const rangeText = hint?.querySelector(".hint-range");
    const errorText = hint?.querySelector(".hint-error");
    if (errorKey) {
      minInput.setAttribute("aria-invalid", "true");
      // reveal the hint explicitly: aria-invalid alone only flips visibility,
      // which a display:none element would still suppress.
      hint?.classList.remove("hidden");
      rangeText?.classList.add("hidden");
      errorText?.classList.remove("hidden");
    } else {
      minInput.removeAttribute("aria-invalid");
      hint?.classList.add("hidden");
      rangeText?.classList.remove("hidden");
      errorText?.classList.add("hidden");
    }
  };
  const delayMin = readNumberInput(parameters.exposureDelayMin);
  const delayMax = readNumberInput(parameters.exposureDelayMax);
  markRange(parameters.exposureDelayMin, delayMin > delayMax ? "delayMinExceedsMaxError" : null);
  const feedbackMin = readNumberInput(parameters.feedbackMinExposure);
  const feedbackMax = readNumberInput(parameters.feedbackMaxExposure);
  markRange(parameters.feedbackMinExposure, feedbackMin > feedbackMax ? "exposureMinExceedsMaxError" : null);
}

/**
 * Reveals a field's validator hint only while it is actually invalid - either
 * through the cross-field range error (aria-invalid) or through a native
 * constraint violation such as an out-of-range value (:user-invalid, set after
 * the user interacts with the field). Valid fields keep the hint collapsed so
 * the card stays compact.
 */
function syncParameterHints(): void {
  for (const definition of Object.values(parameters)) {
    const input = document.getElementById(definition.id);
    const hint = document.getElementById(`${definition.id}-hint`);
    if (!(input instanceof HTMLInputElement) || !hint) continue;
    const crossFieldInvalid = input.getAttribute("aria-invalid") === "true";
    let nativeInvalid: boolean;
    try {
      nativeInvalid = input.matches(":user-invalid");
    } catch {
      // Fallback for engines without :user-invalid support.
      nativeInvalid = !input.checkValidity() && input.value !== "";
    }
    hint.classList.toggle("hidden", !(crossFieldInvalid || nativeInvalid));
  }
}

function compactStartButtonCallback(): void {
  validateParameterRanges();
  const form = document.getElementById("personal-data-form") as HTMLFormElement;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  const current = AppContextManager.getContext();
  const protocolMode = (document.getElementById("protocol-select") as HTMLSelectElement).value as ProtocolMode;
  const feedbackSubmode = (document.getElementById("mode-select") as HTMLSelectElement).value as "mobility" | "strength";
  const testType = (document.getElementById("test-type-select") as HTMLSelectElement).value as TestType;
  const testMode = (document.getElementById("stimulus-select") as HTMLSelectElement).value as TestMode;
  const delayMin = readNumberInput(parameters.exposureDelayMin);
  const delayMax = readNumberInput(parameters.exposureDelayMax);
  const feedbackMinExposure = readNumberInput(parameters.feedbackMinExposure);
  const feedbackMaxExposure = readNumberInput(parameters.feedbackMaxExposure);

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
      stimulusSize: readNumberInput(parameters.stimulusSize),
      stimulusCount: readNumberInput(parameters.stimulusCount),
      exposureTime: readNumberInput(parameters.exposureTime),
      exposureDelay: [delayMin, delayMax],
      feedback: {
        initialExposure: readNumberInput(parameters.feedbackInitialExposure),
        adjustmentStep: readNumberInput(parameters.feedbackAdjustmentStep),
        minExposure: feedbackMinExposure,
        maxExposure: feedbackMaxExposure,
        pause: readNumberInput(parameters.feedbackPause),
        duration: readNumberInput(parameters.feedbackDuration),
      },
      usePregenerated: {
        exposureDelay: (document.getElementById("compact-use-pregenerated-delay") as HTMLInputElement).checked,
        stimuli: (document.getElementById("compact-use-pregenerated-stimuli") as HTMLInputElement).checked,
      },
    },
  });
  Router.navigate("/test");
}

const resetSettingsButtonCallback: () => void = () => {
  AppContextManager.setContext(defaultAppContext);
  Router.navigate("/settings");
}
