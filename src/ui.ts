import {localization, testSettings} from "./settings";

const LANGUAGE_KEY = "selectedLanguage";
// Load the language from localStorage or fall back to the default
let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || testSettings.defaultLanguage;

export function localize(key: string): string {
  return localization[key]?.[currentLanguage] || localization[key]?.[testSettings.defaultLanguage] || key;
}

export function updateLanguageUI(): void {
  const localizableElements = document.querySelectorAll<HTMLElement>("[data-localize]");
  localizableElements.forEach((element) => {
    const key = element.dataset.localize!;
    element.textContent = localize(key);
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
