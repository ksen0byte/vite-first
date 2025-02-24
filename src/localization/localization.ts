import {settings} from "../config/settings.ts";
import {LanguageManager} from "./LanguageManager.ts";

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
}

type LocalizationKeys = {
  [key: string]: { [language: string]: string };
};

export function localize(key: string): string {
  const currentLanguage = LanguageManager.getCurrentLanguage();
  return localization[key]?.[currentLanguage] || localization[key]?.[settings.default.language] || key;
}

const localization: LocalizationKeys = {
  switchLanguage: {en: "UA", uk: "EN"},
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
  allTestsBtnLabel: {en: "All Tests", uk: "Усі тести"},

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

  // Test Type
  selectTestType: {en: "Select Test Type", uk: "Оберіть тип тестування"},
  testTypePzmrShort: {en: "SVMR", uk: "ПЗМР"},
  testTypeRV13Short: {en: "SR1-3", uk: "РВ1-3"},
  testTypeRV23Short: {en: "SR2-3", uk: "РВ2-3"},
  testTypePzmrLong: {en: "Simple visual-motor reaction", uk: "Проста зорово-моторна реакція"},
  testTypeRV13Long: {en: "Reaction to the choice of one out of three signals", uk: "Реакція вибору одного із трьох сигналів"},
  testTypeRV23Long: {en: "Reaction to the choice of two out of three signals", uk: "Реакція вибору двох із трьох сигналів"},

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

  // stats
  noReactionTimes: { en: "No Reaction Times", uk: "Немає результатів реакції" },
  testResultsTitle: { en: "Test Results", uk: "Результати тесту" },
  frequencyDistributionTitle: { en: "Frequency Distribution", uk: "Частотний Розподіл" },
  dontSaveAndQuit: { en: "Don't Save and Quite", uk: "Не зберігати" },
  saveResults: { en: "Save", uk: "Зберегти" },

  statFunctionalLevel: { en: "SFL", uk: "ФРС" },
  statReactionStability: { en: "RS", uk: "СР" },
  statFunctionalCapabilities: { en: "FCL", uk: "РФМ" },
  statCount: { en: "Count 🧮", uk: "Кількість 🧮" },
  statMean: { en: "μ Mean", uk: "μ Мат. сподівання" },
  statMode: { en: "Mo Mode", uk: "Mo Мода" },
  statVariance: { en: "σ² Variance", uk: "σ² Дисперсія" },
  statStdDev: { en: "σ Std Dev", uk: "σ Сер. Квадр. Відхилення" },
  statRange: { en: "↕ Range", uk: "↕ Розмах" },
  statP3: { en: "↗ p3", uk: "↗ p3" },
  statP10: { en: "↗ p10", uk: "↗ p10" },
  statP25: { en: "↗ p25", uk: "↗ p25" },
  statP50: { en: "↗ p50", uk: "↗ p50" },
  statP75: { en: "↗ p75", uk: "↗ p75" },
  statP90: { en: "↗ p90", uk: "↗ p90" },
  statP97: { en: "↗ p97", uk: "↗ p97" },

  binMs: { en: "Bin (ms)", uk: "Інтервали (мс)" },
  frequency: { en: "Frequency", uk: "Частота" },

  // user-profile-screen
  // Test Card Localization
  testCardTitle: { en: "Test", uk: "Тест" },
  testSettingLabel: { en: "Test Setting", uk: "Налаштування Тесту" },
  testSettingValueLabel: { en: "Value", uk: "Значення" },
  statLabel: { en: "Stat", uk: "Статистика" },
  valueLabel: { en: "Value", uk: "Значення" },
  countLabel: { en: "Count", uk: "Кількість" },
  meanLabel: { en: "Mean", uk: "Середнє" },
  modeLabel: { en: "Mode", uk: "Мода" },
  stdevLabel: { en: "Std. Deviation", uk: "Стандартне Відхилення" },
  minLabel: { en: "Min", uk: "Мінімум" },
  maxLabel: { en: "Max", uk: "Максимум" },
  stimulusSizeLabel: { en: "Stimulus Size", uk: "Розмір Подразника" },
  exposureDelayMinMaxLabel: { en: "Exposure Delay (min-max)", uk: "Затримка Експозиції (мін-макс)" },
  testTypeLabel: { en: "Test Type", uk: "Тип Тесту" },
  p3Label: { en: "P3", uk: "П3" },
  p10Label: { en: "P10", uk: "П10" },
  p25Label: { en: "P25", uk: "П25" },
  medianLabel: { en: "P50 (Median)", uk: "П50 (Медіана)" },
  p75Label: { en: "P75", uk: "П75" },
  p90Label: { en: "P90", uk: "П90" },
  p97Label: { en: "P97", uk: "П97" },
  backToMainPage: { en: "Back to Main Page", uk: "На головну" },

  // user-profiles-screen
  viewProfileButton: { en: "View Profile", uk: "Відкрити профіль" }

};


type LocalizationVars = { randomWords: { en: string[]; uk: string[] }; randomSyllables: { en: string[]; uk: string[] } }
type LanguageKey = "uk" | "en"
export function getLocalizedVar(key: keyof LocalizationVars): string[]{
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
