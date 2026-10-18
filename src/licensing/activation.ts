// State machine of the activation screen: awaiting a license → verifying → activated.

import { failure, Result, success } from '../util/result.ts';
import type { ActivatableLock, ImportOutcome, InstallationId, License, Rejection } from './domain.ts';

export type Feedback =
  | { readonly _tag: 'None' }
  | { readonly _tag: 'StoredLicenseInvalid'; readonly rejection: Rejection }
  | { readonly _tag: 'EmptyInput' }
  | { readonly _tag: 'Rejected'; readonly rejection: Rejection }
  | { readonly _tag: 'SaveFailed'; readonly reason: string }
  | { readonly _tag: 'CommunicationFailed'; readonly message: string };

export type ActivationState =
  | { readonly _tag: 'AwaitingLicense'; readonly lock: ActivatableLock; readonly feedback: Feedback }
  | { readonly _tag: 'Verifying'; readonly lock: ActivatableLock; readonly code: string }
  | { readonly _tag: 'Activated'; readonly installationId: InstallationId; readonly license: License };

export type ActivationEvent =
  | { readonly _tag: 'Submitted'; readonly code: string }
  | { readonly _tag: 'OutcomeReceived'; readonly outcome: ImportOutcome }
  | { readonly _tag: 'CommunicationFailed'; readonly message: string };

export interface IllegalTransition {
  readonly _tag: 'IllegalTransition';
  readonly state: ActivationState['_tag'];
  readonly event: ActivationEvent['_tag'];
}

export const initialActivationState = (lock: ActivatableLock): ActivationState => ({
  _tag: 'AwaitingLicense',
  lock,
  feedback: lock._tag === 'Invalid' ? { _tag: 'StoredLicenseInvalid', rejection: lock.rejection } : { _tag: 'None' },
});

const illegal = (state: ActivationState, event: ActivationEvent): Result<ActivationState, IllegalTransition> =>
  failure({ _tag: 'IllegalTransition', state: state._tag, event: event._tag });

const awaiting = (lock: ActivatableLock, feedback: Feedback): ActivationState => ({
  _tag: 'AwaitingLicense',
  lock,
  feedback,
});

export const transition = (
  state: ActivationState,
  event: ActivationEvent,
): Result<ActivationState, IllegalTransition> => {
  switch (state._tag) {
    case 'Activated':
      return illegal(state, event);
    case 'AwaitingLicense': {
      if (event._tag !== 'Submitted') return illegal(state, event);
      const code = event.code.trim();
      return success(
        code === '' ? awaiting(state.lock, { _tag: 'EmptyInput' }) : { _tag: 'Verifying', lock: state.lock, code },
      );
    }
    case 'Verifying':
      switch (event._tag) {
        case 'Submitted':
          return illegal(state, event);
        case 'CommunicationFailed':
          return success(awaiting(state.lock, { _tag: 'CommunicationFailed', message: event.message }));
        case 'OutcomeReceived': {
          const outcome = event.outcome;
          switch (outcome._tag) {
            case 'Activated':
              return success({
                _tag: 'Activated',
                installationId: state.lock.installationId,
                license: outcome.license,
              });
            case 'Rejected':
              return success(awaiting(state.lock, { _tag: 'Rejected', rejection: outcome.rejection }));
            case 'Failed':
              return success(awaiting(state.lock, { _tag: 'SaveFailed', reason: outcome.reason }));
          }
        }
      }
  }
};
