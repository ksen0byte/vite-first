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
  genderLabel: { en: "Gender:", uk: "Стать:" },
  male: { en: "Male", uk: "Чоловіча" },
  female: { en: "Female", uk: "Жіноча" },

  // Test mode
  chooseTestMode: {en: "Test Mode", uk: "Вид Подразника"},
  shapesOption: {en: "Geometrical Shapes", uk: "Геометричні Фігури"},
  shapeSizeSliderLabel: { en: "Shape Size (mm):", uk: "Розмір фігури (мм):" },
  wordsOption: {en: "Words", uk: "Слова"},
  syllablesOption: {en: "Random Syllables", uk: "Беззмістовні Склади"},
  fontSizeSliderLabel: { en: "Font Size (mm):", uk: "Розмір шрифту (мм):" },

  // Test settings
  generalSettingsTitle: { en: "Test Settings", uk: "Налаштування тесту" },
  exposureTimeLabel: { en: "Stimulus Exposure (ms):", uk: "Експозиція подразника (мс):" },
  exposureDelayLabel: { en: "Stimulus Delay (ms):", uk: "Затримка перед показом (мс):" },
  exposureDelayHint: { en: "Delay is picked randomly between min and max.", uk: "З цього діапазону випадково обирається затримка." },
  stimulusCountLabel: { en: "Number of Stimuli:", uk: "Кількість подразників:" },

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
