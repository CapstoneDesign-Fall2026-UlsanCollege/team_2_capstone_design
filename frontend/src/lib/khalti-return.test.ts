import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./api";
import {
  _resetKhaltiVerifyCacheForTests,
  createKhaltiReturnController,
  KHALTI_MAX_POLL_MS,
  KHALTI_POLL_INTERVAL_MS,
  KhaltiReturnSnapshot,
} from "./khalti-return";

describe("khalti-return controller", () => {
  afterEach(() => {
    vi.useRealTimers();
    _resetKhaltiVerifyCacheForTests();
  });

  it("handles 200 success by clearing cart before redirecting and preserving isTest", async () => {
    vi.useFakeTimers();
    const events: string[] = [];
    const snapshots: KhaltiReturnSnapshot[] = [];

    const verifyPayment = vi.fn().mockResolvedValue({
      success: true,
      order_id: 42,
      token: "ord-tok-42",
      order_number: "#KC-2026-0042",
      status: "PAID",
      is_test: true,
    });

    const controller = createKhaltiReturnController({
      storeSlug: "ktm-craft",
      pidx: "pidx_ok_42",
      orderId: "42",
      verifyPayment,
      payOrder: vi.fn(),
      clearCart: () => events.push("clearCart"),
      navigateOrder: (url) => events.push(`navigateOrder:${url}`),
      navigatePayment: vi.fn(),
      onUpdate: (snap) => snapshots.push(snap),
    });

    await controller.start();

    expect(verifyPayment).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["clearCart"]);
    expect(snapshots[snapshots.length - 1]).toMatchObject({
      status: "success",
      orderToken: "ord-tok-42",
      isTest: true,
    });

    await vi.advanceTimersByTimeAsync(850);
    expect(events).toEqual([
      "clearCart",
      "navigateOrder:/s/ktm-craft/orders/42?token=ord-tok-42",
    ]);
    controller.destroy();
  });

  it("polls every 3s on 202 pending and exposes Check again after 30s timeout", async () => {
    vi.useFakeTimers();
    const snapshots: KhaltiReturnSnapshot[] = [];
    let nowMs = 0;

    const verifyPayment = vi.fn().mockResolvedValue({
      success: false,
      state: "pending",
      order_id: 77,
      token: "tok-pend-77",
      is_test: true,
    });

    const controller = createKhaltiReturnController({
      storeSlug: "ktm-craft",
      pidx: "pidx_pend_77",
      orderId: "77",
      verifyPayment,
      payOrder: vi.fn(),
      clearCart: vi.fn(),
      navigateOrder: vi.fn(),
      navigatePayment: vi.fn(),
      onUpdate: (snap) => snapshots.push(snap),
      now: () => nowMs,
    });

    await controller.start();
    expect(verifyPayment).toHaveBeenCalledTimes(1);
    expect(snapshots[snapshots.length - 1]).toMatchObject({
      status: "pending",
      pollExhausted: false,
    });

    // Advance 3s -> automatic poll #2
    nowMs += KHALTI_POLL_INTERVAL_MS;
    await vi.advanceTimersByTimeAsync(KHALTI_POLL_INTERVAL_MS);
    expect(verifyPayment).toHaveBeenCalledTimes(2);
    expect(snapshots[snapshots.length - 1].pollExhausted).toBe(false);

    // Jump clock to 30s boundary on next tick -> polling stops with pollExhausted: true
    nowMs = KHALTI_MAX_POLL_MS;
    await vi.advanceTimersByTimeAsync(KHALTI_POLL_INTERVAL_MS);
    expect(verifyPayment).toHaveBeenCalledTimes(3);
    expect(snapshots[snapshots.length - 1]).toMatchObject({
      status: "pending",
      pollExhausted: true,
    });

    // Ensure no further background timers run after exhaustion
    await vi.advanceTimersByTimeAsync(KHALTI_POLL_INTERVAL_MS * 3);
    expect(verifyPayment).toHaveBeenCalledTimes(3);

    // Manual Check again succeeds when payment clears
    verifyPayment.mockResolvedValueOnce({
      success: true,
      order_id: 77,
      token: "tok-pend-77",
      status: "PAID",
      is_test: true,
    });
    await controller.checkAgain();
    expect(verifyPayment).toHaveBeenCalledTimes(4);
    expect(snapshots[snapshots.length - 1].status).toBe("success");
    controller.destroy();
  });

  it("handles 400 failed verification and retries THIS order via payPublicOrder", async () => {
    const snapshots: KhaltiReturnSnapshot[] = [];
    const navigatePayment = vi.fn();

    const verifyPayment = vi.fn().mockRejectedValue(
      new ApiError(
        400,
        "Payment was canceled on Khalti.",
        undefined,
        { state: "failed", token: "tok-fail-99", is_test: true }
      )
    );
    const payOrder = vi.fn().mockResolvedValue({
      order_id: 99,
      token: "tok-fail-99",
      order_number: "#KC-99",
      status: "PENDING_PAYMENT",
      pidx: "new_retry_pidx",
      payment_url: "https://test-pay.khalti.com/?pidx=new_retry_pidx",
      is_mock: false,
    });

    const controller = createKhaltiReturnController({
      storeSlug: "ktm-craft",
      pidx: "pidx_fail_99",
      orderId: "99",
      returnUrl: "https://shop.test/s/ktm-craft/checkout/khalti-return/",
      verifyPayment,
      payOrder,
      clearCart: vi.fn(),
      navigateOrder: vi.fn(),
      navigatePayment,
      onUpdate: (snap) => snapshots.push(snap),
    });

    await controller.start();
    expect(snapshots[snapshots.length - 1]).toMatchObject({
      status: "failed",
      errorMessage: "Payment was canceled on Khalti.",
      orderToken: "tok-fail-99",
      isTest: true,
    });

    await controller.retryPayment();
    expect(payOrder).toHaveBeenCalledTimes(1);
    expect(payOrder).toHaveBeenCalledWith("ktm-craft", "99", {
      token: "tok-fail-99",
      payment_method: "KHALTI",
      return_url: "https://shop.test/s/ktm-craft/checkout/khalti-return/",
    });
    expect(navigatePayment).toHaveBeenCalledWith(
      "https://test-pay.khalti.com/?pidx=new_retry_pidx",
      false
    );
    controller.destroy();
  });

  it("handles 503 network error with Check again without clearing cart", async () => {
    const snapshots: KhaltiReturnSnapshot[] = [];
    const clearCart = vi.fn();

    const verifyPayment = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(503, "Gateway unreachable.", undefined, { is_test: true }))
      .mockResolvedValueOnce({
        success: true,
        order_id: 55,
        token: "tok-err-55",
        status: "PAID",
        is_test: true,
      });

    const controller = createKhaltiReturnController({
      storeSlug: "ktm-craft",
      pidx: "pidx_err_55",
      orderId: "55",
      verifyPayment,
      payOrder: vi.fn(),
      clearCart,
      navigateOrder: vi.fn(),
      navigatePayment: vi.fn(),
      onUpdate: (snap) => snapshots.push(snap),
    });

    await controller.start();
    expect(clearCart).not.toHaveBeenCalled();
    expect(snapshots[snapshots.length - 1]).toMatchObject({
      status: "error",
      errorMessage: "Could not reach Khalti, try again.",
      isTest: true,
    });

    await controller.checkAgain();
    expect(verifyPayment).toHaveBeenCalledTimes(2);
    expect(clearCart).toHaveBeenCalledTimes(1);
    expect(snapshots[snapshots.length - 1].status).toBe("success");
    controller.destroy();
  });

  it("deduplicates concurrent verify calls caused by React Strict Mode remounts", async () => {
    let resolveVerify!: (value: {
      success: boolean;
      order_id: number;
      token: string;
      status: string;
      is_test: boolean;
    }) => void;

    const verifyPayment = vi.fn(
      () =>
        new Promise<{
          success: boolean;
          order_id: number;
          token: string;
          status: string;
          is_test: boolean;
        }>((resolve) => {
          resolveVerify = resolve;
        })
    );

    const firstClear = vi.fn();
    const secondClear = vi.fn();
    const firstSnap = vi.fn();
    const secondSnap = vi.fn();

    const c1 = createKhaltiReturnController({
      storeSlug: "ktm-craft",
      pidx: "pidx_strict_1",
      orderId: "101",
      verifyPayment,
      payOrder: vi.fn(),
      clearCart: firstClear,
      navigateOrder: vi.fn(),
      navigatePayment: vi.fn(),
      onUpdate: firstSnap,
    });
    const p1 = c1.start();
    c1.destroy();

    const c2 = createKhaltiReturnController({
      storeSlug: "ktm-craft",
      pidx: "pidx_strict_1",
      orderId: "101",
      verifyPayment,
      payOrder: vi.fn(),
      clearCart: secondClear,
      navigateOrder: vi.fn(),
      navigatePayment: vi.fn(),
      onUpdate: secondSnap,
    });
    const p2 = c2.start();

    expect(verifyPayment).toHaveBeenCalledTimes(1);

    resolveVerify({
      success: true,
      order_id: 101,
      token: "tok-101",
      status: "PAID",
      is_test: true,
    });
    await Promise.all([p1, p2]);

    expect(firstClear).not.toHaveBeenCalled();
    expect(secondClear).toHaveBeenCalledTimes(1);
    expect(secondSnap).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "success", orderToken: "tok-101" })
    );
    c2.destroy();
  });

  it("removes guest order token from sessionStorage on both verification success and failure", async () => {
    const store = new Map<string, string>();
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        sessionStorage: {
          getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
          setItem: (k: string, v: string) => {
            store.set(k, v);
          },
          removeItem: (k: string) => {
            store.delete(k);
          },
        },
      },
    });

    try {
      const storageKey = "sc:ktm-craft:khalti_order_token:201";
      store.set(storageKey, "guest-tok-201");

      const cOk = createKhaltiReturnController({
        storeSlug: "ktm-craft",
        pidx: "pidx_tok_ok",
        orderId: "201",
        initialToken: "guest-tok-201",
        verifyPayment: vi.fn().mockResolvedValue({
          success: true,
          order_id: 201,
          token: "guest-tok-201",
          status: "PAID",
          is_test: true,
        }),
        payOrder: vi.fn(),
        clearCart: vi.fn(),
        navigateOrder: vi.fn(),
        navigatePayment: vi.fn(),
        onUpdate: vi.fn(),
      });
      await cOk.start();
      expect(store.has(storageKey)).toBe(false);
      cOk.destroy();

      const failKey = "sc:ktm-craft:khalti_order_token:202";
      store.set(failKey, "guest-tok-202");

      const cFail = createKhaltiReturnController({
        storeSlug: "ktm-craft",
        pidx: "pidx_tok_fail",
        orderId: "202",
        initialToken: "guest-tok-202",
        verifyPayment: vi.fn().mockRejectedValue(
          new ApiError(400, "Expired", undefined, {
            token: "guest-tok-202",
            is_test: true,
          })
        ),
        payOrder: vi.fn(),
        clearCart: vi.fn(),
        navigateOrder: vi.fn(),
        navigatePayment: vi.fn(),
        onUpdate: vi.fn(),
      });
      await cFail.start();
      expect(store.has(failKey)).toBe(false);
      expect(cFail.getSnapshot().orderToken).toBe("guest-tok-202");
      cFail.destroy();
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }
  });
});
