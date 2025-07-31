export const retryUntilSuccess = async <T>(params: {
  task: () => Promise<T>;
  maxAttempts: number;
  delay?: number;
}): Promise<T> => {
  let attempts = 0;

  while (attempts < params.maxAttempts) {
    await new Promise((_) => setTimeout(_, params.delay ?? 0));

    try {
      const result = await params.task();

      if (result) {
        return result;
      }
    } catch (error) {
      console.error(`Attempt ${attempts + 1} failed: ${error}`);
    }

    attempts++;
  }

  throw new Error(`Task failed after ${params.maxAttempts} attempts.`);
};
