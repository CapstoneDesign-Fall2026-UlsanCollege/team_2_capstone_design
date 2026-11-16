import {
  ApiError,
  KhaltiVerifyResponse,
  PayPublicOrderResponse,
  payPublicOrder,
  verifyKhaltiPayment,
} from "@/lib/api";

export const KHALTI_POLL_INTERVAL_MS = 3000;
export const KHALTI_MAX_POLL_MS = 30000;

export type KhaltiReturnStatus = "verifying" | "pending" | "success" | "failed" | "error";

export interface KhaltiReturnSnapshot {
  status: KhaltiReturnStatus;
  pollExhausted: boolean;
  errorMessage: string;
  orderToken: string;
  isTest: boolean;
  isRetrying: boolean;
}

export type VerifyOutcome =
  | {
      kind: "success";
      token: string;
      isTest: boolean;
      orderNumber?: string;
    }
  | {
      kind: "pending";
      token: string;
      isTest: boolean;
    }
  | {
      kind: "failed";
      message: string;
      token: string;
      isTest: boolean;
    }
  | {
      kind: "error";
      message: string;
      token: string;
      isTest: boolean;
    };

function tokenStorageKey(storeSlug: string, orderId: string | number): string {
  return `sc:${storeSlug}:khalti_order_token:${String(orderId)}`;
}

export function saveKhaltiOrderToken(
  storeSlug: string,
  orderId: string | number,
  token?: string | null
): void {
  if (!token || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(tokenStorageKey(storeSlug, orderId), token);
  } catch {
    // Ignore storage quota / privacy mode restrictions
  }
}

export function readKhaltiOrderToken(storeSlug: string, orderId: string | number): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(tokenStorageKey(storeSlug, orderId)) || "";
  } catch {
    return "";
  }
}

export function clearKhaltiOrderToken(storeSlug: string, orderId: string | number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(tokenStorageKey(storeSlug, orderId));
  } catch {
    // Ignore
  }
}

export function buildOrderReceiptPath(
  storeSlug: string,
  orderId: string | number,
  token?: string
): string {
  const base = `/s/${encodeURIComponent(storeSlug)}/orders/${encodeURIComponent(String(orderId))}`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

const inFlightVerifications = new Map<string, Promise<VerifyOutcome>>();

export function _resetKhaltiVerifyCacheForTests(): void {
  inFlightVerifications.clear();
}

export async function interpretVerifyAttempt(
  verifyFn: () => Promise<KhaltiVerifyResponse>,
  fallbackToken = ""
): Promise<VerifyOutcome> {
  try {
    const res = await verifyFn();
    const resolvedToken = res.token || fallbackToken;
    const isTest = Boolean(res.is_test);

    if (res.success) {
      return {
        kind: "success",
        token: resolvedToken,
        isTest,
        orderNumber: res.order_number,
      };
    }

    if (res.state === "pending") {
      return {
        kind: "pending",
        token: resolvedToken,
        isTest,
      };
    }

    return {
      kind: "failed",
      message: res.error || "Payment verification was not completed by Khalti.",
      token: resolvedToken,
      isTest,
    };
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      const rawData = err.data || {};
      const tokenFromErr = typeof rawData.token === "string" ? rawData.token : fallbackToken;
      const isTest = Boolean(rawData.is_test);

      if (err.status === 400 || err.status === 404 || err.status === 409) {
        return {
          kind: "failed",
          message: err.detail || "Payment verification failed or was canceled.",
          token: tokenFromErr,
          isTest,
        };
      }

      return {
        kind: "error",
        message: "Could not reach Khalti, try again.",
        token: tokenFromErr,
        isTest,
      };
    }

    return {
      kind: "error",
      message: "Could not reach Khalti, try again.",
      token: fallbackToken,
      isTest: false,
    };
  }
}

export function verifyKhaltiDeduplicated(
  dedupeKey: string,
  verifyFn: () => Promise<KhaltiVerifyResponse>,
  fallbackToken = ""
): Promise<VerifyOutcome> {
  const existing = inFlightVerifications.get(dedupeKey);
  if (existing) {
    return existing;
  }

  const promise = interpretVerifyAttempt(verifyFn, fallbackToken).finally(() => {
    inFlightVerifications.delete(dedupeKey);
  });
  inFlightVerifications.set(dedupeKey, promise);
  return promise;
}

export interface KhaltiReturnControllerDeps {
  storeSlug: string;
  pidx: string;
  orderId: string;
  initialToken?: string;
  returnUrl?: string;
  verifyPayment?: typeof verifyKhaltiPayment;
  payOrder?: typeof payPublicOrder;
  clearCart: () => void;
  navigateOrder: (url: string) => void;
  navigatePayment: (url: string, isMock?: boolean) => void;
  onUpdate: (snapshot: KhaltiReturnSnapshot) => void;
  setTimer?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (id: ReturnType<typeof setTimeout>) => void;
  now?: () => number;
  pollIntervalMs?: number;
  maxPollMs?: number;
}

export function createKhaltiReturnController(deps: KhaltiReturnControllerDeps) {
  const verifyFn = deps.verifyPayment ?? verifyKhaltiPayment;
  const payFn = deps.payOrder ?? payPublicOrder;
  const scheduleTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const cancelTimer = deps.clearTimer ?? ((id) => clearTimeout(id));
  const getNow = deps.now ?? (() => Date.now());
  const pollIntervalMs = deps.pollIntervalMs ?? KHALTI_POLL_INTERVAL_MS;
  const maxPollMs = deps.maxPollMs ?? KHALTI_MAX_POLL_MS;

  let snapshot: KhaltiReturnSnapshot = {
    status: "verifying",
    pollExhausted: false,
    errorMessage: "",
    orderToken: deps.initialToken || "",
    isTest: false,
    isRetrying: false,
  };

  let destroyed = false;
  let pollTimer: ReturnType<typeof setTimeout> | null = null;
  let redirectTimer: ReturnType<typeof setTimeout> | null = null;
  let pollStartedAt = 0;

  const emit = (patch: Partial<KhaltiReturnSnapshot>) => {
    if (destroyed) return;
    snapshot = { ...snapshot, ...patch };
    deps.onUpdate(snapshot);
  };

  const clearPollTimer = () => {
    if (pollTimer !== null) {
      cancelTimer(pollTimer);
      pollTimer = null;
    }
  };

  const runCheck = async (isPollTick = false): Promise<void> => {
    if (destroyed) return;
    clearPollTimer();

    if (!deps.storeSlug || !deps.pidx || !deps.orderId) {
      emit({
        status: "failed",
        errorMessage: "Missing payment parameters in return URL.",
      });
      return;
    }

    if (!isPollTick) {
      pollStartedAt = getNow();
      emit({ status: "verifying", pollExhausted: false, errorMessage: "" });
    }

    const dedupeKey = `${deps.storeSlug}:${deps.orderId}:${deps.pidx}`;
    const outcome = await verifyKhaltiDeduplicated(
      dedupeKey,
      () => verifyFn(deps.storeSlug, deps.pidx, deps.orderId),
      snapshot.orderToken
    );

    if (destroyed) return;

    if (outcome.kind === "success") {
      clearKhaltiOrderToken(deps.storeSlug, deps.orderId);
      deps.clearCart();
      emit({
        status: "success",
        pollExhausted: false,
        orderToken: outcome.token,
        isTest: outcome.isTest,
      });
      const dest = buildOrderReceiptPath(deps.storeSlug, deps.orderId, outcome.token);
      redirectTimer = scheduleTimer(() => {
        if (!destroyed) {
          deps.navigateOrder(dest);
        }
      }, 800);
      return;
    }

    if (outcome.kind === "pending") {
      if (outcome.token) {
        saveKhaltiOrderToken(deps.storeSlug, deps.orderId, outcome.token);
      }
      const elapsed = getNow() - pollStartedAt;
      const exhausted = elapsed >= maxPollMs;
      emit({
        status: "pending",
        pollExhausted: exhausted,
        orderToken: outcome.token,
        isTest: outcome.isTest,
      });
      if (!exhausted) {
        pollTimer = scheduleTimer(() => {
          void runCheck(true);
        }, pollIntervalMs);
      }
      return;
    }

    if (outcome.kind === "failed") {
      clearKhaltiOrderToken(deps.storeSlug, deps.orderId);
      emit({
        status: "failed",
        errorMessage: outcome.message,
        orderToken: outcome.token,
        isTest: outcome.isTest,
      });
      return;
    }

    if (outcome.token) {
      saveKhaltiOrderToken(deps.storeSlug, deps.orderId, outcome.token);
    }
    emit({
      status: "error",
      errorMessage: outcome.message,
      orderToken: outcome.token,
      isTest: outcome.isTest,
    });
  };

  const retryPayment = async (): Promise<void> => {
    if (destroyed || snapshot.isRetrying) return;
    if (!snapshot.orderToken) {
      emit({
        errorMessage: "Unable to retry this payment automatically. Open your order link to try again.",
      });
      return;
    }

    emit({ isRetrying: true, errorMessage: "" });
    try {
      const res: PayPublicOrderResponse = await payFn(deps.storeSlug, deps.orderId, {
        token: snapshot.orderToken,
        payment_method: "KHALTI",
        return_url: deps.returnUrl,
      });
      if (destroyed) return;
      if (res.payment_url) {
        saveKhaltiOrderToken(deps.storeSlug, deps.orderId, res.token || snapshot.orderToken);
        deps.navigatePayment(res.payment_url, Boolean(res.is_mock));
      } else {
        emit({
          isRetrying: false,
          errorMessage: "Payment retry could not generate a Khalti URL. Please try again.",
        });
      }
    } catch (err: unknown) {
      if (destroyed) return;
      emit({
        isRetrying: false,
        errorMessage: err instanceof Error ? err.message : "Failed to restart Khalti payment.",
      });
    }
  };

  const checkAgain = async (): Promise<void> => {
    await runCheck(false);
  };

  const destroy = () => {
    destroyed = true;
    clearPollTimer();
    if (redirectTimer !== null) {
      cancelTimer(redirectTimer);
      redirectTimer = null;
    }
  };

  return {
    start: () => runCheck(false),
    checkAgain,
    retryPayment,
    destroy,
    getSnapshot: () => snapshot,
  };
}
