# Verified test policy / Перевірена політика тестування

This document records only behavior with current automated evidence. It
supersedes stale timeout-registry wording in the older architecture guides.

## English

- In SVMR and CRT1-3, only `Space` is accepted as a trial-response key.
  Control, Shift, and Arrow keys have no trial effect.
- CRT2-3 retains its tested left/right input mappings.
- `Escape` is a navigation/control key, not a trial response.
- Timers are owned by a per-`TestScreen` `BrowserScheduler`. Destroying or
  abandoning a screen cancels its pending work; the application does not use a
  global timeout registry.
- Chromium E2E covers rejected non-Space SVMR keys, accepted-input spam and
  recovery, and Browser Back cleanup during an active test.

## Українська

- У SVMR і CRT1-3 як відповідь у спробі приймається лише `Space`.
  Клавіші Control, Shift і Arrow не впливають на спробу.
- CRT2-3 зберігає перевірене зіставлення лівої та правої дій.
- `Escape` є клавішею навігації/керування, а не відповіддю у спробі.
- Таймерами володіє окремий для кожного `TestScreen` `BrowserScheduler`.
  Знищення або залишення екрана скасовує заплановану роботу; глобальний
  реєстр таймаутів не використовується.
- Chromium E2E покриває відхилення не-Space клавіш у SVMR, спам коректними
  відповідями та відновлення, а також очищення активного тесту через Browser Back.
