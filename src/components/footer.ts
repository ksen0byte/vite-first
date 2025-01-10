import {setupResetSettingsButtonCallback, setupStartButtonCallback} from "../screens/settings-screen.ts";

export function setupFooter(appContainer: HTMLElement, footerType: "settingsScreen" | "testType"): void {
  // remove old one
  const footerElement = document.getElementById("footer");
  if (footerElement) {
    appContainer.removeChild(footerElement);
  }

  let footerHTML = '';

  switch (footerType) {
    case 'settingsScreen':
      footerHTML = settingsScreenFooter();
      break;
    case 'testType':
      footerHTML = testTypeFooter();
      break;
    default:
      // Return empty string if no footer type is recognized
      return;
  }

  // Inserts the footer HTML at the end of the container
  appContainer.insertAdjacentHTML('beforeend', footerHTML);
  switch (footerType) {
    case 'settingsScreen':
      setupStartButtonCallback(appContainer, document.getElementById("start-test-btn")!);
      setupResetSettingsButtonCallback(appContainer, document.getElementById("reset-settings-btn")!);
      break;
    case 'testType':
      break;
    default:
      // Return empty string if no footer type is recognized
      return;
  }
  return;
}

function settingsScreenFooter() {
  return `
    <footer id="footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
      <div class="flex-1"></div>
      <div class="flex space-x-2">
        <button id="reset-settings-btn" class="btn btn-outline btn-error" data-localize="resetSettings"></button>
        <button id="start-test-btn" class="btn btn-success" data-localize="startTest"></button>
      </div>
    </footer>
  `;
}

function testTypeFooter(): string {
  return `
    <footer id="test-footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
      <div class="flex-1"></div>
      <div class="flex space-x-2">
        <button id="test-back-btn" class="btn btn-outline btn-warning" data-localize="back"></button>
      </div>
    </footer>
  `;
}
