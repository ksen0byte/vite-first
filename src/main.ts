import {setupSettingsScreen} from "./screens/settings-screen.ts";
import {setupLanguageToggle, updateLanguageUI} from "./localization/localization.ts";

// Initialize the UI
updateLanguageUI();
setupLanguageToggle("language-toggle");
setupSettingsScreen("settings-screen");
