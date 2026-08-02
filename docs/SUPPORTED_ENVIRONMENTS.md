# Supported environments

This matrix records the environments covered by the current automated suite. It
does not constitute clinical, timing, or scientific equivalence validation.

| Area | Supported / tested scope |
| --- | --- |
| Browser | Chromium desktop 151.0.7922.34 through Playwright 1.62.1 `Desktop Chrome` in CI. This is the currently tested release, not a broad browser-compatibility claim. |
| Viewport | 1280×720 desktop/laptop viewport supplied by Playwright's `Desktop Chrome` device profile (1920×1080 screen). Layouts outside that profile require manual review before support is claimed. |
| Input | A physical keyboard is required for test responses. The supported trial keys are documented in the test-screen documentation and enforced by regression tests. |
| Storage | IndexedDB and LocalStorage must be available; profiles, tests, language preference, and import/export flows depend on browser storage. |
| JavaScript | JavaScript must be enabled. The application is a client-side Vite application. |
| Network | Normal application use is local/browser-resident after assets are loaded; development and CI require Node.js tooling. |

## Out of scope

- Mobile and touch-only use are unsupported.
- No cross-browser timing equivalence is claimed.
- No equivalence across keyboards, displays, operating systems, or devices is claimed.
- Any scientific or clinical timing validation requires a separate study and owner approval.
