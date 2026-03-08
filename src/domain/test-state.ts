// src/domain/test-state.ts

import { TestSettings } from "../config/domain";
import { EXPOSITION_DELAY_SEQUENCE, getStimulusFromSequence } from "./stimulus-sequences";

export type TestState =
  | IdleState
  | CountingDownState
  | DelayedState
  | ShowingStimulusState
  | SpamDetectedState
  | FinishedState;

export interface IdleState {
  readonly _tag: 'Idle';
}

export interface CountingDownState {
  readonly _tag: 'CountingDown';
  readonly count: number;
}

export interface DelayedState {
  readonly _tag: 'Delayed';
  readonly stimulusIndex: number;
  readonly delayMs: number;
  readonly startTime: number;
}

export interface ShowingStimulusState {
  readonly _tag: 'ShowingStimulus';
  readonly stimulusIndex: number;
  readonly startTime: number;
  readonly stimulusValue: string; // "red" or whatever
}

export interface SpamDetectedState {
  readonly _tag: 'SpamDetected';
}

export interface FinishedState {
  readonly _tag: 'Finished';
  readonly reactionTimes: Map<number, number>;
}

// Transitions

export const toIdle = (): IdleState => ({ _tag: 'Idle' });

export const toCountingDown = (count: number): CountingDownState => ({
  _tag: 'CountingDown',
  count,
});

export const toDelayed = (
  stimulusIndex: number,
  delayMs: number,
  startTime: number
): DelayedState => ({
  _tag: 'Delayed',
  stimulusIndex,
  delayMs,
  startTime,
});

export const toShowingStimulus = (
  stimulusIndex: number,
  startTime: number,
  stimulusValue: string
): ShowingStimulusState => ({
  _tag: 'ShowingStimulus',
  stimulusIndex,
  startTime,
  stimulusValue,
});

export const toSpamDetected = (): SpamDetectedState => ({ _tag: 'SpamDetected' });

export const toFinished = (reactionTimes: Map<number, number>): FinishedState => ({
  _tag: 'Finished',
  reactionTimes,
});

// Domain logic helpers

export function getNextDelay(settings: TestSettings, stimulusIndex: number): number {
  if (settings.usePregenerated.exposureDelay) {
    return getStimulusFromSequence(EXPOSITION_DELAY_SEQUENCE, stimulusIndex);
  }
  const [min, max] = settings.exposureDelay;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
