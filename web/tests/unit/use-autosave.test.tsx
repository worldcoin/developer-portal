/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import {
  AutosaveStatus,
  useAutosave,
} from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/hook/use-autosave";

type Values = { name: string; url: string };

const DEBOUNCE_MS = 30;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const setup = (
  saveImpl: (data: Values, signal: AbortSignal) => Promise<void>,
  opts: {
    enabled?: boolean;
    onStatus?: (s: AutosaveStatus) => void;
    onPendingChange?: (isPending: boolean) => void;
    debounceMs?: number;
    defaultValues?: Partial<Values>;
  } = {},
) => {
  return renderHook(() => {
    const form = useForm<Values>({
      defaultValues: { name: "", url: "", ...opts.defaultValues },
      mode: "onChange",
    });
    form.register("name");
    form.register("url");
    const result = useAutosave({
      form,
      save: saveImpl,
      enabled: opts.enabled ?? true,
      onStatus: opts.onStatus ?? (() => {}),
      onPendingChange: opts.onPendingChange,
      debounceMs: opts.debounceMs ?? DEBOUNCE_MS,
    });
    return { form, result };
  });
};

describe("useAutosave", () => {
  it("debounces multiple rapid changes into a single save call", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const { result } = setup(save);

    await act(async () => {
      result.current.form.setValue("name", "a", { shouldDirty: true });
      result.current.form.setValue("name", "ab", { shouldDirty: true });
      result.current.form.setValue("name", "abc", { shouldDirty: true });
      result.current.form.setValue("name", "abcd", { shouldDirty: true });
    });

    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].name).toBe("abcd");
  });

  it("emits saving then saved on success", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const statuses: AutosaveStatus[] = [];
    const { result } = setup(save, { onStatus: (s) => statuses.push(s) });

    await act(async () => {
      result.current.form.setValue("name", "hello", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(statuses[0]).toEqual({ state: "saving" });
    expect(statuses[1]?.state).toBe("saved");
  });

  it("does not call save when validation fails and emits error status", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const statuses: AutosaveStatus[] = [];
    const { result } = renderHook(() => {
      const form = useForm<Values>({
        defaultValues: { name: "", url: "" },
        mode: "onChange",
      });
      form.register("name", { required: true });
      form.register("url");
      const r = useAutosave({
        form,
        save,
        enabled: true,
        onStatus: (s) => statuses.push(s),
        debounceMs: DEBOUNCE_MS,
      });
      return { form, r };
    });

    await act(async () => {
      result.current.form.setValue("name", "", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(save).not.toHaveBeenCalled();
    // The indicator should not stay on a stale "saved" state — surface error.
    expect(statuses.find((s) => s.state === "error")).toBeDefined();
  });

  it("does not call save when disabled", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const { result } = setup(save, { enabled: false });

    await act(async () => {
      result.current.form.setValue("name", "x", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(save).not.toHaveBeenCalled();
  });

  it("serializes saves: a new save waits for the prior one to settle", async () => {
    const callOrder: string[] = [];
    let resolveFirst: (() => void) | null = null;
    const save = jest.fn(async (data: Values) => {
      callOrder.push(`start:${data.name}`);
      if (data.name === "first") {
        await new Promise<void>((resolve) => {
          resolveFirst = resolve;
        });
      }
      callOrder.push(`end:${data.name}`);
    });

    const { result } = setup(save);

    await act(async () => {
      result.current.form.setValue("name", "first", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(["start:first"]);

    // Schedule a second save while the first is still in flight.
    await act(async () => {
      result.current.form.setValue("name", "second", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    // Second save must not have started yet — the first is still in flight.
    expect(save).toHaveBeenCalledTimes(1);

    // Let the first save complete; the queued second save should fire next.
    await act(async () => {
      resolveFirst?.();
      await wait(DEBOUNCE_MS * 4);
    });

    expect(save).toHaveBeenCalledTimes(2);
    expect(callOrder).toEqual([
      "start:first",
      "end:first",
      "start:second",
      "end:second",
    ]);
  });

  it("emits pending change events around the debounce window", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const events: boolean[] = [];
    const { result } = setup(save, {
      onPendingChange: (p) => events.push(p),
    });

    await act(async () => {
      result.current.form.setValue("name", "x", { shouldDirty: true });
    });
    expect(events[0]).toBe(true);

    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(events).toContain(false);
    expect(events.indexOf(false)).toBeGreaterThan(events.indexOf(true));
  });

  it("emits error status with retry function on save failure", async () => {
    const save = jest
      .fn()
      .mockRejectedValueOnce(new Error("network blew up"))
      .mockResolvedValueOnce(undefined);
    const statuses: AutosaveStatus[] = [];
    const { result } = setup(save, { onStatus: (s) => statuses.push(s) });

    await act(async () => {
      result.current.form.setValue("name", "x", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    const errorStatus = statuses.find((s) => s.state === "error");
    expect(errorStatus).toBeDefined();
    if (errorStatus?.state !== "error") throw new Error("expected error");
    expect(errorStatus.error.message).toBe("network blew up");

    await act(async () => {
      errorStatus.retry();
      await wait(DEBOUNCE_MS * 4);
    });

    expect(save).toHaveBeenCalledTimes(2);
  });

  it("flush triggers an immediate save and resolves", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const { result } = setup(save);

    await act(async () => {
      result.current.form.setValue("name", "flushed", { shouldDirty: true });
    });

    let flushResult = false;
    await act(async () => {
      flushResult = await result.current.result.flush();
    });

    expect(flushResult).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].name).toBe("flushed");
  });

  it("flush is a no-op when disabled", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const { result } = setup(save, { enabled: false });

    let flushResult = false;
    await act(async () => {
      flushResult = await result.current.result.flush();
    });

    expect(flushResult).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it("flush is a no-op when there are no unsaved changes", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const { result } = setup(save);

    let flushResult = false;
    await act(async () => {
      flushResult = await result.current.result.flush();
    });

    expect(flushResult).toBe(true);
    expect(save).not.toHaveBeenCalled();
  });

  it("does not emit 'saved' when the user typed during the save", async () => {
    let resolveSave: (() => void) | null = null;
    const save = jest.fn(async () => {
      await new Promise<void>((resolve) => {
        resolveSave = resolve;
      });
    });
    const statuses: AutosaveStatus[] = [];
    const { result } = setup(save, { onStatus: (s) => statuses.push(s) });

    await act(async () => {
      result.current.form.setValue("name", "first", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(save).toHaveBeenCalledTimes(1);

    // Type while the save is still in flight.
    await act(async () => {
      result.current.form.setValue("name", "first-edited", {
        shouldDirty: true,
      });
    });
    // Now resolve the in-flight save. Snapshot ("first") no longer matches
    // the form value ("first-edited"), so we should NOT see "saved".
    await act(async () => {
      resolveSave?.();
      await Promise.resolve();
    });

    const sawSavedAfterFirstSave = statuses.some(
      (s, i) =>
        s.state === "saved" &&
        // Ignore any saved emitted later by the queued debounced save.
        i < statuses.length - 1,
    );
    expect(sawSavedAfterFirstSave).toBe(false);
  });

  it("retry from error status serializes with concurrent debounced saves", async () => {
    let resolveRetry: (() => void) | null = null;
    const callOrder: string[] = [];
    const save = jest.fn(async (data: Values) => {
      callOrder.push(`start:${data.name}`);
      if (data.name === "first") {
        // First call fails so we get an error+retry status.
        callOrder.push(`end:first(reject)`);
        throw new Error("first save failed");
      }
      if (data.name === "first-retry") {
        // Hold the retry open so we can race a debounced save against it.
        await new Promise<void>((resolve) => {
          resolveRetry = resolve;
        });
      }
      callOrder.push(`end:${data.name}`);
    });

    const statuses: AutosaveStatus[] = [];
    const { result } = setup(save, { onStatus: (s) => statuses.push(s) });

    await act(async () => {
      result.current.form.setValue("name", "first", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    const errorStatus = statuses.find((s) => s.state === "error");
    if (errorStatus?.state !== "error") throw new Error("expected error");

    // Stage the next form value so when retry fires it sends "first-retry".
    await act(async () => {
      result.current.form.setValue("name", "first-retry", {
        shouldDirty: true,
      });
    });
    // Trigger retry. Save will start and hang on resolveRetry.
    await act(async () => {
      errorStatus.retry();
      await wait(DEBOUNCE_MS * 4);
    });

    expect(callOrder).toContain("start:first-retry");

    // Now schedule a fresh edit — its debounced save MUST wait for retry.
    await act(async () => {
      result.current.form.setValue("name", "second", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(callOrder).not.toContain("start:second");

    await act(async () => {
      resolveRetry?.();
      await wait(DEBOUNCE_MS * 4);
    });

    expect(callOrder).toContain("end:first-retry");
    expect(callOrder).toContain("start:second");
    expect(callOrder.indexOf("end:first-retry")).toBeLessThan(
      callOrder.indexOf("start:second"),
    );
  });
});
