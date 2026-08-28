import { settleImageWrites } from "@/api/helpers/image-processing";

describe("image write settlement", () => {
  it("waits for sibling writes before surfacing a partial failure", async () => {
    let releaseSlowWrite: (() => void) | undefined;
    const slowWrite = new Promise<void>((resolve) => {
      releaseSlowWrite = resolve;
    });
    const failedWrite = Promise.reject(new Error("minified upload failed"));
    let aggregateSettled = false;

    const aggregate = settleImageWrites([failedWrite, slowWrite]).finally(
      () => {
        aggregateSettled = true;
      },
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(aggregateSettled).toBe(false);
    releaseSlowWrite?.();
    await expect(aggregate).rejects.toThrow("minified upload failed");
  });
});
