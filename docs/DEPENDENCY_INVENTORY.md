# Dependency inventory

Captured 2026-08-01 before any dependency upgrade. This is an inventory, not
approval to upgrade a package or alter application behavior.

## Runtime dependencies

| Package | Current declared range | Import/config surface | Purpose | Upgrade risk and required regression |
| --- | --- | --- | --- | --- |
| `chart.js` | `^4.4.7` | `ReactionTimeStats.ts`, `user-profile-screen.ts` | Histograms and printable profile charts | Visual profile/print check; statistics and E2E tests. |
| `dexie` | `^4.0.11` | `db.ts`, database operations | IndexedDB persistence/migrations | Import, demographic update, delete, and persistence integration tests. |
| `katex` | `^0.16.25` | localization and global CSS import | Render localized mathematics | English/Ukrainian route smoke and visual render check. |
| `nouislider` | `^15.8.1` | settings/domain/util | Settings controls | Settings creation flow and keyboard/accessibility smoke. |
| `simple-statistics` | `^7.8.7` | browser and Node statistics implementations | Reaction-time calculations | Characterization/equivalence fixtures; no methodology changes. |

## Development and build dependencies

| Package/group | Current declared range | Purpose | Upgrade risk and required regression |
| --- | --- | --- | --- |
| TypeScript / ESLint / `typescript-eslint` / `globals` / `@types/katex` | package manifest | Static checks | `npm run check`; inspect lint/config migration notes. |
| Vite / `tsx` | `^6.0.7` / `^4.21.0` | Dev server, production build, CLI execution | Build, local base path, and Chromium E2E. |
| Tailwind / DaisyUI / PostCSS / Sass | package manifest and `src/index.scss` | CSS generation and component styling | Build plus settings, test, profile/print visual smoke. |
| Vitest / coverage / fake IndexedDB | package manifest and tests | Unit/integration tests | `npm run test`. |
| Playwright | package manifest/config | Chromium E2E | `npm run test:e2e`; retain Chromium-only scope until stable. |

## Audit and update status

`npm outdated` on 2026-08-01 found same-major updates for direct packages,
including Vite `6.4.3`, PostCSS `8.5.25`, and current major-line updates for
Dexie, Chart.js, Tailwind/DaisyUI, Sass, and test/tooling packages. Newer major
versions exist for Vite, TypeScript, and KaTeX and require separate migration
note review.

`npm audit` reported 9 advisories (7 high, 1 moderate, 1 low). Direct
dependencies implicated are PostCSS and Vite; transitive findings include
Rollup, Picomatch, brace-expansion, YAML, Immutable, flatted, and esbuild.
The inventory does not claim these are production-exploitable; remediation must
be evaluated in the isolated dependency groups defined by the hardening plan.

No package is a removal candidate solely from this table: CSS/build plugins are
also consumed by configuration and generated output, and all runtime packages
have confirmed source imports.

## Verified after hardening

The preceding inventory is retained as the pre-upgrade baseline. The following
isolated updates were subsequently verified with `npm run check` and the
Chromium browser suite:

- Vite `6.4.3`, PostCSS `8.5.25`, and `tsx` `4.23.1`.
- Tailwind `4.3.3`, DaisyUI `5.7.9`, and Sass `1.102.0`.
- Dexie `4.4.4`, Chart.js `4.5.1`, KaTeX `0.16.47`, and `@types/katex` `0.16.8`.
- ESLint `10.8.0`, `typescript-eslint` `8.65.0`, globals `17.8.0`, and
  `postcss-cli` `11.0.1`.

The production dependency audit is clean. The remaining full-audit findings
are development-only transitive dependencies. The one-off statistics CLI is
deprecated and is not maintained as browser-equivalent reporting; consequently
its implementation drift is intentionally outside the current hardening scope.

Vite `8.2.0` was evaluated as a separate migration on Node `22.13.1`.
Types, lint, unit tests, and the production build passed, but the Chromium
timer-session E2E flows did not reach the finish screen under Playwright's
controllable clock. The upgrade was reverted rather than weakening those
regressions; Vite remains on the verified `6.4.3` line pending a reproducible
test-runtime compatibility solution.
