export interface ScheduledTask {
  readonly cancel: () => void;
}

export interface Scheduler {
  schedule(callback: () => void, delayMs: number): ScheduledTask;
  cancelAll(): void;
}

export class BrowserScheduler implements Scheduler {
  private readonly taskIds = new Set<ReturnType<typeof setTimeout>>();

  public schedule(callback: () => void, delayMs: number): ScheduledTask {
    let cancelled = false;
    const taskId = setTimeout(() => {
      this.taskIds.delete(taskId);
      if (!cancelled) callback();
    }, delayMs);
    this.taskIds.add(taskId);

    return {
      cancel: () => {
        if (cancelled) return;
        cancelled = true;
        clearTimeout(taskId);
        this.taskIds.delete(taskId);
      },
    };
  }

  public cancelAll(): void {
    for (const taskId of this.taskIds) clearTimeout(taskId);
    this.taskIds.clear();
  }
}
