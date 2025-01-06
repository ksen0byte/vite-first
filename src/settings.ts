type LocalizationKeys = {
  [key: string]: { [language: string]: string };
};

export const localization: LocalizationKeys = {
  switchLanguage: {en: "UA", uk: "EN"},
  // settings screen
  appTitle: { en: "Assessment of Human CNS Functional State", uk: "Визначення функціонального стану ЦНС людини" },
  personalDataTitle: { en: "Personal Data", uk: "Персональні Дані" },
  nameLabel: { en: "Name:", uk: "Ім’я:" },
  surnameLabel: { en: "Surname:", uk: "Прізвище:" },
  ageLabel: { en: "Age:", uk: "Вік:" },
  genderLabel: { en: "Gender:", uk: "Стать:" },
  male: { en: "Male", uk: "Чоловіча" },
  female: { en: "Female", uk: "Жіноча" },

  // Test mode
  chooseTestMode: {en: "Test Mode", uk: "Вид Подразника"},
  shapesOption: {en: "🔴 Geometrical Shapes", uk: "🔴 Геометричні Фігури"},
  shapeSizeSliderLabel: { en: "Shape Size", uk: "Розмір фігури" },
  wordsOption: {en: "🔤 Words", uk: "🔤 Слова"},
  wordSizeSliderLabel: { en: "Word Size", uk: "Розмір слова" },
  wordPreviewWord: { en: "Love", uk: "Любов" },
  syllablesOption: {en: "🆎 Random Syllables", uk: "🆎 Беззмістовні Склади"},
  syllableSizeSliderLabel: { en: "Syllable Size", uk: "Розмір складу" },
  syllablePreviewSyllable: { en: "Mo", uk: "Ма" },
  fontSizeSliderLabel: { en: "Font Size", uk: "Розмір шрифту" },

  // Test settings
  generalSettingsTitle: { en: "Test Settings", uk: "Налаштування тесту" },
  exposureTimeLabel: { en: "Stimulus Exposure", uk: "Експозиція подразника" },
  exposureDelayLabel: { en: "Stimulus Exposure Delay", uk: "Затримка перед показом" },
  exposureDelayHint: { en: "Delay is picked randomly between min and max.", uk: "З цього діапазону випадково обирається затримка." },
  stimulusCountLabel: { en: "Number of Stimuli", uk: "Кількість подразників" },

  // Footer
  resetSettings: { en: "Reset Settings", uk: "Скинути налаштування" },
  startTest: {en: "Start Test", uk: "Розпочати Тест"},
  saveAndStart: { en: "Save & Start", uk: "Зберегти та Розпочати Тест" },
};

export const testSettings = {
  defaultOption: "shapes",
  testModes: ["shapes", "words", "syllables"],
  defaultLanguage: "en",
};
