import { escapeHtml } from '../util/html.ts';
import { Grant, lastValidDay } from '../licensing/domain.ts';

/** One-line summary of the active license, for the dashboard. Empty for the web edition. */
export function licenseSummaryHtml(grant: Grant): string {
  switch (grant._tag) {
    case 'WebEdition':
      return '';
    case 'Licensed': {
      const { license, installationId } = grant;
      const validity =
        license.expiry._tag === 'Never'
          ? '<span data-localize="licensePerpetual"></span>'
          : `<span data-localize="licenseValidThrough"></span> ${lastValidDay(license.expiry)}`;
      return `
        <p class="text-center text-sm opacity-70 mt-8" id="license-summary">
          <span data-localize="licensedTo"></span> <strong>${escapeHtml(license.licensee)}</strong>
          · ${validity}
          · <span data-localize="installationIdLabel"></span> <span class="font-mono">${escapeHtml(installationId)}</span>
        </p>`;
    }
  }
}
