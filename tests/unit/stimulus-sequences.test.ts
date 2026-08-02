import { describe, expect, it } from 'vitest';
import {
  COLOR_SEQUENCE,
  COMBINED_SEQUENCE_EN,
  COMBINED_SEQUENCE_UA,
  EXPOSITION_DELAY_SEQUENCE,
  getStimulusFromSequence,
  isAnimal,
  isCircle,
  isGreen,
  isNonLiving,
  isPlant,
  isRed,
  isSquare,
  isTriangle,
  isYellow,
  SHAPE_SEQUENCE,
  WORD_SEQUENCE_EN,
  WORD_SEQUENCE_UA,
} from '../../src/domain/stimulus-sequences.ts';

describe('stimulus sequences', () => {
  it('returns the last element and wraps to the first element', () => {
    const sequence = ['first', 'last'] as const;

    expect(getStimulusFromSequence(sequence, 1)).toBe('last');
    expect(getStimulusFromSequence(sequence, 2)).toBe('first');
  });

  it('records the current characterization lengths', () => {
    expect(EXPOSITION_DELAY_SEQUENCE).toHaveLength(120);
    expect(SHAPE_SEQUENCE).toHaveLength(120);
    expect(WORD_SEQUENCE_EN).toHaveLength(120);
    expect(WORD_SEQUENCE_UA).toHaveLength(120);
    expect(COLOR_SEQUENCE).toHaveLength(120);
    expect(COMBINED_SEQUENCE_EN).toHaveLength(120);
    expect(COMBINED_SEQUENCE_UA).toHaveLength(120);
  });
});

describe('stimulus classification predicates', () => {
  it('classifies shapes and rejects a non-shape', () => {
    expect(isSquare('square')).toBe(true);
    expect(isCircle('circle')).toBe(true);
    expect(isTriangle('triangle')).toBe(true);
    expect(isSquare('red')).toBe(false);
  });

  it('classifies colors and rejects a non-color', () => {
    expect(isRed('red')).toBe(true);
    expect(isGreen('green')).toBe(true);
    expect(isYellow('yellow')).toBe(true);
    expect(isYellow('circle')).toBe(false);
  });

  it('classifies English animal, plant, and non-living examples', () => {
    expect(isAnimal('cat')).toBe(true);
    expect(isPlant('pine')).toBe(true);
    expect(isNonLiving('door')).toBe(true);
  });

  it('classifies Ukrainian animal, plant, and non-living examples from the current sequence', () => {
    expect(isAnimal(WORD_SEQUENCE_UA[3]!)).toBe(true);
    expect(isPlant(WORD_SEQUENCE_UA[1]!)).toBe(true);
    expect(isNonLiving(WORD_SEQUENCE_UA[0]!)).toBe(true);
  });

  it('rejects an example from each non-matching word category', () => {
    expect(isAnimal('pine')).toBe(false);
    expect(isPlant('cat')).toBe(false);
    expect(isNonLiving('cat')).toBe(false);
  });
});
