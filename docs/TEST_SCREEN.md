# TestScreen Architecture & Logic

This document describes the state machine, timing, and input handling logic of the `TestScreen` class, which manages the core test execution loop.

## 1. State Machine

The test execution is managed as a finite state machine using the `TestState` union type. This ensures that the application responds correctly to user inputs and timers based on
the current context.

### States

- **`Idle`**: Initial state. No test is active.
- **`CountingDown`**: The 3-2-1 countdown is active before the first stimulus.
- **`Delayed`**: The "waiting" period before a specific stimulus appears. No stimulus is visible.
- **`ShowingStimulus`**: A stimulus is currently displayed on the screen.
- **`SpamDetected`**: The test is interrupted because the user provided too many inputs in a single trial.
- **`Finished`**: The test has completed all trials and is displaying the summary.

### Transitions

| From State                                | Trigger                             | To State                 | Action                                                                            |
|-------------------------------------------|-------------------------------------|--------------------------|-----------------------------------------------------------------------------------|
| `Idle`                                    | `startTest()`                       | `CountingDown`           | Starts the `Countdown` component.                                                 |
| `CountingDown`                            | Countdown finish                    | `Delayed` (index 0)      | Calls `runTest()` -> `scheduleNextStimulus(0)`.                                   |
| `Delayed`                                 | `delay` timeout                     | `ShowingStimulus`        | Calls `showStimulus(index)`. Stimulus becomes visible. UI Timer starts.           |
| `ShowingStimulus`                         | `exposureTime` timeout              | `Delayed` (index+1)      | Calls `onStimulusTimeout()` -> `scheduleNextStimulus(index+1)`.                   |
| `ShowingStimulus`                         | `exposureTime` timeout (last index) | `Finished`               | Calls `onStimulusTimeout()` -> `onTestComplete()`.                                |
| *Any* (except `Finished`, `CountingDown`) | Excessive input (>3)                | `SpamDetected`           | Clears timers, destroys the active test screen, and redirects to `/spam-warning`. |
| `SpamDetected`                            | User clicks "Start Test Again"      | Test type selection page | The warning page routes back to `/testTypeSelection`.                             |

---

## 2. Timing & Execution Loop

The test loop is driven by two main timeouts per trial (stimulus):

1. **Pre-stimulus Delay**:
    - Scheduled in `scheduleNextStimulus(index)`.
    - Duration: `getNextDelay(index)` (randomized between `min` and `max` settings, or pre-generated).
    - Leads to: `showStimulus(index)`.

2. **Stimulus Exposure**:
    - Scheduled in `showStimulus(index)`.
    - Duration: Fixed `exposureTime` from settings.
    - Leads to: `onStimulusTimeout(index)`.

### Stimulus Persistence

The stimulus **remains visible** for the entire `exposureTime` even if the user reacts correctly. This ensures consistent timing across all trials. The transition to the next trial
only happens when the `exposureTime` timer expires.

---

## 3. Input Handling

User inputs (keyboard presses) are processed in `handleUserInput(code)`.

### Guards

- **State Guard**: Inputs are ignored if the state is `CountingDown`, `SpamDetected`, or `Finished`.
- **Spam Guard**: A maximum of 3 inputs is allowed per trial index. Exceeding this immediately triggers the `SpamDetected` state.
- **Threshold Guard**: During `ShowingStimulus`, inputs occurring before a hard-coded threshold (e.g., 100ms) are ignored. This prevents accidental double-clicks or "reflex"
  responses from the previous trial's stimulus.

### Processing Logic

- **In `Delayed` state**:
    - Input is recorded as a `FalseStart` (Reaction Time = -1).
    - The state **remains** `Delayed`. The stimulus will still appear after the original delay expires.
- **In `ShowingStimulus` state**:
    - Reaction time (RT) is calculated: `performance.now() - startTime`.
    - The outcome is determined (`Success`, `MixUp`, `FalseAlarm`) based on the `testType` and the displayed stimulus.
    - The result is recorded in the `reactionTimes` map.
    - The UI `TimerManager` is stopped to show the final RT to the user.
    - The state **remains** `ShowingStimulus` until the exposure timeout occurs.

---

## 4. Timeout Management

To ensure stability and prevent overlapping actions, all asynchronous logic uses the `scheduleTimeout` utility.

- **Centralized Tracking**: Every `setTimeout` call is tracked in a registry.
- **`clearAllTimeouts()`**: This is called whenever the test flow is interrupted (e.g., spam detection, manual retry, or moving between trials) to ensure no "stray" timers fire and
  cause unexpected state transitions. When spam is detected, `TestScreen.destroy()` also removes the keyboard listener before routing to the dedicated warning page.
- **Race Condition Prevention**: `onStimulusTimeout` and `showStimulus` perform index validation (`this.state.stimulusIndex === index`) to ensure they only process the trial they
  were originally scheduled for.

---

## 5. Trial Outcomes

Each trial results in one of the following `TrialOutcome` values:

- **`Success`**: Correct reaction to a target stimulus during its exposure.
- **`Miss`**: The user failed to react to a target stimulus before it timed out.
- **`FalseAlarm`**: The user reacted to a distractor stimulus.
- **`CorrectRejection`**: The user correctly ignored a distractor stimulus.
- **`MixUp`**: The user reacted to a target but used the wrong action (e.g., Left instead of Right in choice tests).
- **`FalseStart`**: The user reacted during the pre-stimulus delay period.
