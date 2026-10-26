import {settings} from "../config/settings.ts";
import {features} from '../config/features.ts';

export const LanguageManager = (() => {
  const LANGUAGE_KEY = "selectedLanguage";

  // Retrieve the current language from localStorage or use the default
  let currentLanguage = localStorage.getItem(LANGUAGE_KEY) || settings.default.language;

  function getCurrentLanguage(): string {
    return features.languageSwitching ? currentLanguage : settings.default.language;
  }

  function setCurrentLanguage(language: string): void {
    if (!features.languageSwitching) return;
    currentLanguage = language;
    localStorage.setItem(LANGUAGE_KEY, language);
  }

  return {
    getCurrentLanguage,
    setCurrentLanguage,
  };
})();
