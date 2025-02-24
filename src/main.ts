import {setupSettingsScreen} from "./screens/settings-screen.ts";
import {updateLanguageUI} from "./localization/localization.ts";

const appContainer = document.getElementById("app")!;
setupSettingsScreen(appContainer);
updateLanguageUI();
