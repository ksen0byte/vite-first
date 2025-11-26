import {settings} from "../config/settings.ts";
import {LanguageManager} from "./LanguageManager.ts";
import katex from 'katex';

export function updateLanguageUI(): void {
  const localizableElements = document.querySelectorAll<HTMLElement>("[data-localize]");
  localizableElements.forEach((element) => {
    const key = element.dataset.localize!;
    const textContent = localize(key);
    if (element.tagName === "INPUT") {
      element.setAttribute("placeholder", textContent);
    } else {
      element.textContent = textContent;
    }
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
  male: {en: "Male", uk: "Чоловіча"},
  female: {en: "Female", uk: "Жіноча"},
  savedTestsBtnLabel: {en: "Saved Tests", uk: "Збережені Тести"},

  // dashboard
  dashboardHeaderTitle: {en: "Tools and Services", uk: "Інструменти та сервіси"},
  dashboardReactionDesc: {
    en: "Classic simple visual-motor reaction test to measure CNS functional state.",
    uk: "Класичний тест простої зорово-моторної реакції для оцінки функціонального стану ЦНС."
  },
  dashboardBioAgeDesc: {
    en: "Calculate Biological Age using a known mean reaction time.",
    uk: "Розрахуйте біологічний вік за відомим середнім часом реакції."
  },
  dashboardProfilesDesc: {
    en: "Manage user profiles and view saved tests.",
    uk: "Керуйте профілями користувачів та переглядайте збережені тести."
  },
  open: {en: "Open", uk: "Відкрити"},

  // units
  mm: {en: "mm", uk: "мм"},
  ms: {en: "ms", uk: "мс"},
  s: {en: "s", uk: "с"},

  // Test mode
  testModeLabel: {en: "Test Mode", uk: "Вид Подразника"},
  shapesOption: {en: "🔴 Geometrical Shapes", uk: "🔴 Геометричні Фігури"},
  shapeSizeSliderLabel: {en: "Shape Size", uk: "Розмір фігури"},
  wordsOption: {en: "🔤 Words", uk: "🔤 Слова"},
  wordSizeSliderLabel: {en: "Word Size", uk: "Розмір слова"},
  wordPreviewWord: {en: "Love", uk: "Любов"},
  syllablesOption: {en: "🆎 Random Syllables", uk: "🆎 Беззмістовні Склади"},
  syllableSizeSliderLabel: {en: "Syllable Size", uk: "Розмір складу"},
  syllablePreviewSyllable: {en: "Mo", uk: "Ма"},
  fontSizeSliderLabel: {en: "Font Size", uk: "Розмір шрифту"},

  // Test settings
  generalSettingsTitle: {en: "Test Settings", uk: "Налаштування тесту"},
  exposureTimeLabel: {en: "Stimulus Exposure", uk: "Експозиція подразника"},
  exposureDelayLabel: {en: "Stimulus Exposure Delay", uk: "Затримка експозиції"},
  exposureDelayHint: {en: "Delay is picked randomly between min and max.", uk: "З цього діапазону випадково обирається затримка."},
  stimulusCountLabel: {en: "Number of Stimuli", uk: "Кількість подразників"},

  // Footer
  resetSettings: {en: "Reset Settings", uk: "Скинути налаштування"},
  startTest: {en: "Start Test", uk: "Розпочати Тест"},
  back: {en: "Back", uk: "Назад"},
  next: {en: "Next", uk: "Далі"},
  saveAndStart: {en: "Save & Start", uk: "Зберегти та Розпочати Тест"},
  exportData: {en: "Export Data", uk: "Експорт Даних"},
  exportAllData: {en: "Export All Users Data", uk: "Експорт Даних Всіх Користувачів"},
  importAllData: {en: "Import Data", uk: "Імпорт Даних"},
  importSuccess: {en: "Import completed: %u users, %t tests.", uk: "Імпорт завершено: %u користувачів, %t тестів."},
  importError: {en: "Error importing data. Please check the file and try again.", uk: "Помилка імпорту даних. Перевірте файл і спробуйте ще раз."},

  // Test Type
  selectTestType: {en: "Select Test Type", uk: "Оберіть тип тестування"},
  testTypePzmrShort: {en: "SVMR", uk: "ПЗМР"},
  testTypeRV13Short: {en: "SR1-3", uk: "РВ1-3"},
  testTypeRV23Short: {en: "SR2-3", uk: "РВ2-3"},
  testTypePzmrLong: {en: "Simple visual-motor reaction", uk: "Проста зорово-моторна реакція"},
  testTypeRV13Long: {en: "Reaction to the choice of one out of three signals", uk: "Реакція вибору одного із трьох сигналів"},
  testTypeRV23Long: {en: "Reaction to the choice of two out of three signals", uk: "Реакція вибору двох із трьох сигналів"},

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
  headingBiologicalAgeFormulasUsed: { en: "Formulas Used", uk: "Використані формули" },
  headingBiologicalAgeTempoInterpretation: { en: "Interpretation of TBD", uk: "Інтерпретація ТБР" },

  // --- VARIABLE DESCRIPTIONS ---
  // Actual SR
  variableActualSensorimotorReaction: { en: "\\text{SR}_{act}", uk: "СР_ф" },
  descriptionActualSensorimotorReaction: { en: "Actual Sensorimotor Reaction", uk: "Фактичне значення сенсомоторного реагування" },

  // Normative SR
  variableNormativeSensorimotorReaction: { en: "\\text{SR}_{norm}", uk: "СР_т" },
  descriptionNormativeSensorimotorReaction: { en: "Normative Sensorimotor Reaction", uk: "Табличне належне значення сенсомоторного реагування" },

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
  conditionBiologicalAgeAcceleratedDevelopment: { en: "TBD < 0.95", uk: "ТБР < 0.95" },
  conditionBiologicalAgeNormalDevelopment: { en: "0.95 ≤ TBD ≤ 1.10", uk: "0.95 ≤ ТБР ≤ 1.10" },
  conditionBiologicalAgeDelayedDevelopment: { en: "TBD > 1.10", uk: "ТБР > 1.10" },

  // --- INTERPRETATION DESCRIPTIONS (Human readable text) ---
  descriptionBiologicalAgeAcceleratedDevelopment: { en: "Accelerated development", uk: "Розвиток прискорений" },
  descriptionBiologicalAgeNormalDevelopment: { en: "Normal development", uk: "Розвиток у нормі" },
  descriptionBiologicalAgeDelayedDevelopment: { en: "Delayed development", uk: "Розвиток уповільнений" },


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
  testScreenTestSpamModalTitle: {
    en: "Attention!",
    uk: "Увага!"
  },
  testScreenTestSpamModalMessage: {
    en: "Please avoid repetitive actions as it may lead to incorrect test results. The test will be restarted.",
    uk: "Будь ласка, уникайте повторюваних дій, оскільки це може призвести до некоректних результатів тесту. Тест буде перезапущено з початку."
  },
  testScreenTestCompleteMessage: {
    en: "Congratulations! You have completed the test.",
    uk: "Вітаємо! Ви завершили тест."
  },

  // stats
  noReactionTimes: {en: "No Reaction Times", uk: "Немає результатів реакції"},
  testResultsTitle: {en: "Test Results", uk: "Результати тесту"},
  frequencyDistributionTitle: {en: "Frequency Distribution", uk: "Частотний Розподіл"},
  dontSaveAndQuit: {en: "Don't Save and Quite", uk: "Не зберігати"},
  saveResults: {en: "Save", uk: "Зберегти"},

  statFunctionalLevel: {en: "SFL", uk: "ФРС"},
  statReactionStability: {en: "RS", uk: "СР"},
  statFunctionalCapabilities: {en: "FCL", uk: "РФМ"},
  statCount: {en: "Count 🧮", uk: "Кількість 🧮"},
  statMean: {en: "μ Mean", uk: "μ Мат. сподівання"},
  statMode: {en: "Mo Mode", uk: "Mo Мода"},
  statVariance: {en: "σ² Variance", uk: "σ² Дисперсія"},
  statStdDev: {en: "σ Std Dev", uk: "σ Сер. Квадр. Відхилення"},
  statCV: {en: "Coefficient of Variation", uk: "Коефіцієнт Варіації"},
  statEntropy: {en: "Shannon Entropy", uk: "Ентропія Шеннона"},
  bits: {en: "bits", uk: "біти"},
  statRange: {en: "↕ Range", uk: "↕ Розмах"},
  statP3: {en: "↗ p3", uk: "↗ p3"},
  statP10: {en: "↗ p10", uk: "↗ p10"},
  statP25: {en: "↗ p25", uk: "↗ p25"},
  statP50: {en: "↗ p50", uk: "↗ p50"},
  statP75: {en: "↗ p75", uk: "↗ p75"},
  statP90: {en: "↗ p90", uk: "↗ p90"},
  statP97: {en: "↗ p97", uk: "↗ p97"},

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
  modeLabel: {en: "Mode", uk: "Мода"},
  stdevLabel: {en: "Std. Deviation", uk: "Стандартне Відхилення"},
  cvLabel: {en: "Coefficient of Variation", uk: "Коефіцієнт Варіації"},
  entropyLabel: {en: "Shannon Entropy", uk: "Ентропія Шеннона"},
  minLabel: {en: "Min", uk: "Мінімум"},
  maxLabel: {en: "Max", uk: "Максимум"},
  stimulusSizeLabel: {en: "Stimulus Size", uk: "Розмір Подразника"},
  exposureDelayMinMaxLabel: {en: "Exposure Delay (min-max)", uk: "Затримка Експозиції (мін-макс)"},
  testTypeLabel: {en: "Test Type", uk: "Тип Тесту"},
  p3Label: {en: "P3", uk: "П3"},
  p10Label: {en: "P10", uk: "П10"},
  p25Label: {en: "P25", uk: "П25"},
  medianLabel: {en: "P50 (Median)", uk: "П50 (Медіана)"},
  p75Label: {en: "P75", uk: "П75"},
  p90Label: {en: "P90", uk: "П90"},
  p97Label: {en: "P97", uk: "П97"},
  backToMainPage: {en: "Back to Main Page", uk: "На головну"},

  // user-profiles-screen
  viewProfileButton: {en: "View Profile", uk: "Відкрити профіль"},
  deleteButton: {en: "Delete", uk: "Видалити"},
  deleteConfirmation: {
    en: "Are you sure you want to delete user %s? This will also delete all associated test records.",
    uk: "Ви впевнені, що хочете видалити користувача %s? Це також видалить усі пов'язані записи тестів."
  },
  deleteError: {en: "An error occurred during user deletion. Please try again.", uk: "Сталася помилка під час видалення користувача. Спробуйте ще раз."}

};


type LocalizationVars = { randomWords: { en: string[]; uk: string[] }; randomSyllables: { en: string[]; uk: string[] } }
type LanguageKey = "uk" | "en"

export function getLocalizedVar(key: keyof LocalizationVars): string[] {
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
    en: ["bean", "beech", "bull", "water", "wolf", "elm", "weight", "mountain", "house", "oak", "hedgehog", "spruce", "hare", "willow", "cedar", "maple", "key", "goat", "horse", "cat", "tap", "mole", "lion", "flax", "linden", "fox", "poppy", "sword", "moss", "ball", "knife", "oats", "window", "donkey", "glasses", "feather", "belt", "bullet", "rose", "elephant", "salt", "soy", "table", "chair", "tiger",],
    uk: ["біб", "бук", "бик", "вода", "вовк", "в'яз", "гиря", "гора", "будинок", "дуб", "їжак", "ялина", "заєць", "верба", "кедр", "клен", "ключ", "коза", "кінь", "кіт", "кран", "кріт", "лев", "льон", "липа", "лисиця", "мак", "меч", "мох", "м'яч", "ніж", "овес", "вікно", "осел", "окуляри", "перо", "пояс", "куля", "троянда", "слон", "сіль", "соя", "стіл", "стілець", "тигр",],
  },
  randomSyllables: {
    en: ["ze", "te", "da", "ko", "je", "ya", "na", "ju", "hu", "si", "le", "de", "yo", "mo", "wa", "ye", "wo", "so", "ja", "tu", "hi", "me", "pi", "ro", "li", "ca", "bo", "vu", "bu", "ge", "mu", "yu", "ta", "cu", "lu", "vi", "su", "mi", "za", "po", "do", "du", "he", "se", "pa"],
    uk: ["па", "шу", "фе", "фо", "ме", "та", "со", "ра", "ка", "гу", "хо", "жу", "жа", "по", "во", "ча", "ро", "ву", "вa", "ре", "ві", "бу", "ша", "ле", "пу", "ді", "рі", "шо", "са", "ке", "ні", "кі", "но", "ла", "мо", "га", "го", "жі", "ко", "хі", "ці", "ші", "чо", "бі", "же"],
  }
}
