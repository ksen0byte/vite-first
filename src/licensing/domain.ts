// Licensing domain for the desktop edition. Verification itself happens natively in
// src-tauri (crate `cns-licensing`); the frontend only models and presents the results.

declare const installationIdBrand: unique symbol;
declare const activationRequestBrand: unique symbol;
declare const unixSecondsBrand: unique symbol;

/** Public identity of one installation, e.g. `3F2A-9C01-77BE-0D4E-A1C5`. */
export type InstallationId = string & { readonly [installationIdBrand]: true };
/** Opaque `CNS-REQ1:` code the customer sends to the distributor. */
export type ActivationRequestCode = string & { readonly [activationRequestBrand]: true };
export type UnixSeconds = number & { readonly [unixSecondsBrand]: true };

export type Expiry =
  | { readonly _tag: 'Never' }
  /** Exclusive: the license stops being valid at this instant. */
  | { readonly _tag: 'At'; readonly at: UnixSeconds };

export interface License {
  readonly licenseId: string;
  readonly licensee: string;
  readonly issuedAt: UnixSeconds;
  readonly expiry: Expiry;
}

/** Why a license does not unlock this installation. */
export type Rejection =
  | { readonly _tag: 'Malformed'; readonly detail: string }
  | { readonly _tag: 'BadSignature' }
  | { readonly _tag: 'WrongInstallation'; readonly licensedInstallationId: InstallationId }
  | { readonly _tag: 'Expired'; readonly expiredAt: UnixSeconds };

export type LicenseStatus =
  | { readonly _tag: 'Unavailable'; readonly reason: string }
  | {
      readonly _tag: 'Unlicensed';
      readonly installationId: InstallationId;
      readonly activationRequest: ActivationRequestCode;
    }
  | { readonly _tag: 'Active'; readonly installationId: InstallationId; readonly license: License }
  | {
      readonly _tag: 'Invalid';
      readonly installationId: InstallationId;
      readonly activationRequest: ActivationRequestCode;
      readonly rejection: Rejection;
    };

export type ImportOutcome =
  | { readonly _tag: 'Activated'; readonly license: License }
  | { readonly _tag: 'Rejected'; readonly rejection: Rejection }
  | { readonly _tag: 'Failed'; readonly reason: string };

/** States in which the app stays locked. */
export type Lock =
  | Extract<LicenseStatus, { readonly _tag: 'Unavailable' }>
  | Extract<LicenseStatus, { readonly _tag: 'Unlicensed' }>
  | Extract<LicenseStatus, { readonly _tag: 'Invalid' }>;

/** A lock from which the user can activate (the installation identity is known). */
export type ActivatableLock = Exclude<Lock, { readonly _tag: 'Unavailable' }>;

export type Grant =
  /** The browser build is not licensed; it runs unrestricted as before. */
  | { readonly _tag: 'WebEdition' }
  | { readonly _tag: 'Licensed'; readonly installationId: InstallationId; readonly license: License };

export type Access =
  | { readonly _tag: 'Granted'; readonly grant: Grant }
  | { readonly _tag: 'Denied'; readonly lock: Lock };

export const accessFromStatus = (status: LicenseStatus): Access => {
  switch (status._tag) {
    case 'Active':
      return {
        _tag: 'Granted',
        grant: { _tag: 'Licensed', installationId: status.installationId, license: status.license },
      };
    case 'Unavailable':
    case 'Unlicensed':
    case 'Invalid':
      return { _tag: 'Denied', lock: status };
  }
};

/** The last calendar day (UTC, `YYYY-MM-DD`) on which a license with this expiry is valid. */
export const lastValidDay = (expiry: Extract<Expiry, { readonly _tag: 'At' }>): string =>
  new Date((expiry.at - 1) * 1000).toISOString().slice(0, 10);
