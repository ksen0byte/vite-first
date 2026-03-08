// src/util/result.ts

export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly _tag: 'Success';
  readonly value: T;
}

export interface Failure<E> {
  readonly _tag: 'Failure';
  readonly error: E;
}

export const success = <T>(value: T): Success<T> => ({
  _tag: 'Success',
  value,
});

export const failure = <E>(error: E): Failure<E> => ({
  _tag: 'Failure',
  error,
});

export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
  result._tag === 'Success';

export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
  result._tag === 'Failure';

export const map = <T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> => {
  if (isSuccess(result)) {
    return success(fn(result.value));
  }
  return result;
};

export const flatMap = <T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => {
  if (isSuccess(result)) {
    return fn(result.value);
  }
  return result;
};

export const getOrElse = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  if (isSuccess(result)) {
    return result.value;
  }
  return defaultValue;
};
