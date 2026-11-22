export interface PendingArchiveState<T> {
  item: T;
  remainingSeconds: number;
}

export interface ProductArchiveControllerDeps<T> {
  durationSeconds?: number;
  onArchive: (item: T) => Promise<void>;
  onRefresh: () => void;
  onChange: (state: PendingArchiveState<T> | null) => void;
  onError?: (err: unknown, item: T) => void;
}

export interface ProductArchiveController<T> {
  scheduleArchive: (item: T) => void;
  undo: () => void;
  dispose: () => void;
}

/**
 * Manages the 5-second undo-able archive countdown outside React state effects
 * so countdown ticks never trigger effect cleanups that cancel the active timer.
 */
export function createProductArchiveController<T extends { id: number }>(
  deps: ProductArchiveControllerDeps<T>
): ProductArchiveController<T> {
  const durationSeconds = deps.durationSeconds ?? 5;
  let activeItem: T | null = null;
  let remainingSeconds = durationSeconds;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const clearTimers = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const scheduleArchive = (item: T) => {
    if (disposed) return;

    if (activeItem !== null) {
      const prevItem = activeItem;
      clearTimers();
      activeItem = null;
      void deps
        .onArchive(prevItem)
        .catch((err) => {
          deps.onError?.(err, prevItem);
        })
        .finally(() => {
          if (!disposed) {
            deps.onRefresh();
          }
        });
    }

    activeItem = item;
    remainingSeconds = durationSeconds;
    deps.onChange({ item, remainingSeconds });

    intervalId = setInterval(() => {
      if (disposed) {
        clearTimers();
        return;
      }
      remainingSeconds -= 1;
      if (remainingSeconds > 0) {
        deps.onChange({ item, remainingSeconds });
      } else if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }, 1000);

    timeoutId = setTimeout(async () => {
      clearTimers();
      const target = activeItem;
      activeItem = null;
      if (disposed || !target) return;
      deps.onChange(null);
      try {
        await deps.onArchive(target);
      } catch (err) {
        deps.onError?.(err, target);
      } finally {
        if (!disposed) {
          deps.onRefresh();
        }
      }
    }, durationSeconds * 1000);
  };

  const undo = () => {
    clearTimers();
    activeItem = null;
    if (!disposed) {
      deps.onChange(null);
    }
  };

  const dispose = () => {
    disposed = true;
    clearTimers();
    activeItem = null;
  };

  return {
    scheduleArchive,
    undo,
    dispose,
  };
}
