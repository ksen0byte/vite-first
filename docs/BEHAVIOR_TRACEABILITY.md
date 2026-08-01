# Behavior traceability matrix

## Scope and evidence

This matrix records the repository baseline before behavior-affecting hardening work.
It is derived from `README.md`, `docs/TEST_SCREEN.md`,
`docs/TEST_SCREEN_UA.md`, and the current implementation. The legacy manual is
comparison material only and was not found in the checked-in workspace at the
time of this record; no behavior below is approved because of that manual.

Status meanings:

- **Characterized** — documentation and the inspected implementation agree;
  an automated regression test is named for the next applicable task.
- **Unverified** — implementation was identified, but has no automated
  characterization yet.
- **Conflict** — repository documentation and executable behavior disagree.
- **Owner decision required** — a methodology-sensitive decision is needed;
  a resolved decision is noted where applicable.

## Test-state workflow

| Behavior | Current implementation | Status | Planned regression test | Legacy comparison notes |
| --- | --- | --- | --- | --- |
| `Idle` is the initial inactive state. | `toIdle`, `TestScreen.state` | Characterized | `test-transitions.test.ts: starts idle` | Not used as approval evidence. |
| Starting a test enters `CountingDown` with a 3-2-1 countdown. | `TestScreen.startTest`, `toCountingDown`, `Countdown` | Characterized | `test-transitions.test.ts: idle to counting down` | Not reviewed. |
| Countdown completion schedules trial index 0 and enters `Delayed`. | `TestScreen.runTest`, `scheduleNextStimulus`, `toDelayed` | Characterized | `test-transitions.test.ts: counting down to delayed` | Not reviewed. |
| A delay expiry shows the indexed stimulus and enters `ShowingStimulus`. | `TestScreen.showStimulus`, `toShowingStimulus` | Characterized | `test-transitions.test.ts: delayed to showing stimulus` | Not reviewed. |
| Each non-final exposure expiry clears the stimulus and schedules the next delayed trial. | `TestScreen.onStimulusTimeout`, `scheduleNextStimulus` | Characterized | `test-transitions.test.ts: showing stimulus to next delayed` | Not reviewed. |
| The final exposure expiry completes the session. | `TestScreen.scheduleNextStimulus`, `onTestComplete`, `toFinished` | Characterized | `test-transitions.test.ts: final stimulus to finished` | Not reviewed. |
| More than three accepted inputs in one trial enters `SpamDetected` and routes to the warning screen. | `handleUserInput`, `onSpamDetected`, `spamPreventionConfig` | Characterized | `test-transitions.test.ts: fourth input detects spam` | Not reviewed. |
| `SpamDetected` can return to test-type selection through the warning screen. | `src/screens/spam-warning-screen.ts`, router registration | Characterized | `tests/e2e/app-load.spec.ts: routes accepted input spam to the warning screen and recovers to test selection` | Not reviewed. |
| `Finished` retains the per-trial result map. | `toFinished`, `onTestComplete` | Characterized | `test-transitions.test.ts: keeps recorded trial results when the final stimulus finishes` | Not reviewed. |

## Timing, input, and trial recording

| Behavior | Current implementation | Status | Planned regression test | Legacy comparison notes |
| --- | --- | --- | --- | --- |
| Delay comes from `EXPOSITION_DELAY_SEQUENCE` when pregenerated delays are enabled, otherwise from the inclusive configured range. | `getNextDelay` | Characterized | `test-state.test.ts: delay boundaries and sequence wraparound` | Not reviewed. |
| A shown stimulus remains visible until its exposure timeout after a response. | `handleUserInput`, `onStimulusTimeout` | Characterized | `test-transitions.test.ts: response does not hide stimulus` | Not reviewed. |
| Input during `CountingDown`, `SpamDetected`, or `Finished` is ignored. | `handleUserInput` | Characterized | `test-transitions.test.ts: state input guard` | Not reviewed. |
| Input during `Delayed` records one `FalseStart` with reaction time `-1`; the delay remains active. | `handleUserInput`, `recordReactionTime` | Characterized | `test-transitions.test.ts: false start leaves delayed state` | Not reviewed. |
| An input before the 100 ms shown-stimulus threshold is ignored. | `handleUserInput`, `spamPreventionConfig.clickAllowedFromMs` | Characterized | `test-transitions.test.ts: early shown input ignored`; `app-load.spec.ts: ignores an early SVMR response using minimum real-clock settings` | Not reviewed. |
| The timer starts when the stimulus is shown and stops after an accepted shown-stimulus response or expiry. | `showStimulus`, `handleUserInput`, `onStimulusTimeout` | Unverified | `test-transitions.test.ts: timer lifecycle` | Not reviewed. |
| A trial index receives at most one stored result. | `recordReactionTime` | Characterized | `test-transitions.test.ts: duplicate trial result ignored` | Not reviewed. |
| A target with no response becomes `Miss`; a distractor with no response becomes `CorrectRejection`. | `onStimulusTimeout`, `getExpectedAction` | Characterized | `test-response.test.ts: timeout outcomes` | Not reviewed. |
| SVMR expects `DEFAULT` for every stimulus. | `getExpectedAction` | Characterized | `test-response.test.ts: keeps SVMR responses as DEFAULT for every stimulus` | Not reviewed. |
| CRT1-3 expects `DEFAULT` for red, square, or animal stimuli; all other stimuli expect `NONE`. | `getExpectedAction`, `isRed`, `isSquare`, `isAnimal` | Characterized | `test-response.test.ts: classifies CRT1-3 stimulus` | Not reviewed. |
| CRT2-3 expects `RIGHT` for red, square, or animal; `LEFT` for green, circle, or plant; otherwise `NONE`. | `getExpectedAction`, classification predicates | Characterized | `test-response.test.ts: classifies CRT2-3 stimulus` | Not reviewed. |
| CRT2-3 response outcomes are success for matching action, mix-up for a wrong action on a target, and false alarm on a distractor. | `processTestResponse` | Characterized | `test-response.test.ts: classifies every CRT2-3 response outcome` | Not reviewed. |
| Current SVMR/CRT1-3 handling maps all listed control, shift, arrow, and Space keys to actions, while their outcome branch does not compare actual action. | `handleAppKeyDown`, `mapInputCode`, `processTestResponse` | Owner decision required — resolved by DEC-001 | `test-response.test.ts: non-Space keys ignored for svmr/crt1-3` | Do not infer compatibility from legacy material. |
| `Escape` routes home and is separate from trial response handling. | `handleAppKeyDown`, `handleHome` | Characterized | `tests/e2e/app-load.spec.ts: uses Escape to abandon an active test without recording a trial response` | Not reviewed. |

## Stimulus sequence and classification predicates

| Predicate or sequence behavior | Current implementation | Status | Planned regression test | Legacy comparison notes |
| --- | --- | --- | --- | --- |
| Sequence access wraps with `index % sequence.length`. | `getStimulusFromSequence` | Characterized | `stimulus-sequences.test.ts: wraps last to first` | Not reviewed. |
| `isRed`, `isGreen`, and `isYellow` classify their exact color values. | `isRed`, `isGreen`, `isYellow` | Characterized | `stimulus-sequences.test.ts: classifies colors and rejects a non-color` | Not reviewed. |
| `isSquare`, `isCircle`, and `isTriangle` classify their exact shape values. | `isSquare`, `isCircle`, `isTriangle` | Characterized | `stimulus-sequences.test.ts: classifies shapes and rejects a non-shape` | Not reviewed. |
| `isAnimal` recognizes the current English and Ukrainian animal sets. | `isAnimal`, `ANIMALS_EN`, `ANIMALS_UA` | Characterized | `stimulus-sequences.test.ts: classifies English/Ukrainian animal examples; rejects non-matching categories` | Not reviewed. |
| `isPlant` recognizes the current English and Ukrainian plant sets. | `isPlant`, `PLANTS_EN`, `PLANTS_UA` | Characterized | `stimulus-sequences.test.ts: classifies English/Ukrainian plant examples; rejects non-matching categories` | Not reviewed. |
| `isNonLiving` recognizes the current English and Ukrainian non-living sets. | `isNonLiving`, `NON_LIVING_EN`, `NON_LIVING_UA` | Characterized | `stimulus-sequences.test.ts: classifies English/Ukrainian non-living examples; rejects non-matching categories` | Not reviewed. |
| The delay, shape, color, word, and combined sequence contents are characterization values and must not be edited during H2.1/H2.2. | `EXPOSITION_DELAY_SEQUENCE`, `SHAPE_SEQUENCE`, `COLOR_SEQUENCE`, `WORD_SEQUENCE_*`, `COMBINED_SEQUENCE_*` | Unverified | `stimulus-sequences.test.ts: records sequence lengths` | Not reviewed. |

## Persistence, import/export, and summary statistics

| Behavior | Current implementation | Status | Planned regression test | Legacy comparison notes |
| --- | --- | --- | --- | --- |
| Profile identity currently uses `[firstName+lastName]`. | `src/db/db.ts`, `src/db/operations.ts: upsertUser` | Characterized | `user-operations.test.ts: existing identity key` | Not reviewed. |
| A repeat profile submission currently returns an existing profile without applying new age or gender. | `upsertUser` | Owner decision required — resolved by DEC-002 | `user-operations.test.ts: updates existing demographics` | Not reviewed. |
| Export is a user bundle with its associated test records. | `exportAllUsersData`, `exportUserData` in `user-profiles-screen.ts` | Unverified | `import-json.test.ts: current export fixture` | Not reviewed. |
| Import parsing and UI normalization are currently split; parser validation throws `ImportValidationError`. | `src/util/import-json.ts`, `UsersScreen.importAllUsersData` | Unverified | `import-json.test.ts: parser fixtures` | Not reviewed. |
| Only `Success` trials contribute reaction-time data; `Miss`, `FalseAlarm`, `FalseStart`, and `MixUp` are error outcomes. | `README.md`, `ReactionTimeStats` | Unverified | `reaction-time-stats.test.ts: outcome filtering` | Not reviewed. |
| `CorrectRejection` is displayed in outcome breakdown but is not included in the aggregate error count. | `README.md`, `ReactionTimeStats` | Unverified | `reaction-time-stats.test.ts: correct rejection breakdown` | Not reviewed. |

## Approved owner decisions

| Decision | Requirement | Regression coverage |
| --- | --- | --- |
| DEC-001 | In SVMR and CRT1-3, only `Space` is a trial-response key. Control, Shift, and Arrow keys must have no trial effect; CRT2-3 mappings remain unchanged. | `test-response.test.ts` and a rejected-key E2E case. |
| DEC-002 | With the existing `[firstName+lastName]` key, `upsertUser` updates age and gender, preserves existing tests, and returns the post-write user atomically where supported. | `user-operations.test.ts`. |

## Follow-up notes

- No executable/documentation conflicts were found in this H0.1 inspection.
- This document records behavior; it does not approve methodology changes.
- Biological-age files are intentionally outside this matrix except for future route-load smoke coverage.

## Verified hardening evidence (2026-08-01)

This addendum supersedes only the matching baseline rows above where a named
automated test now exists. It does not approve methodology changes.

| Behavior | Verified evidence |
| --- | --- |
| Finished state retains the recorded per-trial map. | `test-transitions.test.ts: keeps recorded trial results when the final stimulus finishes` |
| SVMR, CRT1-3, CRT2-3 expected actions and CRT2-3 response outcomes. | `test-response.test.ts: maps expected actions`; `test-response.test.ts: classifies responses` |
| Color and shape predicates. | `stimulus-sequences.test.ts: classifies colors`; `stimulus-sequences.test.ts: classifies shapes` |
| Existing-name demographic update preserves tests. | `db-operations.test.ts: updates demographics for an existing name while retaining associated tests` |
| Current export parsing and legacy reaction-time normalization. | `import-json.test.ts` |
| Atomic import and duplicate reporting. | `integration/import-users.test.ts: imports a validated export once and reports its duplicates on repeat` |
| Success-only statistics and error breakdown. | `reaction-time-stats.test.ts: counts every error outcome without treating it as a successful reaction` |
| Identical-value histogram safety and unavailable zero-deviation values. | `reaction-time-stats.test.ts: handles multiple identical successful values with a deterministic bin`; `reaction-time-stats.test.ts: represents Loskutova values as unavailable when standard deviation is zero` |
| Route cleanup, test session scheduling, stored-content escaping, and rejected non-Space SVMR keys. | `router.test.ts`; `schedule-timeout.test.ts`; `html.test.ts`; `app-load.spec.ts` |
