import {describe, expect, it} from 'vitest';
import AppContextManager from '../../src/config/AppContextManager.ts';
import {defaultAppContext, settings} from '../../src/config/settings.ts';

describe('context immutability', () => {
  it('getContext returns an independent personalData copy per call', () => {
    const a = AppContextManager.getContext();
    a.personalData.firstName = 'Hacked';
    const b = AppContextManager.getContext();
    expect(b.personalData.firstName).toBe('');
  });

  it('the frozen factory feedback tuning cannot be mutated through a fetched clone', () => {
    const def = settings.default.feedback;
    expect(Object.isFrozen(def)).toBe(true);
    // Mutation of a frozen object is a no-op (or throws in strict mode); value holds.
    const before = def.pause;
    try {
      // @ts-expect-error: intentional illegal mutation of a frozen object
      def.pause = 999;
    } catch {
      /* strict-mode throws are fine */
    }
    expect(def.pause).toBe(before);
  });

  it('the default app context test settings are frozen', () => {
    expect(Object.isFrozen(defaultAppContext.testSettings)).toBe(true);
  });
});
