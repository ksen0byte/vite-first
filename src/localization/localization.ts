import {settings} from "../config/settings.ts";
import {LanguageManager} from "./LanguageManager.ts";
import katex from 'katex';
import {WORD_SEQUENCE_EN, WORD_SEQUENCE_UA} from "../domain/stimulus-sequences.ts";
import {getRepresentativeWord, type WordCategory} from "../components/Words.ts";

export function updateLanguageUI(): void {
  const currentLanguage = LanguageManager.getCurrentLanguage();
  document.documentElement.lang = currentLanguage;
  document.title = localize('appTitle');

  const localizableElements = document.querySelectorAll<HTMLElement>("[data-localize]");
  localizableElements.forEach((element) => {
    const key = element.dataset.localize!;
    const textContent = localize(key);
    if (element.tagName === "INPUT") {
      element.setAttribute("placeholder", textContent);
      element.setAttribute("aria-label", textContent);
    } else {
      element.textContent = textContent;
    }
  });

  const htmlLocalizableElements = document.querySelectorAll<HTMLElement>("[data-localize-html]");
  htmlLocalizableElements.forEach((element) => {
    const key = element.dataset.localizeHtml!;
    element.innerHTML = localize(key);
  });

  const wordCategoryElements = document.querySelectorAll<HTMLElement>("[data-localize-word-category]");
  wordCategoryElements.forEach((element) => {
    const category = element.dataset.localizeWordCategory! as WordCategory;
    element.textContent = getRepresentativeWord(getLocalizedVar("randomWords"), category);
  });

  const ariaLocalizableElements = document.querySelectorAll<HTMLElement>('[data-localize-aria]');
  ariaLocalizableElements.forEach((element) => {
    element.setAttribute('aria-label', localize(element.dataset.localizeAria!));
  });

  const mathElements = document.querySelectorAll<HTMLElement>("[data-localize-math]");
  mathElements.forEach((element) => {
    const key = element.dataset.localizeMath!;
    const latexString = localize(key);

    try {
      katex.render(latexString, element, {
        strict: "ignore",
        throwOnError: false,
        displayMode: false // або true, якщо треба блоком
      });
    } catch (e) {
      console.error(e);
      element.textContent = latexString; // Fallback
    }
  });
}

type LocalizationKeys = {
  [key: string]: { [language: string]: string };
};

export function localize(key: string): string {
  const currentLanguage = LanguageManager.getCurrentLanguage();
  return localization[key]?.[currentLanguage] || localization[key]?.[settings.default.language] || key;
}

const localization: LocalizationKeys = {
  protocolLabel: {en: "Protocol", uk: "Протокол"},
  regimeLabel: {en: "Regime", uk: "Режим"},
  submodeLabel: {en: "Submode", uk: "Підрежим"},
  stimulusTypeLabel: {en: "Stimulus type", uk: "Вид подразника"},
  genderLabel: {en: "Gender", uk: "Стать"},
  optimalProtocol: {en: "Optimal protocol", uk: "Оптимальний протокол"},
  feedbackProtocol: {en: "Feedback protocol", uk: "Протокол зворотного зв’язку"},
  feedbackInitialExposure: {en: "Initial exposure", uk: "Початкова експозиція"},
  feedbackAdjustmentStep: {en: "Adjustment step", uk: "Крок зміни"},
  feedbackMinExposure: {en: "Minimum exposure", uk: "Мінімальна експозиція"},
  feedbackMaxExposure: {en: "Maximum exposure", uk: "Максимальна експозиція"},
  feedbackPause: {en: "Pause between stimuli", uk: "Пауза між подразниками"},
  feedbackDuration: {en: "Test duration", uk: "Тривалість тесту"},
  testSettingsTitle: {en: "Test settings", uk: "Налаштування тесту"},
  instructionTitle: {en: "Preview and instruction", uk: "Попередній перегляд та інструкція"},
  previewPauseState: {en: "pause", uk: "пауза"},
  previewStimulusState: {en: "stimulus", uk: "подразник"},
  previewIgnore: {en: "ignore", uk: "ігнорувати"},
  units: {en: "units", uk: "од."},
  exposureDelayMinLabel: {en: "Minimum exposure delay", uk: "Мінімальна затримка експозиції"},
  exposureDelayMaxLabel: {en: "Maximum exposure delay", uk: "Максимальна затримка експозиції"},
  feedbackMobility: {en: "Functional mobility", uk: "Функціональна рухливість"},
  feedbackStrength: {en: "Nervous process strength", uk: "Сила нервових процесів"},
  optimalMode: {en: "Fixed exposure", uk: "Фіксована експозиція"},
  languageSelector: {en: "Language", uk: "Мова"},
  languageEN: {en: "EN", uk: "АНГЛ."}, // Localized label for "EN"
  languageUA: {en: "UA", uk: "УКР."},  // Localized label for "UA"

  // keys for theme names
  theme_light: {en: "Light", uk: "Світла"},
  theme_dark: {en: "Dark", uk: "Темна"},
  theme_cupcake: {en: "Cupcake", uk: "Пончик"},
  theme_bumblebee: {en: "Bumblebee", uk: "Джміль"},
  theme_emerald: {en: "Emerald", uk: "Смарагд"},
  theme_corporate: {en: "Corporate", uk: "Корпоративна"},
  theme_caramelatte: {en: "Caramelatte", uk: "Карамеллате"},
  theme_retro: {en: "Retro", uk: "Ретро"},
  theme_valentine: {en: "Valentine", uk: "Валентин"},
  theme_halloween: {en: "Halloween", uk: "Геловін"},
  theme_garden: {en: "Garden", uk: "Сад"},
  theme_forest: {en: "Forest", uk: "Ліс"},
  theme_aqua: {en: "Aqua", uk: "Вода"},
  theme_lofi: {en: "Lofi", uk: "Лофі"},
  theme_pastel: {en: "Pastel", uk: "Пастель"},
  theme_dracula: {en: "Dracula", uk: "Дракула"},
  theme_business: {en: "Business", uk: "Бізнес"},
  theme_night: {en: "Night", uk: "Ніч"},
  theme_coffee: {en: "Coffee", uk: "Кава"},
  theme_winter: {en: "Winter", uk: "Зима"},
  theme_dim: {en: "Dim", uk: "Приглушена"},
  theme_sunset: {en: "Sunset", uk: "Захід"},
  theme_abyss: {en: "Abyss", uk: "Безодня"},
  themeToggle: {en: "Theme", uk: "Тема"},

  // settings screen
  appTitle: {en: "Assessment of Human CNS Functional State", uk: "Визначення функціонального стану ЦНС людини"},
  nameLabel: {en: "Name", uk: "Ім’я"},
  surnameLabel: {en: "Last Name", uk: "Прізвище"},
  ageLabel: {en: "Age", uk: "Вік"},
  selectGender: {en: "Gender", uk: "Стать"},
  allowedRangeHint: {en: "Allowed range:", uk: "Допустимий діапазон:"},
  delayMinExceedsMaxError: {en: "Minimum delay cannot exceed maximum delay", uk: "Мінімальна затримка не може перевищувати максимальну"},
  exposureMinExceedsMaxError: {en: "Minimum exposure cannot exceed maximum exposure", uk: "Мінімальна експозиція не може перевищувати максимальну"},
  male: {en: "Male", uk: "Чоловіча"},
  female: {en: "Female", uk: "Жіноча"},
  savedTestsBtnLabel: {en: "Saved Tests", uk: "Збережені Тести"},

  // dashboard
  dashboardHeaderTitle: {en: "Tools and Services", uk: "Інструменти та сервіси"},
  dashboardReactionDesc: {
    en: "Start testing to measure CNS functional state.",
    uk: "Почати тестування для оцінки функціонального стану ЦНС."
  },
  dashboardBioAgeDesc: {
    en: "Calculate Biological Age using a known mean reaction time.",
    uk: "Розрахуйте біологічний вік за відомим середнім часом реакції."
  },
  dashboardProfilesDesc: {
    en: "Manage user profiles and view saved tests.",
    uk: "Керуйте профілями користувачів та переглядайте збережені тести."
  },
  dashboardOptimalMode: {
    en: "Assessment of Sensorimotor Reactivity",
    uk: "Тести сенсомоторної реактивності"
  },
  open: {en: "Open", uk: "Відкрити"},

  // units
  mm: {en: "mm", uk: "мм"},
  ms: {en: "ms", uk: "мс"},
  s: {en: "s", uk: "с"},
  au: {en: "arb. u.", uk: "ум. од."},

  // Test mode
  testModeLabel: {en: "Test Mode", uk: "Вид подразника"},
  shapesOption: {en: "🔴 Geometrical Shapes", uk: "🔴 Геометричні Фігури"},
  wordsOption: {en: "🔤 Words", uk: "🔤 Слова"},
  colorsOption: {en: "🎨 Colors", uk: "🎨 Кольори"},
  combinedOption: {en: "🔀 Combined Stimuli", uk: "🔀 Комбіновані Стимули"},

  // Test settings
  exposureTimeLabel: {en: "Stimulus Exposure", uk: "Експозиція подразника"},
  stimulusCountLabel: {en: "Number of Stimuli", uk: "Кількість подразників"},

  // Footer
  resetSettings: {en: "Reset Settings", uk: "Скинути налаштування"},
  startTest: {en: "Start Test", uk: "Розпочати Тест"},
  back: {en: "Back", uk: "Назад"},
  next: {en: "Next", uk: "Далі"},
  exportData: {en: "Export Data", uk: "Експорт Даних"},
  exportAllData: {en: "Export All Users Data", uk: "Експорт Даних Всіх Користувачів"},
  importAllData: {en: "Import Data", uk: "Імпорт Даних"},
  importSuccess: {en: "Import completed: %u users, %t tests.", uk: "Імпорт завершено: %u користувачів, %t тестів."},
  importError: {en: "Error importing data. Please check the file and try again.", uk: "Помилка імпорту даних. Перевірте файл і спробуйте ще раз."},

  // Test Type
  selectTestType: {en: "Select Test Type", uk: "Оберіть тип тестування"},
  testTypePzmrShort: {en: "SVMR", uk: "ПЗМР"},
  testTypeRV13Short: {en: "CRT1-3", uk: "РВ1-3"},
  testTypeRV23Short: {en: "CRT2-3", uk: "РВ2-3"},
  testTypePzmrLong: {en: "Simple visual-motor reaction", uk: "Проста зорово-моторна реакція"},
  testTypeRV13Long: {en: "Reaction to the choice of one out of three signals", uk: "Реакція вибору одного із трьох сигналів"},
  testTypeRV23Long: {en: "Reaction to the choice of two out of three signals", uk: "Реакція вибору двох із трьох сигналів"},
  instructionPreviewSpace: {en: "Space", uk: "Пробіл"},

  // Test instructions | modes -> "shapes" | "words" | "colors" | "combined"
  instructionSvmr: {
    en: "Press the <kbd class='kbd'>Space</kbd> key as quickly as possible when <b>ANY</b> stimulus appears on the screen.",
    uk: "Натискайте клавішу <kbd class='kbd'>Пробіл</kbd> якнайшвидше, коли на екрані з'явиться <b>БУДЬ-ЯКИЙ</b> подразник."
  },
  // en: "Press the <kbd class='kbd'>Space</kbd> key as quickly as possible when a target stimulus (Red, Square, or Animal) appears. Ignore other stimuli.",
  // uk: "Натискайте клавішу <kbd class='kbd'>Пробіл</kbd> якнайшвидше, коли з'явиться цільовий подразник (Червоний, Квадрат або Тварина). Ігноруйте інші подразники."
  instructionCRT13_shapes: {
    en: "Press the <kbd class='kbd'>Space</kbd> key as quickly as possible when a <b>Square</b> appears. Ignore other stimuli.",
    uk: "Натискайте клавішу <kbd class='kbd'>Пробіл</kbd> якнайшвидше, коли з'явиться <b>Квадрат</b>. Ігноруйте інші подразники."
  },
  instructionCRT13_words: {
    en: "Press the <kbd class='kbd'>Space</kbd> key as quickly as possible when an <b>Animal</b> appears. Ignore other stimuli.",
    uk: "Натискайте клавішу <kbd class='kbd'>Пробіл</kbd> якнайшвидше, коли з'явиться <b>Тварина</b>. Ігноруйте інші подразники."
  },
  instructionCRT13_colors: {
    en: "Press the <kbd class='kbd'>Space</kbd> key as quickly as possible when a <b>Red</b> appears. Ignore other stimuli.",
    uk: "Натискайте клавішу <kbd class='kbd'>Пробіл</kbd> якнайшвидше, коли з'явиться <b>Червоний</b>. Ігноруйте інші подразники."
  },
  instructionCRT13_combined: {
    en: "Press the <kbd class='kbd'>Space</kbd> key as quickly as possible when a target stimulus (Red, Square, or Animal) appears. Ignore other stimuli.",
    uk: "Натискайте клавішу <kbd class='kbd'>Пробіл</kbd> якнайшвидше, коли з'явиться цільовий подразник (<b>Червоний, Квадрат або Тварина</b>). Ігноруйте інші подразники."
  },
  instructionCRT23_shapes: {
    en: "Press <b>Left</b> (<kbd class='kbd'>←</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) for <b>Circle</b>, <b>Right</b> (<kbd class='kbd'>→</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) for <b>Square</b>. Ignore <b>Triangle</b>.",
    uk: "Натискайте <b>Ліві</b> (<kbd class='kbd'>←</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) для <b>Кола</b>, <b>Праві</b> клавіші (<kbd class='kbd'>→</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) для <b>Квадрата</b>. Ігноруйте <b>Трикутник</b>."
  },
  instructionCRT23_words: {
    en: "Press <b>Left</b> (<kbd class='kbd'>←</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) for <b>Plant</b>, <b>Right</b> (<kbd class='kbd'>→</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) for <b>Animal</b>. Ignore <b>Non-living thing</b>.",
    uk: "Натискайте <b>Ліві</b> (<kbd class='kbd'>←</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) для <b>Рослини</b>, <b>Праві</b> клавіші (<kbd class='kbd'>→</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) для <b>Тварини</b>. Ігноруйте <b>Неживі предмети</b>."
  },
  instructionCRT23_colors: {
    en: "Press <b>Left</b> (<kbd class='kbd'>←</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) for <b>Green</b>, <b>Right</b> (<kbd class='kbd'>→</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) for <b>Red</b>. Ignore <b>Yellow</b>.",
    uk: "Натискайте <b>Ліві</b> (<kbd class='kbd'>←</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) для <b>Зеленого</b>, <b>Праві</b> клавіші (<kbd class='kbd'>→</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) для <b>Червоного</b>. Ігноруйте <b>Жовтий</b>."
  },
  instructionCRT23_combined: {
    en: "Press <b>Left</b> (<kbd class='kbd'>←</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) for <b>Green/Circle/Plant</b>, <b>Right</b> (<kbd class='kbd'>→</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) for <b>Red/Square/Animal</b>. Ignore <b>Yellow/Triangle/Non-living</b>.",
    uk: "Натискайте <b>Ліві</b> (<kbd class='kbd'>←</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) для <b>Зеленого/Кола/Рослини</b>, <b>Праві</b> клавіші (<kbd class='kbd'>→</kbd>, <kbd class='kbd'>Shift</kbd>, <kbd class='kbd'>Ctrl</kbd>) для <b>Червоного/Квадрата/Тварини</b>. Ігноруйте <b>Жовтий/Трикутник/Неживе</b>."
  },

  // Biological Age calculator
  screenBiologicalAgeCalculatorTitle: {en: "Biological Age Calculator", uk: "Калькулятор біологічного віку"},
  labelBiologicalAgeMeanSensorimotorReactionMilliseconds: {en: "Mean Reaction Time (ms)", uk: "Середній час реакції (мс)"},
  buttonBiologicalAgeCalculate: {en: "Calculate", uk: "Розрахувати"},
  labelBiologicalAgeInterpretationStatus: {en: "Status", uk: "Статус"},
  // Use full terminology, with abbreviation in parentheses for clarity
  biologicalAgeInterpretationAccelerated: {en: "Biological age is younger than chronological", uk: "Біологічний вік менший за хронологічний"},
  biologicalAgeInterpretationNormal: {en: "Biological and chronological ages correspond", uk: "Біологічний та хронологічний вік відповідають"},
  biologicalAgeInterpretationDelayed: {en: "Biological age is older than chronological", uk: "Біологічний вік більший за хронологічний"},
  errorBiologicalAgeInvalidInput: {en: "Invalid input or age out of range (7–16).", uk: "Некоректні дані або вік поза діапазоном (7–16)."},

  // Biological Age: Normative table and formulas
  headingBiologicalAgeNormativeSensorimotorValues: {en: "Normative values (ms)", uk: "Належні значення (мс)"},
  columnNormativeSensorimotorAgeYears: {en: "Age (years)", uk: "Вік (роки)"},
  columnNormativeSensorimotorBoysMs: {en: "Boys (ms)", uk: "Хлопчики (мс)"},
  columnNormativeSensorimotorGirlsMs: {en: "Girls (ms)", uk: "Дівчата (мс)"},
  // --- FORMULAS (LaTeX only) ---
  formulaTempoOfBiologicalDevelopmentText: {
    en: "\\text{TBD} = \\frac{\\text{SR}_{act}}{\\text{SR}_{norm}}",
    uk: "\\text{ТБР} = \\frac{\\text{СР}_{\\text{ф}}}{\\text{СР}_{\\text{т}}}"
  },
  formulaBiologicalAgeText: {
    en: "\\text{BA} = \\frac{\\text{CA}}{\\text{TBD}}",
    uk: "\\text{БВ} = \\frac{\\text{ПВ}}{\\text{ТБР}}"
  },

  // --- HEADERS ---
  headingBiologicalAgeFormulasUsed: {en: "Formulas Used", uk: "Використані формули"},
  headingBiologicalAgeTempoInterpretation: {en: "Interpretation of TBD", uk: "Інтерпретація ТБР"},

  // --- VARIABLE DESCRIPTIONS ---
  // Actual SR
  variableActualSensorimotorReaction: {en: "\\text{SR}_{act}", uk: "СР_ф"},
  descriptionActualSensorimotorReaction: {en: "Actual Sensorimotor Reaction", uk: "Фактичне значення сенсомоторного реагування"},

  // Normative SR
  variableNormativeSensorimotorReaction: {en: "\\text{SR}_{norm}", uk: "СР_т"},
  descriptionNormativeSensorimotorReaction: {en: "Normative Sensorimotor Reaction", uk: "Табличне належне значення сенсомоторного реагування"},

  // Biological age
  variableBiologicalAge: {en: "BA", uk: "БВ"},
  descriptionBiologicalAge: {en: "Biological Age", uk: "Біологічний вік"},

  // Tempo of Biological Development
  variableTempoOfBiologicalDevelopment: {en: "TBD", uk: "ТБР"},
  descriptionTempoOfBiologicalDevelopment: {en: "Tempo of Biological Development", uk: "Темп біологічного розвитку (ТБР)"},

  // Child passport age
  variableChildPassportAge: {en: "CA", uk: "ПВ"},
  descriptionChildPassportAge: {en: "Chronological Age", uk: "Паспортний вік"},

  // --- INTERPRETATION CONDITIONS (Mathematical conditions) ---
  conditionBiologicalAgeAcceleratedDevelopment: {en: "TBD < 0.95", uk: "ТБР < 0.95"},
  conditionBiologicalAgeNormalDevelopment: {en: "0.95 ≤ TBD ≤ 1.10", uk: "0.95 ≤ ТБР ≤ 1.10"},
  conditionBiologicalAgeDelayedDevelopment: {en: "TBD > 1.10", uk: "ТБР > 1.10"},

  // --- INTERPRETATION DESCRIPTIONS (Human readable text) ---
  descriptionBiologicalAgeAcceleratedDevelopment: {en: "Accelerated development", uk: "Розвиток прискорений"},
  descriptionBiologicalAgeNormalDevelopment: {en: "Normal development", uk: "Розвиток у нормі"},
  descriptionBiologicalAgeDelayedDevelopment: {en: "Delayed development", uk: "Розвиток уповільнений"},


  // begin test screen
  appContextSummaryFirstName: {en: "First Name", uk: "Ім’я"},
  appContextSummaryLastName: {en: "Last Name", uk: "Прізвище"},
  appContextSummaryGender: {en: "Gender", uk: "Стать"},
  appContextSummaryAge: {en: "Age", uk: "Вік"},
  appContextSummaryTestMode: {en: "Test Mode", uk: "Вид подразника"},
  appContextSummaryStimulusSize: {en: "Stimulus Size", uk: "Розмір подразника"},
  appContextSummaryExposureTime: {en: "Exposure Time", uk: "Експозиція подразника"},
  appContextSummaryExposureDelay: {en: "Exposure Delay", uk: "Затримка експозиції"},
  appContextSummaryStimulusCount: {en: "Stimulus Count", uk: "Кількість подразників"},
  appContextSummaryTestType: {en: "Test Type", uk: "Тип тестування"},

  // test screen
  testScreenTestStart: {en: "Start!", uk: "Старт!"},
  testScreenTestBtnRetry: {en: "Retry", uk: "Заново"},
  testScreenTestBtnFinish: {en: "Finish", uk: "Закінчити"},
  testScreenTestPZMRActionButtonLeft: {en: "Press", uk: "Натисніть "},
  testScreenTestPZMRActionButtonName: {en: "Space", uk: "Пробіл"},
  testScreenTestPZMRActionButtonRight: {en: "once a stimulus appears", uk: "одразу, коли з'явиться подразник"},
  testScreenTestCRTActionButtonRight: {en: "once a target stimulus appears", uk: "одразу, коли з'явиться цільовий подразник"},
  spamWarningTitle: {
    en: "Too many inputs detected",
    uk: "Виявлено забагато натискань"
  },
  spamWarningMessage: {
    en: "Please avoid repeated key presses during the test. Spamming can distort reaction-time measurements and produce incorrect results. Start the test again when you are ready to continue.",
    uk: "Будь ласка, уникайте повторних натискань під час тесту. Спам може спотворити вимірювання часу реакції та призвести до некоректних результатів. Розпочніть тест знову, коли будете готові продовжити."
  },
  spamWarningStartAgainButton: {
    en: "Start Test Again",
    uk: "Почати тест знову"
  },
  testScreenTestCompleteMessage: {
    en: "Congratulations! You have completed the test.",
    uk: "Вітаємо! Ви завершили тест."
  },

  // stats
  noReactionTimes: {en: "No Reaction Times", uk: "Немає результатів реакції"},
  testResultsTitle: {en: "Test Results", uk: "Результати тесту"},
  frequencyDistributionTitle: {en: "Frequency Distribution", uk: "Частотний Розподіл"},
  statLeftHand: {en: "Left Hand", uk: "Ліва рука"},
  statRightHand: {en: "Right Hand", uk: "Права рука"},
  dontSaveAndQuit: {en: "Don't Save and Quite", uk: "Не зберігати"},
  saveResults: {en: "Save", uk: "Зберегти"},

  statFunctionalLevel: {en: "SFL", uk: "ФРС"},
  statReactionStability: {en: "RS", uk: "СР"},
  statFunctionalCapabilities: {en: "FCL", uk: "РФМ"},
  statErrorsTotal: {en: "Errors Total", uk: "Помилок Всього"},
  statErrorsPercentage: {en: "Error Rate", uk: "Частота Помилок"},
  trialOutcomeMiss: {en: "Miss", uk: "Пропуск"},
  trialOutcomeFalseAlarm: {en: "False Alarm", uk: "Хибна реакція"},
  trialOutcomeFalseStart: {en: "False Start", uk: "Передчасна реакція"},
  trialOutcomeMixUp: {en: "Wrong Action", uk: "Неправильна дія"},
  trialOutcomeCorrectRejection: {en: "Correct Rejection", uk: "Правильне ігнорування"},
  statCount: {en: "Count 🧮", uk: "Кількість 🧮"},
  statMean: {en: "μ Mean", uk: "μ Мат. сподівання"},
  statMode: {en: "Mo Mode", uk: "Mo Мода"},
  statStdDev: {en: "σ Std Dev", uk: "σ Сер. Квадр. Відхилення"},
  statCV: {en: "Coefficient of Variation", uk: "Коефіцієнт Варіації"},
  statEntropy: {en: "Shannon Entropy", uk: "Ентропія Шеннона"},
  bits: {en: "bits", uk: "біти"},
  statP50: {en: "↗ p50", uk: "↗ p50"},
  statP90: {en: "↗ p90", uk: "↗ p90"},

  usePregeneratedDelay: {en: "Use pregenerated exposure delays", uk: "Використовувати заздалегідь визначені затримки експозиції"},
  usePregeneratedStimuli: {en: "Use pregenerated stimulus sequence", uk: "Використовувати заздалегідь визначену послідовність стимулів"},

  binMs: {en: "Bin (ms)", uk: "Інтервали (мс)"},
  frequency: {en: "Frequency", uk: "Частота"},

  // user-profile-screen
  // Test Card Localization
  testCardTitle: {en: "Test", uk: "Тест"},
  testSettingLabel: {en: "Test Setting", uk: "Налаштування Тесту"},
  testSettingValueLabel: {en: "Value", uk: "Значення"},
  statLabel: {en: "Stat", uk: "Статистика"},
  valueLabel: {en: "Value", uk: "Значення"},
  countLabel: {en: "Count", uk: "Кількість"},
  meanLabel: {en: "Mean", uk: "Середнє"},
  statisticalModeLabel: {en: "Statistical mode", uk: "Статистична мода"},
  stdevLabel: {en: "Std. Deviation", uk: "Стандартне Відхилення"},
  cvLabel: {en: "Coefficient of Variation", uk: "Коефіцієнт Варіації"},
  entropyLabel: {en: "Shannon Entropy", uk: "Ентропія Шеннона"},
  stimulusSizeLabel: {en: "Stimulus Size", uk: "Розмір подразника"},
  exposureDelayMinMaxLabel: {en: "Exposure Delay (min-max)", uk: "Затримка експозиції (мін-макс)"},
  testTypeLabel: {en: "Test Type", uk: "Тип тесту"},
  medianLabel: {en: "P50 (Median)", uk: "П50 (Медіана)"},
  p90Label: {en: "P90", uk: "П90"},
  p97Label: {en: "P97", uk: "П97"},
  backToMainPage: {en: "Back to Main Page", uk: "На головну"},
  printButton: {en: "Print", uk: "Друк"},
  printReportTitle: {en: "Test Results Report", uk: "Звіт про результати тестування"},
  printReportDate: {en: "Report Date", uk: "Дата звіту"},

  // user-profiles-screen
  viewProfileButton: {en: "View Profile", uk: "Відкрити профіль"},
  deleteButton: {en: "Delete", uk: "Видалити"},
  deleteConfirmation: {
    en: "Are you sure you want to delete user %s? This will also delete all associated test records.",
    uk: "Ви впевнені, що хочете видалити користувача %s? Це також видалить усі пов'язані записи тестів."
  },
  deleteError: {en: "An error occurred during user deletion. Please try again.", uk: "Сталася помилка під час видалення користувача. Спробуйте ще раз."}

};


type LocalizationVars = { randomWords: { en: readonly string[]; uk: readonly string[] } }
type LanguageKey = "uk" | "en"

export function getLocalizedVar(key: keyof LocalizationVars): readonly string[] {
  const currentLanguage = LanguageManager.getCurrentLanguage();

  const lang = currentLanguage as LanguageKey || settings.default.language as LanguageKey;
  const result = localizationVars[key]?.[lang] || localizationVars[key]?.[lang];
  if (!result) {
    throw new Error(`Unknown language key: ${key}`);
  }
  return result;
}

const localizationVars: LocalizationVars = {
  randomWords: {
    en: WORD_SEQUENCE_EN,
    uk: WORD_SEQUENCE_UA,
  }
}
