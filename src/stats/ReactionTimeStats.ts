// ReactionTimeStats.ts

export interface FrequencyBin {
  binStart: number;
  binEnd: number;
  frequency: number;
}

export class ReactionTimeStats {
  /**
   * Groups data into bins (classes) of width `binWidth`.
   */
  public static computeFrequencyDistribution(
    data: number[],
    binWidth: number
  ): FrequencyBin[] {
    if (data.length === 0) return [];

    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);

    // Round down to nearest multiple of binWidth
    const binStart = Math.floor(minVal / binWidth) * binWidth;
    // Round up
    const binEnd = Math.ceil(maxVal / binWidth) * binWidth;

    const bins: FrequencyBin[] = [];
    for (let start = binStart; start <= binEnd; start += binWidth) {
      bins.push({
        binStart: start,
        binEnd: start + binWidth - 1,
        frequency: 0
      });
    }

    // Count frequency
    data.forEach((value) => {
      const index = Math.floor((value - binStart) / binWidth);
      if (index >= 0 && index < bins.length) {
        bins[index].frequency += 1;
      }
    });

    return bins;
  }

  /**
   * Returns the bin with the highest frequency.
   */
  public static findModeClass(bins: FrequencyBin[]): FrequencyBin | null {
    if (!bins.length) return null;
    return bins.reduce((best, current) =>
      current.frequency > best.frequency ? current : best
    );
  }
}
