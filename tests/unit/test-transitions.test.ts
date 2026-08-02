import {describe, expect, it} from 'vitest';
import {TrialResult} from '../../src/config/domain.ts';
import {toCountingDown, toDelayed, toFinished, toIdle, toShowingStimulus, toSpamDetected} from '../../src/domain/test-state.ts';

describe('test-state transition values', () => {
  it('represents the idle-to-countdown-to-delay-to-stimulus workflow', () => {
    expect(toIdle()).toEqual({_tag: 'Idle'});
    expect(toCountingDown(3)).toEqual({_tag: 'CountingDown', count: 3});
    expect(toDelayed(0, 500)).toEqual({_tag: 'Delayed', stimulusIndex: 0, delayMs: 500});
    expect(toShowingStimulus(0, 1234, 'circle')).toEqual({
      _tag: 'ShowingStimulus', stimulusIndex: 0, startTime: 1234, stimulusValue: 'circle',
    });
  });

  it('keeps recorded trial results when the final stimulus finishes', () => {
    const trials = new Map<number, TrialResult>([[0, {
      trialIndex: 0, stimulus: 'circle', reactionTime: 250, outcome: 'Success', expectedAction: 'DEFAULT', actualAction: 'DEFAULT',
    }]]);

    expect(toFinished(trials)).toEqual({_tag: 'Finished', reactionTimes: trials});
  });

  it('uses an explicit terminal spam state', () => {
    expect(toSpamDetected()).toEqual({_tag: 'SpamDetected'});
  });
});
