import { mergeStatuses } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/SaveStatus/save-status-context";
import { AutosaveStatus } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/hook/use-autosave";

const noop = () => {};

const error = (at: number, message = "fail"): AutosaveStatus => ({
  state: "error",
  at,
  error: new Error(message),
  retry: noop,
});

const saved = (at: number): AutosaveStatus => ({ state: "saved", at });

describe("mergeStatuses", () => {
  it("returns idle for an empty map", () => {
    expect(mergeStatuses(new Map())).toEqual({ state: "idle" });
  });

  it("returns saving as soon as any registrant is saving", () => {
    const m = new Map<string, AutosaveStatus>([
      ["a", saved(10)],
      ["b", { state: "saving" }],
      ["c", error(20)],
    ]);
    expect(mergeStatuses(m).state).toBe("saving");
  });

  it("prefers a newer saved over a stale (non-pending) error", () => {
    const m = new Map<string, AutosaveStatus>([
      ["miniApp", error(100)],
      ["basic", saved(200)],
    ]);
    expect(mergeStatuses(m, new Set()).state).toBe("saved");
  });

  it("prefers a newer error over an older saved", () => {
    const m = new Map<string, AutosaveStatus>([
      ["basic", saved(100)],
      ["appStore", error(200)],
    ]);
    expect(mergeStatuses(m).state).toBe("error");
  });

  it("uses the most recent saved when no errors are present", () => {
    const m = new Map<string, AutosaveStatus>([
      ["a", saved(50)],
      ["b", saved(150)],
      ["c", saved(100)],
    ]);
    const result = mergeStatuses(m);
    expect(result.state).toBe("saved");
    if (result.state === "saved") expect(result.at).toBe(150);
  });

  it("uses the most recent error when no saved are present", () => {
    const m = new Map<string, AutosaveStatus>([
      ["a", error(50, "first")],
      ["b", error(150, "second")],
      ["c", error(100, "third")],
    ]);
    const result = mergeStatuses(m);
    expect(result.state).toBe("error");
    if (result.state === "error") expect(result.error.message).toBe("second");
  });

  it("keeps a pending form's error visible even when a newer saved exists", () => {
    // Form A has an unresolved error AND still has unsaved data; Form B's
    // later saved must NOT mask Form A's actionable error.
    const m = new Map<string, AutosaveStatus>([
      ["formA", error(100, "still pending")],
      ["formB", saved(500)],
    ]);
    const result = mergeStatuses(m, new Set(["formA"]));
    expect(result.state).toBe("error");
    if (result.state === "error")
      expect(result.error.message).toBe("still pending");
  });

  it("treats a non-pending stale error as eligible for override by a newer saved", () => {
    // Mini-app toggle failed, user moved on (no pending). A later saved
    // should win — otherwise the indicator gets stuck on "Couldn't save".
    const m = new Map<string, AutosaveStatus>([
      ["miniApp", error(100, "toggle failed")],
      ["formB", saved(500)],
    ]);
    const result = mergeStatuses(m, new Set(["formB"]));
    expect(result.state).toBe("saved");
  });

  it("a pending error is preferred even if a stale error is newer", () => {
    const m = new Map<string, AutosaveStatus>([
      ["pending", error(100, "active")],
      ["stale", error(500, "abandoned")],
    ]);
    const result = mergeStatuses(m, new Set(["pending"]));
    expect(result.state).toBe("error");
    if (result.state === "error") expect(result.error.message).toBe("active");
  });
});
