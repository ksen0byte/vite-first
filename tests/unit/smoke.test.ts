import { describe, expect, it } from 'vitest';
import { failure, isFailure, isSuccess, success } from '../../src/util/result.ts';

describe('Result constructors and type guards', () => {
  it('constructs and recognizes success values', () => {
    const result = success(42);

    expect(isSuccess(result)).toBe(true);
    expect(isFailure(result)).toBe(false);
    expect(result).toEqual({ _tag: 'Success', value: 42 });
  });

  it('constructs and recognizes failure values', () => {
    const result = failure('fixture failure');

    expect(isFailure(result)).toBe(true);
    expect(isSuccess(result)).toBe(false);
    expect(result).toEqual({ _tag: 'Failure', error: 'fixture failure' });
  });
});
