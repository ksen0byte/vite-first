// Decoders for the IPC contract defined in src-tauri/src/licensing.rs.
// Responses cross a process boundary, so they are parsed rather than trusted.

import { failure, flatMap, map, Result, success } from '../util/result.ts';
import type {
  ActivationRequestCode,
  Expiry,
  ImportOutcome,
  InstallationId,
  License,
  LicenseStatus,
  Rejection,
  UnixSeconds,
} from './domain.ts';

type Fields = Readonly<Record<string, unknown>>;
type Decoded<T> = Result<T, string>;

const record = (value: unknown, context: string): Decoded<Fields> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? success(value as Fields)
    : failure(`${context}: expected an object`);

const string = (fields: Fields, key: string): Decoded<string> => {
  const value = fields[key];
  return typeof value === 'string' ? success(value) : failure(`${key}: expected a string`);
};

const seconds = (fields: Fields, key: string): Decoded<UnixSeconds> => {
  const value = fields[key];
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? success(value as UnixSeconds)
    : failure(`${key}: expected unix seconds`);
};

const installationId = (fields: Fields, key: string): Decoded<InstallationId> =>
  map(string(fields, key), (value) => value as InstallationId);

const activationRequest = (fields: Fields): Decoded<ActivationRequestCode> =>
  map(string(fields, 'activationRequest'), (value) => value as ActivationRequestCode);

const nested = <T>(fields: Fields, key: string, decode: (value: unknown) => Decoded<T>): Decoded<T> =>
  decode(fields[key]);

const tagged = <T>(
  value: unknown,
  context: string,
  decodeByTag: (tag: string, fields: Fields) => Decoded<T>,
): Decoded<T> =>
  flatMap(record(value, context), (fields) =>
    flatMap(string(fields, '_tag'), (tag) => decodeByTag(tag, fields)),
  );

/** Applicative-style builder: collects decoded fields and fails on the first error. */
const all = <T extends object>(parts: { readonly [K in keyof T]: Decoded<T[K]> }): Decoded<T> => {
  const result: Partial<T> = {};
  for (const key of Object.keys(parts) as (keyof T)[]) {
    const part = parts[key];
    if (part._tag === 'Failure') return part;
    result[key] = part.value;
  }
  return success(result as T);
};

const decodeExpiry = (value: unknown): Decoded<Expiry> =>
  tagged<Expiry>(value, 'expiry', (tag, fields) => {
    switch (tag) {
      case 'Never':
        return success({ _tag: 'Never' });
      case 'At':
        return map(seconds(fields, 'at'), (at) => ({ _tag: 'At', at }));
      default:
        return failure(`expiry: unknown tag ${tag}`);
    }
  });

const decodeLicense = (value: unknown): Decoded<License> =>
  flatMap(record(value, 'license'), (fields) =>
    all<License>({
      licenseId: string(fields, 'licenseId'),
      licensee: string(fields, 'licensee'),
      issuedAt: seconds(fields, 'issuedAt'),
      expiry: nested(fields, 'expiry', decodeExpiry),
    }),
  );

const decodeRejection = (value: unknown): Decoded<Rejection> =>
  tagged<Rejection>(value, 'rejection', (tag, fields) => {
    switch (tag) {
      case 'Malformed':
        return map(string(fields, 'detail'), (detail) => ({ _tag: 'Malformed', detail }));
      case 'BadSignature':
        return success({ _tag: 'BadSignature' });
      case 'WrongInstallation':
        return map(installationId(fields, 'licensedInstallationId'), (licensedInstallationId) => ({
          _tag: 'WrongInstallation',
          licensedInstallationId,
        }));
      case 'Expired':
        return map(seconds(fields, 'expiredAt'), (expiredAt) => ({ _tag: 'Expired', expiredAt }));
      default:
        return failure(`rejection: unknown tag ${tag}`);
    }
  });

export const decodeLicenseStatus = (value: unknown): Decoded<LicenseStatus> =>
  tagged<LicenseStatus>(value, 'status', (tag, fields) => {
    switch (tag) {
      case 'Unavailable':
        return map(string(fields, 'reason'), (reason) => ({ _tag: 'Unavailable', reason }));
      case 'Unlicensed':
        return map(
          all({ installationId: installationId(fields, 'installationId'), activationRequest: activationRequest(fields) }),
          (parts) => ({ _tag: 'Unlicensed', ...parts }),
        );
      case 'Active':
        return map(
          all({ installationId: installationId(fields, 'installationId'), license: nested(fields, 'license', decodeLicense) }),
          (parts) => ({ _tag: 'Active', ...parts }),
        );
      case 'Invalid':
        return map(
          all({
            installationId: installationId(fields, 'installationId'),
            activationRequest: activationRequest(fields),
            rejection: nested(fields, 'rejection', decodeRejection),
          }),
          (parts) => ({ _tag: 'Invalid', ...parts }),
        );
      default:
        return failure(`status: unknown tag ${tag}`);
    }
  });

export const decodeImportOutcome = (value: unknown): Decoded<ImportOutcome> =>
  tagged<ImportOutcome>(value, 'import outcome', (tag, fields) => {
    switch (tag) {
      case 'Activated':
        return map(nested(fields, 'license', decodeLicense), (license) => ({ _tag: 'Activated', license }));
      case 'Rejected':
        return map(nested(fields, 'rejection', decodeRejection), (rejection) => ({ _tag: 'Rejected', rejection }));
      case 'Failed':
        return map(string(fields, 'reason'), (reason) => ({ _tag: 'Failed', reason }));
      default:
        return failure(`import outcome: unknown tag ${tag}`);
    }
  });
