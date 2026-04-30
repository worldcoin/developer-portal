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

  it("does not call save when validation fails", async () => {
    const save = jest.fn().mockResolvedValue(undefined);
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
        onStatus: () => {},
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

  it("aborts in-flight save when a new change comes in", async () => {
    const seenSignals: AbortSignal[] = [];
    let resolveFirst: (() => void) | null = null;
    const save = jest.fn(async (_data: Values, signal: AbortSignal) => {
      seenSignals.push(signal);
      if (seenSignals.length === 1) {
        await new Promise<void>((resolve) => {
          resolveFirst = resolve;
        });
      }
    });

    const { result } = setup(save);

    await act(async () => {
      result.current.form.setValue("name", "first", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(save).toHaveBeenCalledTimes(1);
    expect(seenSignals[0].aborted).toBe(false);

    await act(async () => {
      result.current.form.setValue("name", "second", { shouldDirty: true });
    });
    await act(async () => {
      await wait(DEBOUNCE_MS * 4);
    });

    expect(save).toHaveBeenCalledTimes(2);
    expect(seenSignals[0].aborted).toBe(true);

    await act(async () => {
      resolveFirst?.();
      await Promise.resolve();
    });
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
});
