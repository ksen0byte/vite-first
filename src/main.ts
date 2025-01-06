import {setupSettingsScreen} from "./settings-screen";
import {setupLanguageToggle, updateLanguageUI} from "./ui";

const inputChecks = document.querySelectorAll(".inputCheck") as NodeListOf<HTMLInputElement>;

inputChecks.forEach(inputCheck => {
    inputCheck.addEventListener("input", checking);
});

function checking(this: HTMLInputElement) {
    this.value = this.value.replace(/[^А-Яа-яЇїЄєІіҐґa-zA-Z]/g, '');
}

// Initialize the UI
updateLanguageUI();
setupLanguageToggle("language-toggle");
setupSettingsScreen("settings-screen");
