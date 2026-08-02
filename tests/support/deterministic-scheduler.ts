import {ScheduledTask, Scheduler} from '../../src/util/scheduleTimeout.ts';

interface PendingTask {
  readonly id: number;
  readonly runAt: number;
  readonly callback: () => void;
  cancelled: boolean;
}

export class DeterministicScheduler implements Scheduler {
  private currentTime = 0;
  private nextId = 0;
  private readonly tasks = new Map<number, PendingTask>();

  public schedule(callback: () => void, delayMs: number): ScheduledTask {
    const task: PendingTask = {
      id: this.nextId++,
      runAt: this.currentTime + delayMs,
      callback,
      cancelled: false,
    };
    this.tasks.set(task.id, task);

    return {
      cancel: () => {
        const pending = this.tasks.get(task.id);
        if (!pending || pending.cancelled) return;
        pending.cancelled = true;
        this.tasks.delete(task.id);
      },
    };
  }

  public cancelAll(): void {
    this.tasks.clear();
  }

  public now(): number {
    return this.currentTime;
  }

  public advanceBy(delayMs: number): void {
    const targetTime = this.currentTime + delayMs;

    while (true) {
      const nextTask = this.getNextTask(targetTime);
      if (!nextTask) break;

      this.currentTime = nextTask.runAt;
      this.tasks.delete(nextTask.id);
      if (!nextTask.cancelled) nextTask.callback();
    }

    this.currentTime = targetTime;
  }

  private getNextTask(targetTime: number): PendingTask | undefined {
    let nextTask: PendingTask | undefined;
    for (const task of this.tasks.values()) {
      if (task.cancelled || task.runAt > targetTime) continue;
      if (!nextTask || task.runAt < nextTask.runAt || (task.runAt === nextTask.runAt && task.id < nextTask.id)) {
        nextTask = task;
      }
    }
    return nextTask;
  }
}
