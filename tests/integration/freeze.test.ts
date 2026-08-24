import {describe, expect, it} from 'vitest';
import AppContextManager from '../../src/config/AppContextManager.ts';
import {defaultAppContext, settings} from '../../src/config/settings.ts';

describe('context immutability', () => {
  it('mutating the returned context does not poison factory defaults', () => {
    const context = AppContextManager.getContext();
    context.testSettings.feedback.pause = 12345;
    context.personalData.firstName = 'Hacked';
    const fresh = AppContextManager.getContext();
    expect(fresh.testSettings.feedback.pause).toBe(defaultAppContext.testSettings.feedback.pause);
    expect(fresh.personalData.firstName).toBe('');
    expect(Object.isFrozen(settings.default.feedback)).toBe(true);
    expect(Object.isFrozen(defaultAppContext.testSettings)).toBe(true);
  });
});
