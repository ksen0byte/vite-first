# Test-session clock design proposal

## Status

Approved by the project owner and implemented on 2026-08-02.
It exists because Playwright's browser clock can advance an individual timer but
does not reliably drain the test session's nested, asynchronously scheduled
timer chain in one deterministic E2E operation.

## Problem evidence

The following otherwise-public browser flow is not currently reliably
verifiable through a large Playwright fake-clock jump:

1. start SVMR;
2. issue an input immediately after the first shown stimulus; and
3. complete the session to assert that the input was ignored by the 100 ms
   guard.

The session does not reach its finish screen after `fastForward(100_000)`,
because subsequent timers are scheduled after the advance has begun. This is a
test-runtime limitation, not evidence that the clinical/session timing should
be shortened or changed.

## Proposed boundary

Define a small runtime `Scheduler`/clock port that supplies:

- delayed scheduling and cancellation for session work;
- a monotonic `now()` value for response-time measurement; and
- production construction backed by browser `setTimeout`, `clearTimeout`, and
  `performance.now()`.

`TestScreen` and `Countdown` would receive this port through normal
construction. Production entry points would always provide the browser-backed
implementation. Unit/integration tests could provide a deterministic in-memory
implementation that explicitly drains scheduled work in chronological order.

## Non-negotiable invariants

- No query-string, localStorage, URL, or hidden UI mechanism may alter timing.
- The browser-backed clock remains the only production implementation.
- The test clock is created only by test code and cannot be selected by a user.
- E2E tests continue to assert user-visible flows; exact reaction-time values
  remain unit/integration concerns.
- Existing delay sequences, exposure durations, response threshold, and saved
  data format remain unchanged.
- Cancelling a screen must cancel all work owned by its injected scheduler.

## Required acceptance evidence before implementation

1. Existing `BrowserScheduler` cancellation tests remain green.
2. Deterministic tests cover countdown, nested delay/exposure scheduling, early
   response rejection, retry, spam cleanup, Browser Back cleanup, and finish.
3. Existing Chromium E2E flows still run against the browser-backed clock.
4. `npm run check` and the relevant browser suite pass with no timing shortcut.

## Approved decision

The project owner approved the runtime clock port. The implementation keeps
`BrowserScheduler` as the production default and adds a deterministic scheduler
used only by tests. Approval does not authorize any clinical/timing methodology
change; it authorizes only the testability-oriented dependency boundary.
