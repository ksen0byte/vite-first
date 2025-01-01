import {setupSettingsScreen} from "./settings-screen";
import {setupLanguageToggle, updateLanguageUI} from "./ui";

// Initialize the UI
updateLanguageUI();
setupLanguageToggle("language-toggle");
setupSettingsScreen("settings-screen");
