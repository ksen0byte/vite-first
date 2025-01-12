import {settings} from "../config/settings.ts";

const LANGUAGE_KEY = "selectedLanguage";
// Load the language from localStorage or fall back to the default
let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || settings.default.language;

export function updateLanguageUI(): void {
  const localizableElements = document.querySelectorAll<HTMLElement>("[data-localize]");
  localizableElements.forEach((element) => {
    const key = element.dataset.localize!;
    element.textContent = localize(key);
  });
  const localizableAddElements = document.querySelectorAll<HTMLElement>("[data-localize-add]");
  localizableAddElements.forEach((element) => {
    const key = element.dataset.localizeAdd!;
    element.textContent = element.textContent + localize(key);
  });

}

export function setupLanguageToggle(buttonId: string) {
  const languageToggleButton = document.querySelector<HTMLButtonElement>(`#${buttonId}`)!;
  languageToggleButton?.addEventListener("click", () => {
    currentLanguage = currentLanguage === "en" ? "uk" : "en";
    localStorage.setItem(LANGUAGE_KEY, currentLanguage);
    updateLanguageUI();
  });
}


type LocalizationKeys = {
  [key: string]: { [language: string]: string };
};

export function localize(key: string): string {
  return localization[key]?.[currentLanguage] || localization[key]?.[settings.default.language] || key;
}

const localization: LocalizationKeys = {
  switchLanguage: {en: "UA", uk: "EN"},
  // settings screen
  appTitle: {en: "Assessment of Human CNS Functional State", uk: "Визначення функціонального стану ЦНС людини"},
  personalDataTitle: {en: "Personal Data", uk: "Персональні Дані"},
  nameLabel: {en: "Name:", uk: "Ім’я:"},
  surnameLabel: {en: "Surname:", uk: "Прізвище:"},
  ageLabel: {en: "Age:", uk: "Вік:"},
  genderLabel: {en: "Gender:", uk: "Стать:"},
  selectGender: {en: "Select Gender", uk: "Оберіть стать"},
  male: {en: "Male", uk: "Чоловіча"},
  female: {en: "Female", uk: "Жіноча"},

  // units
  mm: {en: "mm", uk: "мм"},
  ms: {en: "ms", uk: "мс"},

  // Test mode
  chooseTestMode: {en: "Test Mode", uk: "Вид Подразника"},
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
  testTypePzmrLong: {en: "Simple visual-motor reaction", uk: "Проста зорово-моторна реакції"},
  testTypeRV13Long: {en: "Reaction to the choice of one out of three signals", uk: "Реакція вибору одного із трьох сигналів"},
  testTypeRV23Long: {en: "Reaction to the choice of two out of three signals", uk: "Реакція вибору двох із трьох сигналів"},

  // begin test screen
  testSettingsSummaryFirstName: {en: "First Name", uk: "Ім’я"},
  testSettingsSummaryLastName: {en: "Last Name", uk: "Прізвище"},
  testSettingsSummaryGender: {en: "Gender", uk: "Стать"},
  testSettingsSummaryAge: {en: "Age", uk: "Вік"},
  testSettingsSummaryTestMode: {en: "Test Mode", uk: "Вид подразника"},
  testSettingsSummaryStimulusSize: {en: "Stimulus Size", uk: "Розмір подразника"},
  testSettingsSummaryExposureTime: {en: "Exposure Time", uk: "Експозиція подразника"},
  testSettingsSummaryExposureDelay: {en: "Exposure Delay", uk: "Затримка експозиції"},
  testSettingsSummaryStimulusCount: {en: "Stimulus Count", uk: "Кількість подразників"},
  testSettingsSummaryTestType: {en: "Test Type", uk: "Тип тестування"},

  // test screen
  testScreenTestStart: {en:"Start!", uk: "Старт!"},

};