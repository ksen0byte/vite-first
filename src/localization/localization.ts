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

  const instructionElements = document.querySelectorAll<HTMLElement>("[data-instruction-task][data-instruction-protocol]");
  instructionElements.forEach((element) => {
    element.innerHTML = `${localize(element.dataset.instructionTask!)}${localize(element.dataset.instructionProtocol!)}`;
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
  previewAdaptationState: {en: "adapt", uk: "адаптація"},
  statMinExposure: {en: "Minimum exposure reached", uk: "Досягнута мінімальна експозиція"},
  statMinExposureTrial: {en: "Minimum exposure reached after trial", uk: "Мінімальної експозиції досягнуто після спроби"},
  statStimuliProcessed: {en: "Stimuli processed", uk: "Опрацьовано подразників"},
  exposureCurveTitle: {en: "Exposure dynamics", uk: "Динаміка експозиції"},
  units: {en: "pcs", uk: "од."},
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
    en: "<p>When <b>any stimulus</b> appears on the screen, press <kbd class='kbd'>Space</kbd> as quickly as possible.</p>",
    uk: "<p>Коли на екрані з'являється <b>будь-який подразник</b>, якнайшвидше натискайте клавішу <kbd class='kbd'>Пробіл</kbd>.</p>"
  },
  instructionOptimal: {
    en: "<p>Respond as quickly and accurately as possible. If you make a mistake or miss a stimulus, do not stop; refocus and continue following the rules.</p><p>Continue until the <b>TEST FINISHED</b> message appears.</p>",
    uk: "<p>Відповідайте якомога швидше й точніше. Якщо Ви помилилися або пропустили подразник, не зупиняйтеся: зосередьтеся та продовжуйте виконувати завдання за правилами.</p><p>Виконуйте тест до появи напису <b>ТЕСТ ЗАВЕРШЕНО</b>.</p>"
  },
  instructionFeedback: {
    en: "<p>After a correct response, the next stimulus is presented <b>faster</b>; after an error, it is presented <b>slower</b>. Your goal is to reach the highest presentation speed you can and maintain it for as long as possible.</p><p>A response given shortly after a stimulus disappears is still counted as correct and is not treated as an error. If you make a mistake or miss a stimulus, do not stop; refocus and continue following the rules.</p><p>Continue until the <b>TEST FINISHED</b> message appears.</p>",
    uk: "<p>Після правильної відповіді наступний подразник подається <b>швидше</b>, а після помилки — <b>повільніше</b>. Ваше завдання — вийти на максимально можливу швидкість подачі подразників і утримувати її якомога довше.</p><p>Відповідь, надана невдовзі після зникнення подразника, також зараховується як правильна й не вважається помилкою. Якщо Ви помилилися або пропустили подразник, не зупиняйтеся: зосередьтеся та продовжуйте виконувати завдання за правилами.</p><p>Виконуйте тест до появи напису <b>ТЕСТ ЗАВЕРШЕНО</b>.</p>"
  },
  // en: "Press the <kbd class='kbd'>Space</kbd> key as quickly as possible when a target stimulus (Red, Square, or Animal) appears. Ignore other stimuli.",
  // uk: "Натискайте клавішу <kbd class='kbd'>Пробіл</kbd> якнайшвидше, коли з'явиться цільовий подразник (Червоний, Квадрат або Тварина). Ігноруйте інші подразники."
  instructionCRT13_shapes: {
    en: "<p>When a <b>square</b> appears, press <kbd class='kbd'>Space</kbd> as quickly as possible. Do not press anything for a circle or triangle.</p>",
    uk: "<p>Коли з'являється <b>квадрат</b>, якнайшвидше натискайте клавішу <kbd class='kbd'>Пробіл</kbd>. Коли з'являється коло або трикутник, нічого не натискайте.</p>"
  },
  instructionCRT13_words: {
    en: "<p>When an <b>animal</b> word appears, press <kbd class='kbd'>Space</kbd> as quickly as possible. Do not press anything for plant or non-living-object words.</p>",
    uk: "<p>Коли з'являється слово, що позначає <b>тварину</b>, якнайшвидше натискайте клавішу <kbd class='kbd'>Пробіл</kbd>. Для слів, що позначають рослини або неживі предмети, нічого не натискайте.</p>"
  },
  instructionCRT13_colors: {
    en: "<p>When a <b>red</b> stimulus appears, press <kbd class='kbd'>Space</kbd> as quickly as possible. Do not press anything for green or yellow stimuli.</p>",
    uk: "<p>Коли з'являється <b>червоний</b> подразник, якнайшвидше натискайте клавішу <kbd class='kbd'>Пробіл</kbd>. Для зелених і жовтих подразників нічого не натискайте.</p>"
  },
  instructionCRT13_combined: {
    en: "<p>Press <kbd class='kbd'>Space</kbd> as quickly as possible when the stimulus is <b>red, a square, or an animal word</b>. Do not press anything when it is green, a circle, or a plant word, or when it is yellow, a triangle, or a non-living-object word.</p>",
    uk: "<p>Якнайшвидше натискайте клавішу <kbd class='kbd'>Пробіл</kbd>, якщо подразник є <b>червоним, квадратом або словом, що позначає тварину</b>. Нічого не натискайте, якщо це зелений колір, коло чи слово-назва рослини або жовтий колір, трикутник чи слово-назва неживого предмета.</p>"
  },
  instructionCRT23_shapes: {
    en: "<p>For a <b>circle</b>, press a left-hand key (<kbd class='kbd'>←</kbd>, left <kbd class='kbd'>Shift</kbd>, or left <kbd class='kbd'>Ctrl</kbd>). For a <b>square</b>, press a right-hand key (<kbd class='kbd'>→</kbd>, right <kbd class='kbd'>Shift</kbd>, or right <kbd class='kbd'>Ctrl</kbd>). Press as quickly as possible. For a <b>triangle</b>, do not press anything.</p>",
    uk: "<p>Для <b>кола</b> натискайте клавішу лівою рукою: <kbd class='kbd'>←</kbd>, ліву <kbd class='kbd'>Shift</kbd> або ліву <kbd class='kbd'>Ctrl</kbd>. Для <b>квадрата</b> натискайте клавішу правою рукою: <kbd class='kbd'>→</kbd>, праву <kbd class='kbd'>Shift</kbd> або праву <kbd class='kbd'>Ctrl</kbd>. Реагуйте якнайшвидше. Для <b>трикутника</b> нічого не натискайте.</p>"
  },
  instructionCRT23_words: {
    en: "<p>For a <b>plant</b> word, press a left-hand key (<kbd class='kbd'>←</kbd>, left <kbd class='kbd'>Shift</kbd>, or left <kbd class='kbd'>Ctrl</kbd>). For an <b>animal</b> word, press a right-hand key (<kbd class='kbd'>→</kbd>, right <kbd class='kbd'>Shift</kbd>, or right <kbd class='kbd'>Ctrl</kbd>). Press as quickly as possible. For a <b>non-living-object</b> word, do not press anything.</p>",
    uk: "<p>Для слова, що позначає <b>рослину</b>, натискайте клавішу лівою рукою: <kbd class='kbd'>←</kbd>, ліву <kbd class='kbd'>Shift</kbd> або ліву <kbd class='kbd'>Ctrl</kbd>. Для слова, що позначає <b>тварину</b>, натискайте клавішу правою рукою: <kbd class='kbd'>→</kbd>, праву <kbd class='kbd'>Shift</kbd> або праву <kbd class='kbd'>Ctrl</kbd>. Реагуйте якнайшвидше. Для слова, що позначає <b>неживий предмет</b>, нічого не натискайте.</p>"
  },
  instructionCRT23_colors: {
    en: "<p>For a <b>green</b> stimulus, press a left-hand key (<kbd class='kbd'>←</kbd>, left <kbd class='kbd'>Shift</kbd>, or left <kbd class='kbd'>Ctrl</kbd>). For a <b>red</b> stimulus, press a right-hand key (<kbd class='kbd'>→</kbd>, right <kbd class='kbd'>Shift</kbd>, or right <kbd class='kbd'>Ctrl</kbd>). Press as quickly as possible. For a <b>yellow</b> stimulus, do not press anything.</p>",
    uk: "<p>Для <b>зеленого</b> подразника натискайте клавішу лівою рукою: <kbd class='kbd'>←</kbd>, ліву <kbd class='kbd'>Shift</kbd> або ліву <kbd class='kbd'>Ctrl</kbd>. Для <b>червоного</b> подразника натискайте клавішу правою рукою: <kbd class='kbd'>→</kbd>, праву <kbd class='kbd'>Shift</kbd> або праву <kbd class='kbd'>Ctrl</kbd>. Реагуйте якнайшвидше. Для <b>жовтого</b> подразника нічого не натискайте.</p>"
  },
  instructionCRT23_combined: {
    en: "<p>For <b>green, a circle, or a plant word</b>, press a left-hand key (<kbd class='kbd'>←</kbd>, left <kbd class='kbd'>Shift</kbd>, or left <kbd class='kbd'>Ctrl</kbd>). For <b>red, a square, or an animal word</b>, press a right-hand key (<kbd class='kbd'>→</kbd>, right <kbd class='kbd'>Shift</kbd>, or right <kbd class='kbd'>Ctrl</kbd>). Press as quickly as possible. For <b>yellow, a triangle, or a non-living-object word</b>, do not press anything.</p>",
    uk: "<p>Для <b>зеленого кольору, кола або слова-назви рослини</b> натискайте клавішу лівою рукою: <kbd class='kbd'>←</kbd>, ліву <kbd class='kbd'>Shift</kbd> або ліву <kbd class='kbd'>Ctrl</kbd>. Для <b>червоного кольору, квадрата або слова-назви тварини</b> натискайте клавішу правою рукою: <kbd class='kbd'>→</kbd>, праву <kbd class='kbd'>Shift</kbd> або праву <kbd class='kbd'>Ctrl</kbd>. Реагуйте якнайшвидше. Для <b>жовтого кольору, трикутника або слова-назви неживого предмета</b> нічого не натискайте.</p>"
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
  durationLabel: {en: "Duration", uk: "Тривалість"},
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
  dontSaveAndQuit: {en: "Don't Save and Quit", uk: "Не зберігати"},
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
  usePregeneratedDelayHint: {en: "Reuses the same delay order for every run.", uk: "Повторно використовує однаковий (табличний) порядок затримок для кожного запуску."},
  pregeneratedDelayActive: {en: "Using pregenerated delays", uk: "Використовуються заздалегідь визначені затримки"},
  usePregeneratedStimuli: {en: "Use pregenerated stimulus sequence", uk: "Використовувати заздалегідь визначену послідовність стимулів"},
  usePregeneratedStimuliHint: {en: "Reuses the same stimulus order for every run.", uk: "Повторно використовує однаковий (табличний) порядок стимулів для кожного запуску."},
  pregeneratedLabel: {en: "pregenerated", uk: "попередньо визначені"},

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
  statisticalModeLabel: {en: "Mode", uk: "Мода"},
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
