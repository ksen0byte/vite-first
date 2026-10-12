import { setupHeader } from '../components/header.ts';
import { updateLanguageUI } from '../localization/localization.ts';
import { escapeHtml } from '../util/html.ts';
import type { Cleanup } from '../routing/router.ts';
import type { ActivatableLock, Grant, Lock, Rejection } from '../licensing/domain.ts';
import { lastValidDay } from '../licensing/domain.ts';
import { ActivationState, Feedback, initialActivationState, transition, ActivationEvent } from '../licensing/activation.ts';
import { describeIpcError, LicensingPort } from '../licensing/tauri-licensing.ts';

/**
 * Shown instead of the app while it is locked. Calls `onActivated` exactly once,
 * after the native engine has verified and stored a license.
 */
export function setupActivationScreen(
  container: HTMLElement,
  lock: Lock,
  licensing: LicensingPort,
  onActivated: (grant: Grant) => void,
): Cleanup {
  switch (lock._tag) {
    case 'Unavailable':
      container.innerHTML = unavailableHtml(lock.reason);
      setupHeader(container);
      return () => {};
    case 'Unlicensed':
    case 'Invalid':
      return setupActivatable(container, lock, licensing, onActivated);
  }
}

function setupActivatable(
  container: HTMLElement,
  lock: ActivatableLock,
  licensing: LicensingPort,
  onActivated: (grant: Grant) => void,
): Cleanup {
  container.innerHTML = activationHtml(lock);
  setupHeader(container);

  const licenseInput = container.querySelector<HTMLTextAreaElement>('#license-input')!;
  const activateButton = container.querySelector<HTMLButtonElement>('#activate-button')!;
  const feedbackArea = container.querySelector<HTMLElement>('#activation-feedback')!;
  const copyButton = container.querySelector<HTMLButtonElement>('#copy-request')!;

  let disposed = false;
  let state: ActivationState = initialActivationState(lock);

  const dispatch = (event: ActivationEvent): void => {
    if (disposed) return;
    const next = transition(state, event);
    if (next._tag === 'Failure') {
      console.error('Ignored illegal activation transition', next.error);
      return;
    }
    state = next.value;
    render(state);
    if (state._tag === 'Verifying') void verify(state.code);
    if (state._tag === 'Activated') {
      onActivated({ _tag: 'Licensed', installationId: state.installationId, license: state.license });
    }
  };

  const verify = async (code: string): Promise<void> => {
    const outcome = await licensing.importLicense(code);
    dispatch(
      outcome._tag === 'Success'
        ? { _tag: 'OutcomeReceived', outcome: outcome.value }
        : { _tag: 'CommunicationFailed', message: describeIpcError(outcome.error) },
    );
  };

  const render = (current: ActivationState): void => {
    const verifying = current._tag === 'Verifying';
    activateButton.disabled = verifying;
    licenseInput.disabled = verifying;
    activateButton.querySelector('.loading')?.classList.toggle('hidden', !verifying);
    feedbackArea.innerHTML = current._tag === 'AwaitingLicense' ? feedbackHtml(current.feedback) : '';
    updateLanguageUI(feedbackArea);
  };

  activateButton.addEventListener('click', () => dispatch({ _tag: 'Submitted', code: licenseInput.value }));

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(lock.activationRequest);
      flashLabel(copyButton, 'activationCopied');
    } catch {
      container.querySelector<HTMLTextAreaElement>('#activation-request')!.select();
    }
  });

  render(state);
  updateLanguageUI(container);
  return () => {
    disposed = true;
  };
}

function flashLabel(button: HTMLButtonElement, key: string): void {
  const label = button.querySelector<HTMLElement>('[data-localize]')!;
  const original = label.dataset.localize!;
  label.dataset.localize = key;
  updateLanguageUI(button);
  setTimeout(() => {
    label.dataset.localize = original;
    updateLanguageUI(button);
  }, 1500);
}

function rejectionHtml(rejection: Rejection): string {
  switch (rejection._tag) {
    case 'Malformed':
      return `<span data-localize="rejectionMalformed"></span>
        <span class="block text-xs opacity-70 font-mono">${escapeHtml(rejection.detail)}</span>`;
    case 'BadSignature':
      return '<span data-localize="rejectionBadSignature"></span>';
    case 'WrongInstallation':
      return `<span data-localize="rejectionWrongInstallation"></span>
        <span class="block text-xs opacity-70 font-mono">${escapeHtml(rejection.licensedInstallationId)}</span>`;
    case 'Expired':
      return `<span data-localize="rejectionExpired"></span>
        <span class="font-mono">${lastValidDay({ _tag: 'At', at: rejection.expiredAt })}</span>`;
  }
}

function feedbackHtml(feedback: Feedback): string {
  const alert = (kind: 'warning' | 'error', body: string) =>
    `<div role="alert" class="alert alert-${kind} flex-col items-start gap-1">${body}</div>`;
  switch (feedback._tag) {
    case 'None':
      return '';
    case 'StoredLicenseInvalid':
      return alert(
        'warning',
        `<strong data-localize="activationStoredInvalid"></strong><div>${rejectionHtml(feedback.rejection)}</div>`,
      );
    case 'EmptyInput':
      return alert('warning', '<span data-localize="activationEmptyInput"></span>');
    case 'Rejected':
      return alert('error', rejectionHtml(feedback.rejection));
    case 'SaveFailed':
      return alert(
        'error',
        `<span data-localize="activationSaveFailed"></span>
         <span class="block text-xs opacity-70 font-mono">${escapeHtml(feedback.reason)}</span>`,
      );
    case 'CommunicationFailed':
      return alert(
        'error',
        `<span data-localize="licensingUnavailable"></span>
         <span class="block text-xs opacity-70 font-mono">${escapeHtml(feedback.message)}</span>`,
      );
  }
}

function activationHtml(lock: ActivatableLock): string {
  return `
    <main class="container mx-auto p-4 flex-grow flex justify-center items-start">
      <section class="card bg-base-100 shadow-xl w-full max-w-3xl" id="activation-screen">
        <div class="card-body gap-4">
          <h1 class="card-title text-2xl" data-localize="activationTitle"></h1>
          <p data-localize="activationIntro"></p>
          <ol class="list-none space-y-1">
            <li data-localize="activationStep1"></li>
            <li data-localize="activationStep2"></li>
            <li data-localize="activationStep3"></li>
          </ol>

          <div>
            <span class="label-text font-semibold" data-localize="installationIdLabel"></span>
            <p class="font-mono text-lg select-all" id="installation-id">${escapeHtml(lock.installationId)}</p>
          </div>

          <label class="form-control">
            <span class="label-text font-semibold mb-1" data-localize="activationRequestLabel"></span>
            <textarea id="activation-request" class="textarea textarea-bordered font-mono text-xs w-full" rows="3" readonly>${escapeHtml(lock.activationRequest)}</textarea>
          </label>
          <div class="flex gap-2">
            <button type="button" class="btn btn-outline btn-sm" id="copy-request"><span data-localize="activationCopy"></span></button>
          </div>

          <div class="divider my-0"></div>

          <label class="form-control">
            <span class="label-text font-semibold mb-1" data-localize="licenseInputLabel"></span>
            <textarea id="license-input" class="textarea textarea-bordered font-mono text-xs w-full" rows="4" spellcheck="false" placeholder="CNS-LIC1:…"></textarea>
          </label>
          <div class="flex flex-wrap gap-2 items-center">
            <button type="button" class="btn btn-primary" id="activate-button">
              <span class="loading loading-spinner loading-sm hidden"></span>
              <span data-localize="activationActivate"></span>
            </button>
          </div>

          <div id="activation-feedback" aria-live="polite"></div>
        </div>
      </section>
    </main>`;
}

function unavailableHtml(reason: string): string {
  return `
    <main class="container mx-auto p-4 flex-grow flex justify-center items-start">
      <section class="card bg-base-100 shadow-xl w-full max-w-3xl" id="activation-screen">
        <div class="card-body gap-4">
          <h1 class="card-title text-2xl" data-localize="activationTitle"></h1>
          <div role="alert" class="alert alert-error flex-col items-start gap-1">
            <span data-localize="licensingUnavailable"></span>
            <span class="block text-xs opacity-70 font-mono">${escapeHtml(reason)}</span>
          </div>
        </div>
      </section>
    </main>`;
}
