import { describe, expect, it } from 'vitest';
import { decodeImportOutcome, decodeLicenseStatus } from '../../src/licensing/ipc.ts';
import { accessFromStatus, lastValidDay, LicenseStatus, UnixSeconds } from '../../src/licensing/domain.ts';
import { ActivationState, initialActivationState, transition } from '../../src/licensing/activation.ts';
import { resolveStartup, LicensingPort } from '../../src/licensing/tauri-licensing.ts';
import { failure, Result, success } from '../../src/util/result.ts';

const license = {
  licenseId: 'L-0001',
  licensee: 'Test Clinic',
  issuedAt: 1_000,
  expiry: { _tag: 'At', at: 1_830_297_600 },
};

const unlicensed = {
  _tag: 'Unlicensed',
  installationId: '3F2A-9C01-77BE-0D4E-A1C5',
  activationRequest: 'CNS-REQ1:abc',
};

const valueOf = <T, E>(result: Result<T, E>): T => {
  if (result._tag === 'Failure') throw new Error(`expected success, got ${JSON.stringify(result.error)}`);
  return result.value;
};

describe('licensing IPC decoding', () => {
  it('decodes every status variant produced by the native engine', () => {
    expect(valueOf(decodeLicenseStatus(unlicensed))._tag).toBe('Unlicensed');
    expect(valueOf(decodeLicenseStatus({ _tag: 'Unavailable', reason: 'no machine id' }))).toEqual({
      _tag: 'Unavailable',
      reason: 'no machine id',
    });
    expect(
      valueOf(decodeLicenseStatus({ _tag: 'Active', installationId: '3F2A-9C01-77BE-0D4E-A1C5', license })),
    ).toEqual({ _tag: 'Active', installationId: '3F2A-9C01-77BE-0D4E-A1C5', license });
    expect(
      valueOf(
        decodeLicenseStatus({
          ...unlicensed,
          _tag: 'Invalid',
          rejection: { _tag: 'WrongInstallation', licensedInstallationId: '0000-0000-0000-0000-0000' },
        }),
      ),
    ).toMatchObject({ _tag: 'Invalid', rejection: { _tag: 'WrongInstallation' } });
  });

  it('decodes import outcomes', () => {
    expect(valueOf(decodeImportOutcome({ _tag: 'Activated', license }))).toEqual({ _tag: 'Activated', license });
    expect(valueOf(decodeImportOutcome({ _tag: 'Rejected', rejection: { _tag: 'BadSignature' } }))).toEqual({
      _tag: 'Rejected',
      rejection: { _tag: 'BadSignature' },
    });
    expect(valueOf(decodeImportOutcome({ _tag: 'Failed', reason: 'disk full' }))._tag).toBe('Failed');
  });

  it('rejects responses that do not match the contract', () => {
    expect(decodeLicenseStatus(null)._tag).toBe('Failure');
    expect(decodeLicenseStatus({ _tag: 'Active', installationId: 'x' })._tag).toBe('Failure');
    expect(decodeLicenseStatus({ _tag: 'Licensed' })._tag).toBe('Failure');
    expect(decodeImportOutcome({ _tag: 'Activated', license: { ...license, issuedAt: '1000' } })._tag).toBe('Failure');
    expect(decodeImportOutcome({ _tag: 'Rejected', rejection: { _tag: 'Expired', expiredAt: -1 } })._tag).toBe('Failure');
  });
});

describe('access decision', () => {
  it('grants access only for an active license', () => {
    const active = valueOf(decodeLicenseStatus({ _tag: 'Active', installationId: '3F2A-9C01-77BE-0D4E-A1C5', license }));
    expect(accessFromStatus(active)._tag).toBe('Granted');
    expect(accessFromStatus(valueOf(decodeLicenseStatus(unlicensed)))._tag).toBe('Denied');
  });

  it('reports the inclusive last valid day for an exclusive expiry instant', () => {
    // 2028-01-01T00:00:00Z is exclusive, so the license is valid through 2027-12-31.
    expect(lastValidDay({ _tag: 'At', at: 1_830_297_600 as UnixSeconds })).toBe('2027-12-31');
  });

  it('runs the web edition unrestricted and locks the desktop edition until licensed', async () => {
    const port = (status: LicenseStatus): LicensingPort => ({
      status: async () => success(status),
      importLicense: async () => failure({ _tag: 'IpcFailed', message: 'unused' }),
    });
    expect(await resolveStartup({ _tag: 'Web' })).toEqual({ _tag: 'Run', grant: { _tag: 'WebEdition' } });

    const locked = await resolveStartup({ _tag: 'Desktop', licensing: port(valueOf(decodeLicenseStatus(unlicensed))) });
    expect(locked).toMatchObject({ _tag: 'Activate', lock: { _tag: 'Unlicensed' } });

    const broken: LicensingPort = {
      status: async () => failure({ _tag: 'IpcFailed', message: 'bridge down' }),
      importLicense: async () => failure({ _tag: 'IpcFailed', message: 'bridge down' }),
    };
    expect(await resolveStartup({ _tag: 'Desktop', licensing: broken })).toMatchObject({
      _tag: 'Activate',
      lock: { _tag: 'Unavailable', reason: 'bridge down' },
    });

    const active = valueOf(decodeLicenseStatus({ _tag: 'Active', installationId: '3F2A-9C01-77BE-0D4E-A1C5', license }));
    expect(await resolveStartup({ _tag: 'Desktop', licensing: port(active) })).toMatchObject({
      _tag: 'Run',
      grant: { _tag: 'Licensed', license: { licensee: 'Test Clinic' } },
    });
  });
});

describe('activation state machine', () => {
  const lock = valueOf(decodeLicenseStatus(unlicensed));
  if (lock._tag !== 'Unlicensed') throw new Error('fixture must be unlicensed');
  const start = initialActivationState(lock);
  const step = (state: ActivationState, event: Parameters<typeof transition>[1]) => valueOf(transition(state, event));

  it('verifies a submitted license and activates on success', () => {
    const verifying = step(start, { _tag: 'Submitted', code: '  CNS-LIC1:xyz \n' });
    expect(verifying).toMatchObject({ _tag: 'Verifying', code: 'CNS-LIC1:xyz' });
    const activated = step(verifying, {
      _tag: 'OutcomeReceived',
      outcome: valueOf(decodeImportOutcome({ _tag: 'Activated', license })),
    });
    expect(activated).toMatchObject({ _tag: 'Activated', installationId: '3F2A-9C01-77BE-0D4E-A1C5' });
  });

  it('stays locked with explicit feedback on rejection, save failure, IPC failure and empty input', () => {
    expect(step(start, { _tag: 'Submitted', code: '   ' })).toMatchObject({ feedback: { _tag: 'EmptyInput' } });

    const verifying = step(start, { _tag: 'Submitted', code: 'CNS-LIC1:xyz' });
    expect(
      step(verifying, { _tag: 'OutcomeReceived', outcome: { _tag: 'Rejected', rejection: { _tag: 'BadSignature' } } }),
    ).toMatchObject({ _tag: 'AwaitingLicense', feedback: { _tag: 'Rejected', rejection: { _tag: 'BadSignature' } } });
    expect(
      step(verifying, { _tag: 'OutcomeReceived', outcome: { _tag: 'Failed', reason: 'read-only' } }),
    ).toMatchObject({ _tag: 'AwaitingLicense', feedback: { _tag: 'SaveFailed', reason: 'read-only' } });
    expect(step(verifying, { _tag: 'CommunicationFailed', message: 'bridge down' })).toMatchObject({
      _tag: 'AwaitingLicense',
      feedback: { _tag: 'CommunicationFailed' },
    });
  });

  it('surfaces why a stored license stopped working', () => {
    const invalid = valueOf(
      decodeLicenseStatus({ ...unlicensed, _tag: 'Invalid', rejection: { _tag: 'Expired', expiredAt: 5 } }),
    );
    if (invalid._tag !== 'Invalid') throw new Error('fixture must be invalid');
    expect(initialActivationState(invalid)).toMatchObject({
      feedback: { _tag: 'StoredLicenseInvalid', rejection: { _tag: 'Expired' } },
    });
  });

  it('rejects illegal transitions explicitly', () => {
    const verifying = step(start, { _tag: 'Submitted', code: 'CNS-LIC1:xyz' });
    expect(transition(verifying, { _tag: 'Submitted', code: 'again' })).toEqual({
      _tag: 'Failure',
      error: { _tag: 'IllegalTransition', state: 'Verifying', event: 'Submitted' },
    });
    expect(transition(start, { _tag: 'CommunicationFailed', message: 'x' })._tag).toBe('Failure');
  });
});
