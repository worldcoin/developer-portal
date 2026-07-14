/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { useAutosaveWithStatus } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/hook/use-autosave-with-status";

// #region Mocks
jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { capture: jest.fn() },
}));
import posthog from "posthog-js";
const captureMock = posthog.capture as jest.Mock;
// #endregion

// #region Test Data
type Values = { name: string; url: string };
const DEBOUNCE_MS = 30;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Rendered without a SaveStatusProvider on purpose: useSaveStatusActions()
// returns null, exercising the null-safe ctx branches, and leaving the
// telemetry behavior (which does not depend on the provider) under test.
const setup = (
  save: (data: Values, signal: AbortSignal) => Promise<void>,
  id = "advanced-setup",
) =>
  renderHook(() => {
    const form = useForm<Values>({
      defaultValues: { name: "", url: "" },
      mode: "onChange",
    });
    form.register("name");
    form.register("url");
    useAutosaveWithStatus<Values>({
      id,
      form,
      save,
      enabled: true,
      debounceMs: DEBOUNCE_MS,
    });
    return { form };
  });
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region config_autosave_failed telemetry
describe("useAutosaveWithStatus telemetry", () => {
  it("reports config_autosave_failed with form id and message when a save fails", async () => {
    const save = jest.fn().mockRejectedValue(new Error("network blew up"));
    const { result } = setup(save, "advanced-setup");

    await act(async () => {
      result.current.form.setValue("name", "x", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(captureMock).toHaveBeenCalledWith(
      "config_autosave_failed",
      expect.objectContaining({
        form_id: "advanced-setup",
        message: "network blew up",
      }),
    );
  });

  it("does not report when the save succeeds", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const { result } = setup(save);

    await act(async () => {
      result.current.form.setValue("name", "ok", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(captureMock).not.toHaveBeenCalled();
  });

  it("reports once per error transition, not on every retry attempt of the same failure", async () => {
    const save = jest.fn().mockRejectedValue(new Error("still failing"));
    const { result } = setup(save);

    await act(async () => {
      result.current.form.setValue("name", "x", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    // A single failed save produces a single error transition → one report.
    expect(captureMock).toHaveBeenCalledTimes(1);
  });
});
// #endregion
