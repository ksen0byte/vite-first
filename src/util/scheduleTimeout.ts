let timeoutIds: number[] = [];

/**
 * Wraps `setTimeout` in a function so we can track and clear all timeouts.
 */
export function scheduleTimeout(callback: () => void, delay: number): number {
  const id = window.setTimeout(callback, delay);
  timeoutIds.push(id);
  return id;
}

/**
 * Clears all timeouts that were scheduled with `scheduleTimeout`.
 */
export function clearAllTimeouts() {
  for (const id of timeoutIds) {
    clearTimeout(id);
  }
  timeoutIds = [];
}
