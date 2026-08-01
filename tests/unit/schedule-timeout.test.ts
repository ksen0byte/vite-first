import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserScheduler } from '../../src/util/scheduleTimeout.ts';

describe('BrowserScheduler', () => {
  afterEach(() => vi.useRealTimers());

  it('executes scheduled work', () => {
    vi.useFakeTimers();
    const scheduler = new BrowserScheduler();
    const callback = vi.fn();

    scheduler.schedule(callback, 100);
    vi.advanceTimersByTime(100);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('cancels one task without cancelling other tasks', () => {
    vi.useFakeTimers();
    const scheduler = new BrowserScheduler();
    const cancelledCallback = vi.fn();
    const activeCallback = vi.fn();
    const task = scheduler.schedule(cancelledCallback, 100);
    scheduler.schedule(activeCallback, 100);

    task.cancel();
    vi.advanceTimersByTime(100);

    expect(cancelledCallback).not.toHaveBeenCalled();
    expect(activeCallback).toHaveBeenCalledTimes(1);
  });

  it('cancels all work and permits repeated cancellation', () => {
    vi.useFakeTimers();
    const scheduler = new BrowserScheduler();
    const callback = vi.fn();
    const task = scheduler.schedule(callback, 100);

    task.cancel();
    task.cancel();
    scheduler.cancelAll();
    scheduler.cancelAll();
    vi.advanceTimersByTime(100);

    expect(callback).not.toHaveBeenCalled();
  });
});
