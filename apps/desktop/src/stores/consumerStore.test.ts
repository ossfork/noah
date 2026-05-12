// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Entitlement } from "../lib/tauri-commands";

vi.mock("../lib/tauri-commands", () => ({
  consumerGetEntitlement: vi.fn(),
}));

import * as commands from "../lib/tauri-commands";
import { useConsumerStore } from "./consumerStore";

function makeEntitlement(overrides: Partial<Entitlement> = {}): Entitlement {
  return {
    plan: null,
    status: "trialing",
    trial_started_at: 1_700_000_000,
    trial_ends_at: 1_700_604_800,
    period_start: null,
    period_end: null,
    usage_used: 0,
    usage_limit: 100,
    fix_count_total: 0,
    ...overrides,
  };
}

function resetStore() {
  // Reach into the store to reset its state between tests.
  useConsumerStore.setState({
    entitlement: null,
    hydrated: false,
    subscribeModal: null,
    postCheckoutPollUntil: null,
  });
  useConsumerStore.getState().stopPostCheckoutPolling();
}

describe("post-checkout polling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(commands.consumerGetEntitlement).mockReset();
    resetStore();
  });

  afterEach(() => {
    useConsumerStore.getState().stopPostCheckoutPolling();
    vi.useRealTimers();
  });

  it("polls every 3s after checkout opens", async () => {
    vi.mocked(commands.consumerGetEntitlement).mockResolvedValue(
      makeEntitlement({ status: "trialing" }),
    );

    useConsumerStore.getState().startPostCheckoutPolling();
    // One immediate fire on start.
    expect(commands.consumerGetEntitlement).toHaveBeenCalledTimes(1);

    // Advance two ticks worth of interval (microtasks need a flush
    // between fake-time advances because refresh() is async).
    await vi.advanceTimersByTimeAsync(3_000);
    await vi.advanceTimersByTimeAsync(3_000);

    expect(commands.consumerGetEntitlement).toHaveBeenCalledTimes(3);
  });

  it("stops polling once entitlement flips to active", async () => {
    // First call returns trialing, subsequent calls return active so
    // the next tick after activation sees the new state and bails.
    vi.mocked(commands.consumerGetEntitlement)
      .mockResolvedValueOnce(makeEntitlement({ status: "trialing" }))
      .mockResolvedValue(makeEntitlement({ status: "active" }));

    useConsumerStore.getState().startPostCheckoutPolling();
    await vi.advanceTimersByTimeAsync(3_000); // tick 1 → fetches "active"
    await vi.advanceTimersByTimeAsync(3_000); // tick 2 → sees "active", stops

    const callCount = vi.mocked(commands.consumerGetEntitlement).mock.calls
      .length;
    expect(useConsumerStore.getState().postCheckoutPollUntil).toBeNull();

    await vi.advanceTimersByTimeAsync(10_000);
    expect(commands.consumerGetEntitlement).toHaveBeenCalledTimes(callCount);
  });

  it("gives up after 15 minutes", async () => {
    vi.mocked(commands.consumerGetEntitlement).mockResolvedValue(
      makeEntitlement({ status: "trialing" }),
    );

    useConsumerStore.getState().startPostCheckoutPolling();
    // 15 min + a tick to trip the deadline check.
    await vi.advanceTimersByTimeAsync(15 * 60 * 1000 + 3_000);

    expect(useConsumerStore.getState().postCheckoutPollUntil).toBeNull();

    const callCount = vi.mocked(commands.consumerGetEntitlement).mock.calls
      .length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(commands.consumerGetEntitlement).toHaveBeenCalledTimes(callCount);
  });

  it("is idempotent — second start while running just bumps the deadline", async () => {
    vi.mocked(commands.consumerGetEntitlement).mockResolvedValue(
      makeEntitlement({ status: "trialing" }),
    );

    useConsumerStore.getState().startPostCheckoutPolling();
    const firstDeadline = useConsumerStore.getState().postCheckoutPollUntil;
    await vi.advanceTimersByTimeAsync(5_000);

    useConsumerStore.getState().startPostCheckoutPolling();
    const secondDeadline = useConsumerStore.getState().postCheckoutPollUntil;

    // Deadline pushed out, not reset to a different absolute moment.
    expect(secondDeadline).not.toBeNull();
    expect(secondDeadline!).toBeGreaterThan(firstDeadline!);

    // Still polling at the same 3s cadence — no duplicate interval was
    // spawned. After 6s we should have ~3 calls (start + 2 ticks),
    // not 5+ that would indicate two intervals firing.
    await vi.advanceTimersByTimeAsync(6_000);
    const totalCalls = vi.mocked(commands.consumerGetEntitlement).mock.calls
      .length;
    expect(totalCalls).toBeLessThanOrEqual(5);
  });

  it("stops cleanly when stopPostCheckoutPolling is called", async () => {
    vi.mocked(commands.consumerGetEntitlement).mockResolvedValue(
      makeEntitlement({ status: "trialing" }),
    );

    useConsumerStore.getState().startPostCheckoutPolling();
    await vi.advanceTimersByTimeAsync(3_000);
    useConsumerStore.getState().stopPostCheckoutPolling();

    expect(useConsumerStore.getState().postCheckoutPollUntil).toBeNull();

    const callCount = vi.mocked(commands.consumerGetEntitlement).mock.calls
      .length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(commands.consumerGetEntitlement).toHaveBeenCalledTimes(callCount);
  });
});
