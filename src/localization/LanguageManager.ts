import {settings} from "../config/settings.ts";

export const LanguageManager = (() => {
  const LANGUAGE_KEY = "selectedLanguage";

  // Retrieve the current language from localStorage or use the default
  let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || settings.default.language;

  function getCurrentLanguage(): string {
    return currentLanguage;
  }

  function setCurrentLanguage(language: string): void {
    currentLanguage = language;
    localStorage.setItem(LANGUAGE_KEY, language);
  }

  return {
    getCurrentLanguage,
    setCurrentLanguage,
  };
})();