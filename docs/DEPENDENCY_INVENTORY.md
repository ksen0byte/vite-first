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
