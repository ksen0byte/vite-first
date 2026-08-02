# Import fixture notes

These fictional fixtures capture the data shape produced by the current
`UsersScreen` exporter: an array of `{ user, tests }` bundles. Each test is a
persisted `TestRecord`, including its IndexedDB-generated `id` and `userKey`.
The current UI importer deliberately ignores the incoming ID and recalculates
the user key from the imported name.

`current-export.json` contains one user and one trial record for each current
test type. The files in `malformed/` intentionally isolate one invalid or
hostile value for the future runtime-parser tests.

Current ambiguity retained for H4.1: `src/util/import-json.ts` is not used by
the UI import path and requires fields (`reactionTimes`, `id`, and `userKey`)
that the UI importer does not require. These fixtures therefore follow the
actual exporter/UI-import format; they do not define a new supported format.
