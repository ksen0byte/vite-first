export type Gender = 'male' | 'female';

export type BiologicalAgeResult = {
  biologicalAge: number; // years
  tempoBiologicalDevelopment: number; // TBD = Biological Age / Chronological Age
  interpretation: 'biologicalAgeInterpretationAccelerated' | 'biologicalAgeInterpretationNormal' | 'biologicalAgeInterpretationDelayed';
};

/**
 * Biological Age Calculator based on normative mean reaction time tables for ages 7–16.
 *
 * NOTE: The coefficients below are placeholders intended to be replaced by exact values
 * from Patent №126671 normative tables. The algorithm is designed to work with exact tables
 * via simple linear interpolation between adjacent ages.
 */
export class BiologicalAgeCalculator {
  /**
   * Normative mean reaction time (ms) table by age and gender for 7–16 y.o.
   * Source: Patent materials (table in the attached document/screenshot).
   */
  public static readonly normativeMs: Record<Gender, Record<number, number>> = {
    male: {
      7: 357.86,
      8: 344.72,
      9: 302.67,
      10: 295.73,
      11: 264.15,
      12: 262.26,
      13: 248.71,
      14: 243.6,
      15: 235.9,
      16: 231.6,
    },
    female: {
      7: 387.06,
      8: 347.32,
      9: 311.79,
      10: 304.15,
      11: 272.93,
      12: 268.74,
      13: 256.78,
      14: 251.77,
      15: 247.3,
      16: 239.4,
    }
  };

  /**
   * Returns normative RT for a given (possibly fractional) age using linear interpolation
   * between adjacent ages from the normative table.
   */
  public static getNormativeRtMs(ageYears: number, gender: Gender): number | null {
    if (!Number.isFinite(ageYears)) return null;
    const table = this.normativeMs[gender];
    const ages = Object.keys(table).map(Number).sort((a, b) => a - b);
    const minA = ages[0], maxA = ages[ages.length - 1];
    if (ageYears <= minA) return table[minA];
    if (ageYears >= maxA) return table[maxA];
    // find surrounding integer ages
    const lower = Math.floor(ageYears);
    const upper = Math.ceil(ageYears);
    if (lower === upper) return table[lower];
    const rtLower = table[lower];
    const rtUpper = table[upper];
    const t = (ageYears - lower) / (upper - lower);
    return rtLower + (rtUpper - rtLower) * t;
  }

  /**
   * Calculates Biological Age (BA) by inverting the normative function RT(age, gender) using
   * linear interpolation. Also returns TBD = BA / CA and a categorical interpretation.
   *
   * @param meanRtMs mean reaction time in milliseconds
   * @param chronologicalAge age in years (expected 7..16)
   * @param gender 'male' | 'female'
   */
  static calculate(meanRtMs: number, chronologicalAge: number, gender: Gender): BiologicalAgeResult | null {
    if (!Number.isFinite(meanRtMs) || meanRtMs <= 0) return null;
    if (!Number.isFinite(chronologicalAge) || chronologicalAge < 7 || chronologicalAge > 16) return null;

    // Normative sensorimotor reaction time for the person's age
    const normative = this.getNormativeRtMs(chronologicalAge, gender);
    if (!normative) return null;

    // TBR = CF / CRt (actual divided by table normative)
    const tempo = meanRtMs / normative;
    // Biological Age = CA / TBR
    const biologicalAge = chronologicalAge / tempo;
    return { biologicalAge, tempoBiologicalDevelopment: tempo, interpretation: this.interpret(tempo) };
  }

  private static interpret(tbr: number): BiologicalAgeResult['interpretation'] {
    // According to the text near the table: most TBR values are in 0.95..1.1
    // TBR < 0.95 — accelerated development (BA > CA) => Older
    // 0.95 <= TBR <= 1.1 — within age norm => Same
    // TBR > 1.1 — delayed development (BA < CA) => Younger
    if (tbr < 0.95) return 'biologicalAgeInterpretationDelayed';
    if (tbr > 1.1) return 'biologicalAgeInterpretationAccelerated';
    return 'biologicalAgeInterpretationNormal';
  }
}
