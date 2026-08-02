# Release checklist

Complete this checklist for every release candidate. Record the date, commit,
operator, and any exceptions with the release notes.

## Automated verification

- [ ] Run a clean install from the lockfile: `npm ci`.
- [ ] Run type, lint, unit/integration, and production-build checks: `npm run check`.
- [ ] Run the Chromium critical browser suite: `npm run test:e2e`.
- [ ] Confirm the CI workflow has completed for the release commit.

## Persistence and data

- [ ] Smoke-test IndexedDB persistence: create a profile, save a result, reload, and verify the profile/result remain.
- [ ] Import the fictional current-format fixture and verify its user/tests are present.
- [ ] Export that data and import it again; verify duplicate tests are not added.
- [ ] Confirm existing-name demographic updates preserve associated tests.
- [ ] Verify stored profile text is rendered as text, not HTML.

## Product flows

- [ ] Smoke-test English and Ukrainian routes.
- [ ] Verify Browser Back/Forward abandons an active test cleanly.
- [ ] Verify spam-warning routing and recovery.
- [ ] Smoke-test the biological-age route only; do not alter its methodology during release hardening.

## Statistics and visual checks

- [ ] Verify statistics output is finite or explicitly shown as `N/A` for unavailable values.
- [ ] Perform a manual test-screen timing sanity check with normal production settings.
- [ ] Perform a manual profile and print-layout check.

## Release hygiene

- [ ] Review dependency audit output and document accepted risks.
- [ ] Update the version and changelog/release notes.
- [ ] Confirm no secrets, local exports, generated test artifacts, or unreviewed files are included.
