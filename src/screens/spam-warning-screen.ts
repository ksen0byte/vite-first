import {setupHeader} from "../components/header.ts";
import {setupFooter} from "../components/footer.ts";
import {updateLanguageUI} from "../localization/localization.ts";
import Router from "../routing/router.ts";

export function setupSpamWarningScreen(appContainer: HTMLElement): void {
  appContainer.innerHTML = spamWarningScreenHTML();
  setupHeader(appContainer);
  setupFooter(
    appContainer,
    footerHtml(),
    [
      {
        buttonFn: () => document.getElementById("spam-warning-home-btn")! as HTMLButtonElement,
        callback: () => Router.navigate("/"),
      },
      {
        buttonFn: () => document.getElementById("spam-warning-retry-btn")! as HTMLButtonElement,
        callback: () => Router.navigate("/testTypeSelection"),
      }
    ]
  );
  updateLanguageUI();
}

function spamWarningScreenHTML(): string {
  return `
    <div id="spam-warning-screen" class="flex flex-col flex-grow items-center justify-center bg-base-200 text-base-content p-6">
      <section class="w-full max-w-2xl bg-base-100 shadow-md rounded-lg p-6 text-center">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-warning text-warning-content">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-10">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.731 0-2.814-1.874-1.948-3.374L10.052 3.38c.866-1.5 3.03-1.5 3.896 0l7.355 12.746ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h2 class="text-2xl font-bold mb-4" data-localize="spamWarningTitle"></h2>
        <p class="text-base leading-7 text-base-content/80" data-localize="spamWarningMessage"></p>
      </section>
    </div>
  `;
}

function footerHtml(): string {
  return `
    <footer id="spam-warning-screen-footer" class="navbar bg-base-100 px-4 py-2 border-t border-base-300">
      <div class="flex-1"></div>
      <div class="flex space-x-2">
        <button id="spam-warning-home-btn" class="btn btn-outline btn-warning" data-localize="backToMainPage"></button>
        <button id="spam-warning-retry-btn" class="btn btn-success" data-localize="spamWarningStartAgainButton"></button>
      </div>
    </footer>
  `;
}
