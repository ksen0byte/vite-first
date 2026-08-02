import { HandAction, TestType, TrialOutcome } from '../config/domain.ts';
import {
  isAnimal,
  isCircle,
  isGreen,
  isPlant,
  isRed,
  isSquare,
} from './stimulus-sequences.ts';
import { Stimulus } from './types.ts';

export type InputCode =
  | 'Space'
  | 'ControlRight'
  | 'ShiftRight'
  | 'ArrowRight'
  | 'ControlLeft'
  | 'ShiftLeft'
  | 'ArrowLeft';

const DEFAULT_INPUT_CODES: readonly InputCode[] = ['Space'];
const RIGHT_INPUT_CODES: readonly InputCode[] = ['ControlRight', 'ShiftRight', 'ArrowRight'];
const LEFT_INPUT_CODES: readonly InputCode[] = ['ControlLeft', 'ShiftLeft', 'ArrowLeft'];
const CRT2_3_INPUT_CODES: readonly InputCode[] = [
  ...DEFAULT_INPUT_CODES,
  ...RIGHT_INPUT_CODES,
  ...LEFT_INPUT_CODES,
];

const isInputCode = (code: string): code is InputCode =>
  CRT2_3_INPUT_CODES.includes(code as InputCode);

const assertNever = (value: never): never => {
  throw new Error(`Unexpected value: ${String(value)}`);
};

export function isAcceptedTrialInput(testType: TestType, code: string): code is InputCode {
  if (!isInputCode(code)) {
    return false;
  }

  switch (testType) {
    case 'svmr':
    case 'crt1-3':
      return DEFAULT_INPUT_CODES.includes(code);
    case 'crt2-3':
      return CRT2_3_INPUT_CODES.includes(code);
    default:
      return assertNever(testType);
  }
}

export function mapInputCode(code: InputCode): HandAction {
  switch (code) {
    case 'Space':
      return 'DEFAULT';
    case 'ControlRight':
    case 'ShiftRight':
    case 'ArrowRight':
      return 'RIGHT';
    case 'ControlLeft':
    case 'ShiftLeft':
    case 'ArrowLeft':
      return 'LEFT';
    default:
      return assertNever(code);
  }
}

export function getExpectedAction(stimulus: Stimulus, testType: TestType): HandAction {
  switch (testType) {
    case 'svmr':
      return 'DEFAULT';
    case 'crt1-3':
      return isRed(stimulus) || isSquare(stimulus) || isAnimal(stimulus) ? 'DEFAULT' : 'NONE';
    case 'crt2-3':
      if (isRed(stimulus) || isSquare(stimulus) || isAnimal(stimulus)) {
        return 'RIGHT';
      }
      if (isGreen(stimulus) || isCircle(stimulus) || isPlant(stimulus)) {
        return 'LEFT';
      }
      return 'NONE';
    default:
      return assertNever(testType);
  }
}

export function classifyResponse(
  testType: TestType,
  expectedAction: HandAction,
  actualAction: HandAction,
): TrialOutcome {
  switch (testType) {
    case 'svmr':
    case 'crt1-3':
      return expectedAction === 'NONE' ? 'FalseAlarm' : 'Success';
    case 'crt2-3':
      if (expectedAction === 'NONE') {
        return 'FalseAlarm';
      }
      return actualAction === expectedAction ? 'Success' : 'MixUp';
    default:
      return assertNever(testType);
  }
}
