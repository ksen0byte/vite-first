import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserScheduler } from '../../src/util/scheduleTimeout.ts';
import {DeterministicScheduler} from '../support/deterministic-scheduler.ts';

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

describe('DeterministicScheduler', () => {
  it('drains nested scheduled work in chronological order', () => {
    const scheduler = new DeterministicScheduler();
    const events: string[] = [];

    scheduler.schedule(() => {
      events.push(`first:${scheduler.now()}`);
      scheduler.schedule(() => events.push(`nested:${scheduler.now()}`), 50);
    }, 100);

    scheduler.advanceBy(150);

    expect(events).toEqual(['first:100', 'nested:150']);
    expect(scheduler.now()).toBe(150);
  });

  it('does not run cancelled work', () => {
    const scheduler = new DeterministicScheduler();
    const callback = vi.fn();
    const task = scheduler.schedule(callback, 100);

    task.cancel();
    scheduler.advanceBy(100);

    expect(callback).not.toHaveBeenCalled();
  });
});
