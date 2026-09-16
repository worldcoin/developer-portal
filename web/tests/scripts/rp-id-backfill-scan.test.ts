import { generateRpIdString } from "@/lib/rp";
import { scanRpIds } from "../../scripts/rp-id-backfill/scan";

// #region Mocks
jest.mock("server-only", () => ({}));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
const store = {
  assertLocked: jest.fn(),
  assertEmpty: jest.fn(),
  loadApps: jest.fn(),
  initialize: jest.fn(),
};
const read = jest.fn();
// #endregion

// #region Test Data
const app = (n: number, has_registration = false) => ({
  app_id: `app_${n.toString(16).padStart(32, "0")}`,
  has_registration,
});
const cutoff = "2026-09-16T00:00:00Z";
// #endregion

beforeEach(() => {
  jest.resetAllMocks();
  store.loadApps.mockResolvedValue([app(1)]);
  read.mockResolvedValue({ initialized: false });
});

// #region Initialization and read failures
describe("RP backfill scan", () => {
  it("does not claim successful initialization of an empty cohort", async () => {
    store.loadApps.mockResolvedValue([]);
    await expect(scanRpIds({ store, cutoff, read })).rejects.toThrow(
      "No eligible apps",
    );
    expect(store.initialize).not.toHaveBeenCalled();
  });
  it("classifies both registries independently and inserts only after all reads", async () => {
    store.loadApps.mockResolvedValue([app(1), app(2, true)]);
    read.mockImplementation(async (registry, rpId) => ({
      initialized:
        registry === "staging" || rpId === generateRpIdString(app(2).app_id),
    }));
    store.initialize.mockImplementation(async () => {
      expect(read).toHaveBeenCalledTimes(4);
    });
    await expect(scanRpIds({ store, cutoff, read })).resolves.toEqual({
      scanned: 2,
    });
    expect(store.loadApps).toHaveBeenCalledWith(cutoff);
    expect(store.initialize.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        app_id: app(1).app_id,
        production_status: "unused",
        staging_status: "claimed_by_other",
        production_request_id: null,
        staging_request_id: null,
      }),
      expect.objectContaining({
        app_id: app(2).app_id,
        production_status: "already_registered",
        staging_status: "already_registered",
      }),
    ]);
    for (const a of [app(1), app(2)]) {
      const calls = read.mock.calls.filter(
        ([, id]) => id === generateRpIdString(a.app_id),
      );
      expect(calls.map(([registry]) => registry)).toEqual([
        "production",
        "staging",
      ]);
    }
  });

  it("retries a temporary read without adding duplicate rows", async () => {
    read.mockRejectedValueOnce(new Error("RPC timeout"));
    await scanRpIds({ store, cutoff, read });
    expect(read).toHaveBeenCalledTimes(3);
    expect(store.initialize).toHaveBeenCalledTimes(1);
  });

  it("writes nothing on retry exhaustion and permits a retry with the original cutoff", async () => {
    read.mockRejectedValue(new Error("RPC unavailable"));
    await expect(
      scanRpIds({ store, cutoff, read, readAttempts: 2 }),
    ).rejects.toThrow("RPC unavailable");
    expect(store.initialize).not.toHaveBeenCalled();
    read.mockResolvedValue({ initialized: false });
    await scanRpIds({ store, cutoff, read });
    expect(store.loadApps.mock.calls).toEqual([[cutoff], [cutoff]]);
    expect(store.initialize).toHaveBeenCalledTimes(1);
  });

  it("rejects a populated table before any registry reads", async () => {
    store.assertEmpty.mockRejectedValue(
      new Error("Scan requires an empty table"),
    );
    await expect(scanRpIds({ store, cutoff, read })).rejects.toThrow(
      "empty table",
    );
    expect(read).not.toHaveBeenCalled();
    expect(store.initialize).not.toHaveBeenCalled();
  });

  it("propagates insertion failure without retrying or rescanning", async () => {
    store.initialize.mockRejectedValue(new Error("duplicate RP ID"));
    await expect(scanRpIds({ store, cutoff, read })).rejects.toThrow(
      "duplicate RP ID",
    );
    expect(store.initialize).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(2);
  });

  it("requires a UTC cutoff and positive read limits", async () => {
    await expect(
      scanRpIds({ store, cutoff: "yesterday", read }),
    ).rejects.toThrow("UTC");
    await expect(
      scanRpIds({ store, cutoff, read, concurrency: 0 }),
    ).rejects.toThrow("positive");
    expect(store.loadApps).not.toHaveBeenCalled();
  });
});
// #endregion
