import type { ReviewChecklist } from "@/api/admin/reviewer/request-schema";
import {
  createChecklistSaveQueue,
  type ChecklistSaveQueueState,
} from "@/scenes/Admin/reviewer/detail/checklist-save-queue";

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

const checklist = (internalNotes: string): ReviewChecklist => ({
  internalNotes,
  items: [],
});

describe("reviewer checklist save queue", () => {
  it("serializes rapid saves and collapses active-save edits to the newest snapshot", async () => {
    const first = deferred<boolean>();
    const second = deferred<boolean>();
    const save = jest
      .fn<Promise<boolean>, [ReviewChecklist]>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const queue = createChecklistSaveQueue({ save });

    const firstResult = queue.enqueue(checklist("first"));
    const middleResult = queue.enqueue(checklist("middle"));
    const newestResult = queue.enqueue(checklist("newest"));

    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenLastCalledWith(checklist("first"));

    first.resolve(true);
    await Promise.resolve();
    await Promise.resolve();

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(checklist("newest"));

    second.resolve(true);
    await expect(firstResult).resolves.toBe(true);
    await expect(middleResult).resolves.toBe(true);
    await expect(newestResult).resolves.toBe(true);
  });

  it("flush waits for the active save and newest pending successor", async () => {
    const first = deferred<boolean>();
    const second = deferred<boolean>();
    const save = jest
      .fn<Promise<boolean>, [ReviewChecklist]>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const queue = createChecklistSaveQueue({ save });

    void queue.enqueue(checklist("first"));
    void queue.enqueue(checklist("newest"));
    const flushed = jest.fn();
    const flushResult = queue.flush().then((result) => {
      flushed(result);
      return result;
    });

    first.resolve(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(flushed).not.toHaveBeenCalled();

    second.resolve(true);
    await expect(flushResult).resolves.toBe(true);
    expect(flushed).toHaveBeenCalledWith(true);
  });

  it("retains a failed snapshot and retries it", async () => {
    const save = jest
      .fn<Promise<boolean>, [ReviewChecklist]>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const queue = createChecklistSaveQueue({ save });

    await expect(queue.enqueue(checklist("failed"))).resolves.toBe(false);
    await expect(queue.flush()).resolves.toBe(false);
    await expect(queue.retry()).resolves.toBe(true);

    expect(save).toHaveBeenNthCalledWith(1, checklist("failed"));
    expect(save).toHaveBeenNthCalledWith(2, checklist("failed"));
  });

  it("replaces a failed snapshot with a new edit", async () => {
    const save = jest
      .fn<Promise<boolean>, [ReviewChecklist]>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const queue = createChecklistSaveQueue({ save });

    await queue.enqueue(checklist("failed"));
    await expect(queue.enqueue(checklist("replacement"))).resolves.toBe(true);
    await expect(queue.retry()).resolves.toBe(true);

    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(checklist("replacement"));
  });

  it.each([
    [true, ["saving", "saved"]],
    [false, ["saving", "error"]],
  ] as const)(
    "reports the save state for a %s result",
    async (result, expected) => {
      const states: ChecklistSaveQueueState[] = [];
      const queue = createChecklistSaveQueue({
        onStateChange: (state) => states.push(state),
        save: jest.fn().mockResolvedValue(result),
      });

      await queue.enqueue(checklist("state transition"));

      expect(states).toEqual(expected);
    },
  );

  it("does not publish completion from a generation reset during an active save", async () => {
    const active = deferred<boolean>();
    const states: ChecklistSaveQueueState[] = [];
    const queue = createChecklistSaveQueue({
      onStateChange: (state) => states.push(state),
      save: jest.fn().mockReturnValue(active.promise),
    });

    const result = queue.enqueue(checklist("old submission"));
    queue.reset();
    active.resolve(true);

    await expect(result).resolves.toBe(false);
    expect(states).toEqual(["saving", "idle"]);
    await expect(queue.flush()).resolves.toBe(true);
  });
});
