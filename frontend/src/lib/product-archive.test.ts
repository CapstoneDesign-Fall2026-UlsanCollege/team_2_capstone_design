import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProductArchiveController,
  PendingArchiveState,
} from "./product-archive";

interface FakeProduct {
  id: number;
  name: string;
}

describe("createProductArchiveController (#61)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ticks 5 -> 4 -> 3 -> 2 -> 1 without cancelling itself and archives at 5s", async () => {
    const prodA: FakeProduct = { id: 1, name: "Nuwakot Roast" };
    const states: Array<PendingArchiveState<FakeProduct> | null> = [];
    const onArchive = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();

    const controller = createProductArchiveController<FakeProduct>({
      durationSeconds: 5,
      onArchive,
      onRefresh,
      onChange: (s) => states.push(s),
    });

    controller.scheduleArchive(prodA);
    expect(states).toEqual([{ item: prodA, remainingSeconds: 5 }]);

    await vi.advanceTimersByTimeAsync(1000);
    expect(states[states.length - 1]).toEqual({ item: prodA, remainingSeconds: 4 });
    expect(onArchive).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(3000);
    expect(states.map((s) => s?.remainingSeconds ?? null)).toEqual([5, 4, 3, 2, 1]);
    expect(onArchive).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onArchive).toHaveBeenCalledWith(prodA);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(states[states.length - 1]).toBeNull();
  });

  it("cancels both countdown and pending archive when undo() is clicked", async () => {
    const prodA: FakeProduct = { id: 2, name: "Ilam Orthodox" };
    const states: Array<PendingArchiveState<FakeProduct> | null> = [];
    const onArchive = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();

    const controller = createProductArchiveController<FakeProduct>({
      durationSeconds: 5,
      onArchive,
      onRefresh,
      onChange: (s) => states.push(s),
    });

    controller.scheduleArchive(prodA);
    await vi.advanceTimersByTimeAsync(2000);
    expect(states[states.length - 1]?.remainingSeconds).toBe(3);

    controller.undo();
    expect(states[states.length - 1]).toBeNull();

    await vi.advanceTimersByTimeAsync(10000);
    expect(onArchive).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("immediately archives previous product when another product archive is scheduled", async () => {
    const prodA: FakeProduct = { id: 10, name: "First Coffee" };
    const prodB: FakeProduct = { id: 11, name: "Second Coffee" };
    const states: Array<PendingArchiveState<FakeProduct> | null> = [];
    const onArchive = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();

    const controller = createProductArchiveController<FakeProduct>({
      durationSeconds: 5,
      onArchive,
      onRefresh,
      onChange: (s) => states.push(s),
    });

    controller.scheduleArchive(prodA);
    await vi.advanceTimersByTimeAsync(2000);

    controller.scheduleArchive(prodB);
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onArchive).toHaveBeenCalledWith(prodA);
    expect(states[states.length - 1]).toEqual({ item: prodB, remainingSeconds: 5 });

    await vi.advanceTimersByTimeAsync(4000);
    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(states[states.length - 1]).toEqual({ item: prodB, remainingSeconds: 1 });

    await vi.advanceTimersByTimeAsync(1000);
    expect(onArchive).toHaveBeenCalledTimes(2);
    expect(onArchive).toHaveBeenLastCalledWith(prodB);
    expect(states[states.length - 1]).toBeNull();
  });

  it("clears all timers and prevents callbacks after dispose()", async () => {
    const prodA: FakeProduct = { id: 99, name: "Disposed Coffee" };
    const onArchive = vi.fn().mockResolvedValue(undefined);
    const onRefresh = vi.fn();
    const onChange = vi.fn();

    const controller = createProductArchiveController<FakeProduct>({
      durationSeconds: 5,
      onArchive,
      onRefresh,
      onChange,
    });

    controller.scheduleArchive(prodA);
    await vi.advanceTimersByTimeAsync(2000);
    const changeCallsBeforeDispose = onChange.mock.calls.length;

    controller.dispose();
    await vi.advanceTimersByTimeAsync(10000);
    expect(onArchive).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(changeCallsBeforeDispose);
  });
});
