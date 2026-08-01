# Data format

## Export envelope v1

New exports use this JSON envelope:

```ts
interface ExportEnvelopeV1 {
  readonly schemaVersion: 1;
  readonly exportedAt: string; // ISO-8601 date/time
  readonly users: readonly ExportedUserBundleV1[];
}

interface ExportedUserBundleV1 {
  readonly user: {
    readonly firstName: string;
    readonly lastName: string;
    readonly gender: 'male' | 'female';
    readonly age: number;
  };
  readonly tests: readonly TestRecord[];
}
```

`schemaVersion` is the exact number `1`. `exportedAt` records the export
timestamp and is not used to overwrite a test date. Each test retains its
saved settings, normalized trial records, and ISO date. Incoming database IDs
and user keys are never trusted for persistence; the importer derives the key
from the imported user and lets IndexedDB assign new IDs.

## Import compatibility

The importer accepts v1 envelopes, the prior array of user bundles, and the
legacy single-bundle shape already accepted by the application. All formats are
validated before one atomic database transaction runs. Unsupported schema
versions, malformed dates, invalid enum values, non-finite numbers, and
invalid trial records are rejected.

No browser, device, fingerprint, or telemetry fields are exported.
