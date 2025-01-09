import {setupSettingsScreen} from "./screens/settings-screen.ts";
import {updateLanguageUI} from "./localization/localization.ts";

// Initialize the UI
// setupLanguageToggle("language-toggle");
const appContainer = document.getElementById("app")!;
setupSettingsScreen(appContainer);
updateLanguageUI();
