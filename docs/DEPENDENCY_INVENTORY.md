# Dependency inventory

Recorded 2026-08-02 before any dependency changes. This is an inventory, not
approval to upgrade packages.

## Runtime dependencies

| Package | Current purpose | Importing area | Upgrade risk | Required regression evidence |
| --- | --- | --- | --- | --- |
| Chart.js | Result/profile histograms | `ReactionTimeStats.ts`, profile screen | Rendering and print output | `npm run check`, statistics tests, results/profile visual smoke |
| Dexie | IndexedDB profiles and test records | `src/db/` | Existing-data compatibility and transactions | persistence/import integration tests and E2E save/import/export |
| KaTeX | Localized mathematical notation | localization | Rendering/localization | build and bilingual route smoke |
| noUiSlider | Settings sliders | settings screen/config | Input ranges and emitted values | settings/unit tests and E2E settings flow |
| simple-statistics | Reaction-time calculations | statistics modules | Methodology-sensitive numeric output | statistics characterization tests; owner review for formula changes |

## Development dependencies

| Package/group | Current purpose | Upgrade risk | Required regression evidence |
| --- | --- | --- | --- |
| TypeScript, ESLint, `typescript-eslint`, globals | static checks | compiler/lint rule changes | `npm run check` |
| Vite, PostCSS, Tailwind, DaisyUI, Sass | build and styling | build output/layout | `npm run check`, desktop E2E, manual visual smoke |
| Vitest, fake-indexeddb, happy-dom | unit/integration tests | test runtime semantics | `npm run test` |
| Playwright | browser regression coverage | browser/test runner behavior | `npm run test:e2e` |
| tsx | deprecated one-off stats CLI | isolated utility | CLI remains deprecated; do not broaden its scope |

## 2026-08-02 registry findings

`npm outdated` reported patch/minor updates for DaisyUI, globals,
simple-statistics, and tsx. KaTeX, TypeScript, and Vite have newer major
versions. No package was changed by this inventory.

`npm audit` reported three transitive advisories, all in development/build
tooling paths:

| Package | Severity | Transitive path observed | Decision for this increment |
| --- | --- | --- | --- |
| `flatted` | High | ESLint -> file-entry-cache -> flat-cache | Inventory only; address with the ESLint/tooling upgrade group. |
| `picomatch` 2.3.1 | High | postcss-cli/Sass watcher dependency chain | Inventory only; address with the build-tooling group. |
| `yaml` 2.6.1 | Moderate | Vite/postcss-cli dependency chain | Inventory only; address with the Vite/build-tooling group. |

The audit did not identify a direct runtime dependency advisory. Upgrades must
remain isolated by the groups in `HARDENING_PLAN.md`; read the crossed
migration notes and run the listed regression evidence before changing a group.
