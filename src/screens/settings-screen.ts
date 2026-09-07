import {
  AppContext,
  TestMode,
  TestType,
  TestSettings,
  OptimalSettings,
  FeedbackMobilitySettings,
  FeedbackStrengthSettings,
  isFeedback,
  isFeedbackMobility,
  feedbackTuning
} from "../config/domain.ts";
import {defaultAppContext, parameterPairs, parameters, ParameterDefinition} from "../config/settings.ts";
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

type CompactProtocolValue = "optimal" | "feedback";
type CompactFeedbackModeValue = "mobility" | "strength";
type CompactModeValue = "standard" | CompactFeedbackModeValue;

type CompactSettingsState = Readonly<{
  protocol: CompactProtocolValue;
  feedbackMode: CompactFeedbackModeValue;
  testType: TestType;
  stimulus: TestMode;
}>;

/**
 * Renders one numeric parameter as a responsive text input, driven entirely by
 * its ParameterDefinition: the id, the always-visible localized label, the
 * localized unit suffix rendered after the field (so the native spin controls
 * never sit between the value and the unit), the min/max/step constraints and
 * the daisyUI validator hint all come from the shared config in settings.ts.
 * The hint reserves no space while valid; fields in a cross-field min/max pair
 * carry a specific error message that replaces the generic range text.
 */
const parameterField = (definition: ParameterDefinition, value: number, errorKey: string | null = null, disabled = false): string => `
  <div class="block w-full min-w-0">
    <div class="mb-1.5 flex flex-col cursor-default" id="${definition.id}-meta">
      <span class="truncate text-sm font-medium leading-tight text-base-content" data-localize="${definition.labelKey}"></span>
      <div class="mt-0.5 flex items-center justify-between text-xs tabular-nums text-base-content/55">
        <span class="truncate pr-2">${definition.min}&ndash;${definition.max} <span data-localize="${definition.unitKey}"></span></span>
        <span class="shrink-0">±${definition.step}</span>
      </div>
    </div>
    <div class="relative flex items-center gap-2 rounded-box border border-base-300 bg-base-100 px-3 py-2">
      <input id="${definition.id}" class="min-w-0 flex-1 border-0 bg-transparent p-0 text-base outline-none ${disabled ? "text-transparent" : ""}" type="number" value="${value}" min="${definition.min}" max="${definition.max}" step="${definition.step}" placeholder=" " required aria-describedby="${definition.id}-hint" ${disabled ? "disabled" : ""} />
      <div class="shrink-0 text-sm font-semibold text-base-content/60 cursor-default ${disabled ? "invisible" : ""}" data-localize="${definition.unitKey}"></div>
      <span id="${definition.id}-preset" class="pointer-events-none absolute inset-0 hidden items-center px-3 text-sm italic text-base-content/45 truncate" data-localize="pregeneratedDelayActive"></span>
    </div>
    <div class="validator-hint hidden text-left" id="${definition.id}-hint">
      <span class="hint-range"><span data-localize="allowedRangeHint"></span> ${definition.min}–${definition.max} <span class="unit-suffix" data-localize="${definition.unitKey}"></span></span>
      ${errorKey ? `<span class="hint-error hidden" data-localize="${errorKey}"></span>` : ""}
    </div>
  </div>`;

const renderDelayRangeFields = (minValue: number, maxValue: number, disabled = false): string => `
  <div class="col-span-full grid min-w-0 grid-cols-2 gap-3">
    ${parameterField(parameters.exposureDelayMin, minValue, "delayMinExceedsMaxError", disabled)}
    ${parameterField(parameters.exposureDelayMax, maxValue, null, disabled)}
  </div>`;

const renderPregeneratedOptions = (settings: AppContext["testSettings"], showDelayOption: boolean): string => `
  <div class="col-span-full grid min-w-0 gap-3 border-t border-base-300 pt-3">
    ${showDelayOption ? `<label class="flex min-w-0 items-start gap-3 rounded-box px-2 py-2 cursor-pointer hover:bg-base-200">
      <input id="compact-use-pregenerated-delay" type="checkbox" class="checkbox settings-checkbox checkbox-md mt-0.5 shrink-0" ${(settings as OptimalSettings).usePregenerated.exposureDelay ? "checked" : ""} />
      <span class="min-w-0">
        <span class="block text-sm font-medium leading-6" data-localize="usePregeneratedDelay"></span>
        <span class="block text-xs leading-5 text-base-content/70" data-localize="usePregeneratedDelayHint"></span>
      </span>
    </label>` : ""}
    <label class="flex min-w-0 items-start gap-3 rounded-box px-2 py-2 cursor-pointer hover:bg-base-200">
      <input id="compact-use-pregenerated-stimuli" type="checkbox" class="checkbox settings-checkbox checkbox-md mt-0.5 shrink-0" ${settings.usePregenerated.stimuli ? "checked" : ""} />
      <span class="min-w-0">
        <span class="block text-sm font-medium leading-6" data-localize="usePregeneratedStimuli"></span>
        <span class="block text-xs leading-5 text-base-content/70" data-localize="usePregeneratedStimuliHint"></span>
      </span>
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
        <label class="block w-full min-w-0"><span class="mb-1 block text-sm font-medium" data-localize="protocolLabel"></span><select id="protocol-select" class="select select-md select-bordered w-full text-base"><option value="optimal" ${appContext.testSettings.protocolMode === 'optimal' ? 'selected' : ''} data-localize="optimalProtocol"></option><option value="feedback" ${appContext.testSettings.protocolMode !== 'optimal' ? 'selected' : ''} data-localize="feedbackProtocol"></option></select></label>
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
  const initialProtocol: CompactProtocolValue = appContext.testSettings.protocolMode === "optimal" ? "optimal" : "feedback";
  const initialFeedbackMode: CompactFeedbackModeValue =
    appContext.testSettings.protocolMode === "feedback-strength" ? "strength" : "mobility";
  let state: CompactSettingsState = {
    protocol: initialProtocol,
    feedbackMode: initialFeedbackMode,
    testType: appContext.testSettings.testType,
    stimulus: appContext.testSettings.testMode,
  };
  const getModeValue = (currentState: CompactSettingsState): CompactModeValue =>
    currentState.protocol === "optimal" ? "standard" : currentState.feedbackMode;
  const modeOptions = (currentState: CompactSettingsState): readonly { value: CompactModeValue; key: string }[] =>
    currentState.protocol === "optimal"
      ? [{value: "standard", key: "optimalMode"}]
      : [
        {value: "mobility", key: "feedbackMobility"},
        {value: "strength", key: "feedbackStrength"},
      ];
  const fill = <T extends string>(select: HTMLSelectElement, values: readonly { value: T; key: string }[], selected: T): void => {
    select.innerHTML = values
      .map(v => `<option value="${v.value}" ${v.value === selected ? "selected" : ""} data-localize="${v.key}"></option>`)
      .join("");
  };
  const refresh = (currentState: CompactSettingsState): void => {
    const currentMode = getModeValue(currentState);
    fill(mode, modeOptions(currentState), currentMode);
    fill(testType, [
      {value: "svmr", key: "testTypePzmrShort"},
      {value: "crt1-3", key: "testTypeRV13Short"},
      {value: "crt2-3", key: "testTypeRV23Short"},
    ], currentState.testType);
    fill(stimulus, [
      {value: "shapes", key: "shapesOption"},
      {value: "words", key: "wordsOption"},
      {value: "colors", key: "colorsOption"},
      {value: "combined", key: "combinedOption"},
    ], currentState.stimulus);
    renderCompactParameters(appContext, currentState.protocol, currentMode);
    renderCompactInstruction(currentState.testType, currentState.stimulus, currentState.protocol);
    updateLanguageUI();
    renderCompactPreview(currentState.stimulus, currentState.testType, currentState.protocol, currentMode);
    validateParameterRanges();
    syncParameterHints();
  };
  const onParametersChanged = () => {
    validateParameterRanges();
    syncParameterHints();
    renderCompactPreview(state.stimulus, state.testType, state.protocol, getModeValue(state));
  };
  protocol.addEventListener("change", () => {
    const nextProtocol = protocol.value as CompactProtocolValue;
    state = nextProtocol === "optimal"
      ? {...state, protocol: "optimal"}
      : {...state, protocol: "feedback"};
    refresh(state);
  });
  mode.addEventListener("change", () => {
    const nextMode = mode.value as CompactModeValue;
    state = nextMode === "standard"
      ? {...state, protocol: "optimal"}
      : {...state, protocol: "feedback", feedbackMode: nextMode};
    refresh(state);
  });
  testType.addEventListener("change", () => {
    state = {...state, testType: testType.value as TestType};
    refresh(state);
  });
  stimulus.addEventListener("change", () => {
    state = {...state, stimulus: stimulus.value as TestMode};
    refresh(state);
  });
  const parametersRoot = document.getElementById("compact-parameters")!;
  parametersRoot.addEventListener("input", onParametersChanged);
  // :user-invalid only matches once the field loses focus, so re-sync on blur.
  parametersRoot.addEventListener("focusout", () => syncParameterHints());
  refresh(state);
}

function renderCompactParameters(appContext: AppContext, protocol: CompactProtocolValue, submode: CompactModeValue): void {
  const ts = appContext.testSettings;
  // Build a preview settings object that reflects the chosen protocol/submode.
  // The stored context may still be optimal while the user is previewing the
  // feedback fields, so we project onto the selected arm.
  const previewSettings: TestSettings = protocol === "feedback"
    ? submode === "strength"
      ? {
        protocolMode: "feedback-strength",
        testMode: ts.testMode,
        stimulusSize: ts.stimulusSize,
        testType: ts.testType,
        usePregenerated: {stimuli: ts.usePregenerated.stimuli},
        feedback: (isFeedback(ts) ? ts.feedback : {
          initialExposure: 900,
          adjustmentStep: 20,
          minExposure: 20,
          maxExposure: 900,
          pause: 200,
          duration: 300
        }) as FeedbackStrengthSettings["feedback"],
      }
      : {
        protocolMode: "feedback-mobility",
        testMode: ts.testMode,
        stimulusSize: ts.stimulusSize,
        stimulusCount: isFeedbackMobility(ts) ? ts.stimulusCount : 120,
        testType: ts.testType,
        usePregenerated: {stimuli: ts.usePregenerated.stimuli},
        feedback: isFeedback(ts)
          ? ts.feedback
          : {initialExposure: 900, adjustmentStep: 20, minExposure: 20, maxExposure: 900, pause: 200},
      }
    : {
      protocolMode: "optimal",
      testMode: ts.testMode,
      stimulusSize: ts.stimulusSize,
      exposureTime: (ts as OptimalSettings).exposureTime ?? 700,
      exposureDelay: (ts as OptimalSettings).exposureDelay ?? [500, 1900],
      stimulusCount: (ts as OptimalSettings).stimulusCount ?? 50,
      testType: ts.testType,
      usePregenerated: {exposureDelay: (ts as OptimalSettings).usePregenerated?.exposureDelay ?? true, stimuli: ts.usePregenerated.stimuli},
    };

  const rows = protocol === "feedback"
    ? submode === "strength"
      ? [
        parameterField(parameters.stimulusSize, previewSettings.stimulusSize),
        parameterField(parameters.feedbackDuration, (previewSettings as FeedbackStrengthSettings).feedback.duration),
        parameterField(parameters.feedbackInitialExposure, feedbackTuning(previewSettings).initialExposure),
        parameterField(parameters.feedbackAdjustmentStep, feedbackTuning(previewSettings).adjustmentStep),
        parameterField(parameters.feedbackMinExposure, feedbackTuning(previewSettings).minExposure, "exposureMinExceedsMaxError"),
        parameterField(parameters.feedbackMaxExposure, feedbackTuning(previewSettings).maxExposure),
        parameterField(parameters.feedbackPause, feedbackTuning(previewSettings).pause),
      ]
      : [
        parameterField(parameters.stimulusSize, previewSettings.stimulusSize),
        parameterField(parameters.feedbackStimulusCount, (previewSettings as FeedbackMobilitySettings).stimulusCount),
        parameterField(parameters.feedbackInitialExposure, feedbackTuning(previewSettings).initialExposure),
        parameterField(parameters.feedbackAdjustmentStep, feedbackTuning(previewSettings).adjustmentStep),
        parameterField(parameters.feedbackMinExposure, feedbackTuning(previewSettings).minExposure, "exposureMinExceedsMaxError"),
        parameterField(parameters.feedbackMaxExposure, feedbackTuning(previewSettings).maxExposure),
        parameterField(parameters.feedbackPause, feedbackTuning(previewSettings).pause),
      ]
    : [
      parameterField(parameters.stimulusSize, previewSettings.stimulusSize),
      parameterField(parameters.stimulusCount, (previewSettings as OptimalSettings).stimulusCount),
      parameterField(parameters.exposureTime, (previewSettings as OptimalSettings).exposureTime),
      renderDelayRangeFields(
        (previewSettings as OptimalSettings).exposureDelay[0],
        (previewSettings as OptimalSettings).exposureDelay[1],
        (previewSettings as OptimalSettings).usePregenerated.exposureDelay
      ),
    ];
  // The pregenerated-delays option only applies to the optimal protocol's
  // random delay range; feedback cadence uses the fixed pause, so the checkbox
  // is hidden there and the stored flag is passed through untouched.
  document.getElementById("compact-parameters")!.innerHTML =
    rows.join("") + renderPregeneratedOptions(previewSettings, protocol === "optimal");

  // If pregenerated delay is checked, disable the delay min/max inputs
  if (protocol === "optimal") {
    const usePregeneratedDelayCheckbox = document.getElementById("compact-use-pregenerated-delay") as HTMLInputElement | null;
    if (usePregeneratedDelayCheckbox) {
      const setPregeneratedDelayState = (disabled: boolean) => {
        for (const id of [parameters.exposureDelayMin.id, parameters.exposureDelayMax.id]) {
          const input = document.getElementById(id) as HTMLInputElement | null;
          const labelRow = document.getElementById(`${id}-meta`) as HTMLElement | null;
          const preset = document.getElementById(`${id}-preset`) as HTMLElement | null;
          if (!input || !labelRow) continue;
          const unitSuffix = input.nextElementSibling as HTMLElement | null;
          labelRow.classList.toggle("opacity-40", disabled);
          labelRow.classList.toggle("pointer-events-none", disabled);
          preset?.classList.toggle("hidden", !disabled);
          preset?.classList.toggle("flex", disabled);
          unitSuffix?.classList.toggle("invisible", disabled);
          input.classList.toggle("text-transparent", disabled);
          input.classList.toggle("cursor-not-allowed", disabled);
          input.classList.toggle("opacity-60", disabled);
          input.disabled = disabled;
        }
      };

      usePregeneratedDelayCheckbox.addEventListener("change", () => {
        setPregeneratedDelayState(usePregeneratedDelayCheckbox.checked);
      });
      setPregeneratedDelayState(usePregeneratedDelayCheckbox.checked);
    }
  }
}

function renderCompactInstruction(testType: TestType, testMode: TestMode, protocol: CompactProtocolValue): void {
  const taskKey = testType === "svmr" ? "instructionSvmr" : testType === "crt1-3" ? `instructionCRT13_${testMode}` : `instructionCRT23_${testMode}`;
  const protocolKey = protocol === "feedback" ? "instructionFeedback" : "instructionOptimal";
  const instruction = document.getElementById("compact-instruction")!;
  delete instruction.dataset.localizeHtml;
  instruction.dataset.instructionTask = taskKey;
  instruction.dataset.instructionProtocol = protocolKey;
  instruction.innerHTML = `${localize(taskKey)}${localize(protocolKey)}`;
}

function renderCompactPreview(testMode: TestMode, testType: TestType, protocol: CompactProtocolValue, submode: CompactModeValue): void {
  const preview = document.getElementById("compact-preview")!;
  const isFeedback = protocol === "feedback";
  const isStrength = isFeedback && submode === "strength";
  const exposure = isFeedback
    ? readNumberInput(parameters.feedbackInitialExposure)
    : readNumberInput(parameters.exposureTime);
  const stimulusSize = PREVIEW_STIMULUS_SIZE;
  const isChoiceTest = testType === "crt1-3" || testType === "crt2-3";
  const stimulusColumns = testType === "crt2-3"
    ? `${previewReactionColumn(testMode, "left", stimulusSize)}${previewReactionColumn(testMode, "ignore", stimulusSize)}${previewReactionColumn(testMode, "right", stimulusSize)}`
    : testType === "crt1-3"
      ? `${previewReactionColumn(testMode, "left", stimulusSize, "previewIgnore")}${previewReactionColumn(testMode, "space", stimulusSize, "testScreenTestPZMRActionButtonName")}${previewReactionColumn(testMode, "ignore", stimulusSize, "previewIgnore")}`
      : previewReactionColumn(testMode, "space", stimulusSize);
  const stimulus = `<div class="grid w-full ${isChoiceTest ? "grid-cols-3" : "grid-cols-1"} items-end gap-2 px-2">${stimulusColumns}</div>`;
  // Feedback cadence: fixed pause between trials; the pause doubles as the
  // late-answer window. Optimal: random delay range.
  const pauseMs = isFeedback ? readNumberInput(parameters.feedbackPause) : undefined;
  let delayMin: number;
  let delayMax: number;
  let usePregeneratedDelay = false;
  if (!isFeedback) {
    const pregenCheckbox = document.getElementById("compact-use-pregenerated-delay") as HTMLInputElement | null;
    usePregeneratedDelay = pregenCheckbox?.checked ?? false;
    if (usePregeneratedDelay) {
      // Show "pregenerated" in preview instead of min/max
      delayMin = 0; // placeholder won't be used for display
      delayMax = 0;
    } else {
      delayMin = readNumberInput(parameters.exposureDelayMin);
      delayMax = readNumberInput(parameters.exposureDelayMax);
    }
  } else {
    delayMin = pauseMs ?? 200;
    delayMax = pauseMs ?? 200;
  }

  // Session-extent badge: count-driven (optimal/mobility) vs time-driven (strength).
  const sessionBadge = isStrength
    ? `<span class="rounded border border-gray-500 px-2 py-1 font-mono">⏱ ${readNumberInput(parameters.feedbackDuration)}&nbsp;<span data-localize="s"></span></span>`
    : `<span class="font-mono">× ${(isFeedback ? readNumberInput(parameters.feedbackStimulusCount) : readNumberInput(parameters.stimulusCount))}&nbsp;<span data-localize="units"></span></span>`;

  const adaptationBadge = isFeedback
    ? `<span>→</span><span class="rounded border border-emerald-500 px-2 py-1"><span data-localize="previewAdaptationState"></span>&nbsp;±${readNumberInput(parameters.feedbackAdjustmentStep)}&nbsp;<span data-localize="ms"></span></span>`
    : "";

  // Fixed pause (min === max) collapses to a single value; feedback cadence
  // has no pre-stimulus delay - the pause IS the post-stimulus late-answer
  // window, so it is shown only once, after the stimulus.
  const rangeText = usePregeneratedDelay
    ? (localize("pregeneratedLabel") ?? "pregenerated")
    : delayMin === delayMax ? `${delayMin}` : `${delayMin}–${delayMax}`;
  const pauseLabel = `<span data-localize="previewPauseState"></span>&nbsp;[${rangeText}&nbsp;<span data-localize="ms"></span>]`;
  const pauseChip = `<span class="rounded border border-gray-700 px-2 py-1">${pauseLabel}</span>`;
  const stimulusChip = `<span class="rounded border border-gray-500 px-2 py-1"><span data-localize="previewStimulusState"></span>&nbsp;[${exposure}&nbsp;<span data-localize="ms"></span>]</span>`;
  const leadingPause = isFeedback ? "" : `${pauseChip}<span>→</span>`;
  const stateDiagram = `<div class="absolute bottom-2 left-3 right-3 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-300">${leadingPause}${stimulusChip}<span>→</span>${pauseChip}${adaptationBadge}${sessionBadge}</div>`;
  preview.innerHTML = `<div class="relative flex min-h-[30rem] w-full items-center justify-center overflow-hidden rounded-box bg-black py-10 text-white">${stimulus}${stateDiagram}</div>`;
  updateLanguageUI(preview);
}

function previewReactionColumn(
  testMode: TestMode,
  action: "left" | "right" | "space" | "ignore",
  size: number,
  instructionOverride?: string
): string {
  const instruction = instructionOverride ?? (action === "left" ? "statLeftHand" : action === "right" ? "statRightHand" : action === "space" ? "testScreenTestPZMRActionButtonName" : "previewIgnore");
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
    // Skip validation if input is disabled (pregenerated mode)
    if (minInput.disabled) {
      minInput.setCustomValidity("");
      minInput.removeAttribute("aria-invalid");
      const hint = document.getElementById(`${minDefinition.id}-hint`);
      hint?.classList.add("hidden");
      return;
    }
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
  for (const [minDefinition, maxDefinition, errorKey] of parameterPairs) {
    // Skip if min input is disabled (pregenerated delay)
    const minInput = document.getElementById(minDefinition.id) as HTMLInputElement | null;
    if (minInput?.disabled) continue;
    const minValue = readNumberInput(minDefinition);
    const maxValue = readNumberInput(maxDefinition);
    markRange(minDefinition, minValue > maxValue ? errorKey : null);
  }
}

/**
 * Reveals a field's validator hint only while it is actually invalid - either
 * through the cross-field range error (aria-invalid, set by
 * validateParameterRanges) or through a native constraint violation such as an
 * out-of-range value. checkValidity is evaluated directly (instead of relying
 * on :user-invalid) so the hint appears immediately while typing, not only
 * after the field loses focus. Valid fields keep the hint collapsed.
 */
function syncParameterHints(): void {
  for (const definition of Object.values(parameters)) {
    const input = document.getElementById(definition.id);
    const hint = document.getElementById(`${definition.id}-hint`);
    if (!(input instanceof HTMLInputElement) || !hint) continue;
    const crossFieldInvalid = input.getAttribute("aria-invalid") === "true";
    const nativeInvalid = !input.checkValidity() && input.value !== "";
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
  const protocolMode = (document.getElementById("protocol-select") as HTMLSelectElement).value;
  const feedbackSubmode = (document.getElementById("mode-select") as HTMLSelectElement).value;
  const testType = (document.getElementById("test-type-select") as HTMLSelectElement).value as TestType;
  const testMode = (document.getElementById("stimulus-select") as HTMLSelectElement).value as TestMode;

  // Read delay min/max only if NOT using pregenerated delay (optimal mode only)
  const delayPregenCheckbox = document.getElementById("compact-use-pregenerated-delay") as HTMLInputElement | null;
  const useDelayPregen = delayPregenCheckbox?.checked ?? (current.testSettings.protocolMode === 'optimal' ? current.testSettings.usePregenerated.exposureDelay : false);

  let delayMin = 500;
  let delayMax = 1900;
  if (!useDelayPregen && protocolMode === "optimal") {
    delayMin = readNumberInput(parameters.exposureDelayMin);
    delayMax = readNumberInput(parameters.exposureDelayMax);
  } else if (protocolMode === "optimal") {
    // Use current stored values when pregenerated is enabled
    const ts = current.testSettings;
    if (ts.protocolMode === 'optimal') {
      delayMin = ts.exposureDelay[0];
      delayMax = ts.exposureDelay[1];
    }
  }

  const feedbackMinExposure = readNumberInput(parameters.feedbackMinExposure);
  const feedbackMaxExposure = readNumberInput(parameters.feedbackMaxExposure);

  const useStimuli = (document.getElementById("compact-use-pregenerated-stimuli") as HTMLInputElement).checked;
  // Hidden in feedback mode (the pause replaces the delay range), so fall back
  // to the stored flag instead of a null-deref.
  const useDelay = useDelayPregen;

  const base = {
    testMode,
    stimulusSize: readNumberInput(parameters.stimulusSize),
    testType,
    usePregenerated: {stimuli: useStimuli} as { stimuli: boolean },
  };

  let testSettings: TestSettings;
  if (protocolMode === "optimal") {
    testSettings = {
      ...base,
      usePregenerated: {exposureDelay: useDelay, stimuli: useStimuli},
      protocolMode: "optimal",
      exposureTime: readNumberInput(parameters.exposureTime),
      exposureDelay: [delayMin, delayMax],
      stimulusCount: readNumberInput(parameters.stimulusCount),
    };
  } else if (feedbackSubmode === "strength") {
    testSettings = {
      ...base,
      protocolMode: "feedback-strength",
      feedback: {
        initialExposure: readNumberInput(parameters.feedbackInitialExposure),
        adjustmentStep: readNumberInput(parameters.feedbackAdjustmentStep),
        minExposure: feedbackMinExposure,
        maxExposure: feedbackMaxExposure,
        pause: readNumberInput(parameters.feedbackPause),
        duration: readNumberInput(parameters.feedbackDuration),
      },
    };
  } else {
    testSettings = {
      ...base,
      protocolMode: "feedback-mobility",
      stimulusCount: readNumberInput(parameters.feedbackStimulusCount),
      feedback: {
        initialExposure: readNumberInput(parameters.feedbackInitialExposure),
        adjustmentStep: readNumberInput(parameters.feedbackAdjustmentStep),
        minExposure: feedbackMinExposure,
        maxExposure: feedbackMaxExposure,
        pause: readNumberInput(parameters.feedbackPause),
      },
    };
  }

  AppContextManager.setContext({
    ...current,
    personalData: {
      firstName: (document.getElementById("name-input") as HTMLInputElement).value,
      lastName: (document.getElementById("surname-input") as HTMLInputElement).value,
      gender: (document.getElementById("gender-select") as HTMLSelectElement).value as "male" | "female",
      age: Number((document.getElementById("age-input") as HTMLInputElement).value),
    },
    testSettings,
  });
  Router.navigate("/test");
}

const resetSettingsButtonCallback: () => void = () => {
  AppContextManager.setContext(defaultAppContext);
  Router.navigate("/settings");
}
