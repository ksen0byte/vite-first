// Infrastructure adapter: talks to the native licensing engine over Tauri IPC.

import { invoke, isTauri } from '@tauri-apps/api/core';
import { failure, Result, success } from '../util/result.ts';
import { Access, accessFromStatus, Grant, ImportOutcome, LicenseStatus, Lock } from './domain.ts';
import { decodeImportOutcome, decodeLicenseStatus } from './ipc.ts';

export type IpcError =
  | { readonly _tag: 'IpcFailed'; readonly message: string }
  | { readonly _tag: 'UnexpectedResponse'; readonly detail: string };

export interface LicensingPort {
  readonly status: () => Promise<Result<LicenseStatus, IpcError>>;
  readonly importLicense: (code: string) => Promise<Result<ImportOutcome, IpcError>>;
}

const call = async <T>(
  command: string,
  args: Readonly<Record<string, unknown>>,
  decode: (value: unknown) => Result<T, string>,
): Promise<Result<T, IpcError>> => {
  let response: unknown;
  try {
    response = await invoke<unknown>(command, args);
  } catch (error) {
    return failure({ _tag: 'IpcFailed', message: String(error) });
  }
  const decoded = decode(response);
  return decoded._tag === 'Success'
    ? success(decoded.value)
    : failure({ _tag: 'UnexpectedResponse', detail: decoded.error });
};

export const tauriLicensing: LicensingPort = {
  status: () => call('license_status', {}, decodeLicenseStatus),
  importLicense: (code) => call('import_license', { code }, decodeImportOutcome),
};

export const describeIpcError = (error: IpcError): string =>
  error._tag === 'IpcFailed' ? error.message : `unexpected response: ${error.detail}`;

export type Platform = { readonly _tag: 'Web' } | { readonly _tag: 'Desktop'; readonly licensing: LicensingPort };

export const detectPlatform = (): Platform =>
  isTauri() ? { _tag: 'Desktop', licensing: tauriLicensing } : { _tag: 'Web' };

export type Startup =
  | { readonly _tag: 'Run'; readonly grant: Grant }
  | { readonly _tag: 'Activate'; readonly lock: Lock; readonly licensing: LicensingPort };

/** Decides at startup whether the app may run. Only the desktop edition is licensed. */
export const resolveStartup = async (platform: Platform): Promise<Startup> => {
  switch (platform._tag) {
    case 'Web':
      return { _tag: 'Run', grant: { _tag: 'WebEdition' } };
    case 'Desktop': {
      const { licensing } = platform;
      const status = await licensing.status();
      const access: Access =
        status._tag === 'Success'
          ? accessFromStatus(status.value)
          : { _tag: 'Denied', lock: { _tag: 'Unavailable', reason: describeIpcError(status.error) } };
      return access._tag === 'Granted'
        ? { _tag: 'Run', grant: access.grant }
        : { _tag: 'Activate', lock: access.lock, licensing };
    }
  }
};
