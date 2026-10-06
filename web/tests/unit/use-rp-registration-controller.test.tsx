/** @jest-environment jsdom */
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import { useRpRegistrationController } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/use-rp-registration-controller";
import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/graphql/client/retry-rp.generated",
  () => ({ RetryRpDocument: {} }),
);

// AC4: the controller calls useMutation(RetryRpDocument) from @apollo/client/react.
const retryMutationMock = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useMutation: () => [retryMutationMock, { loading: false }],
}));

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(AbortSignal, "timeout", {
    configurable: true,
    value: jest.fn(() => new AbortController().signal),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("publishes a reconciled production status before the overview refetch", async () => {
  const onStatusReconciled = jest.fn();
  jest.spyOn(global, "fetch").mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      production_status: RpRegistrationStatus.Registered,
      staging_status: null,
    }),
  } as Response);

  const { result } = renderHook(() =>
    useRpRegistrationController({
      rpId: "rp_1234567890abcdef",
      initialProductionStatus: RpRegistrationStatus.Pending,
      initialStagingStatus: null,
      onStatusReconciled,
    }),
  );

  await waitFor(() =>
    expect(result.current.productionStatus).toBe(
      RpRegistrationStatus.Registered,
    ),
  );
  expect(onStatusReconciled).toHaveBeenCalledWith(
    RpRegistrationStatus.Registered,
  );
});

it("refreshes pending status after an uncertain retry response", async () => {
  const onRetryError = jest.fn();
  retryMutationMock.mockRejectedValueOnce(new Error("response lost"));
  jest.spyOn(global, "fetch").mockResolvedValue({
    ok: true,
    json: async () => ({
      production_status: RpRegistrationStatus.Pending,
      staging_status: null,
    }),
  } as Response);
  const { result, unmount } = renderHook(() =>
    useRpRegistrationController({
      rpId: "rp_1234567890abcdef",
      initialProductionStatus: RpRegistrationStatus.Failed,
      initialStagingStatus: null,
      onRetryError,
    }),
  );
  await act(async () => {
    await result.current.retryRegistration("production");
  });
  expect(result.current.productionStatus).toBe(RpRegistrationStatus.Pending);
  expect(onRetryError).toHaveBeenCalledTimes(1);
  unmount();
});

it("waits for an in-flight status fetch before reconciling an uncertain retry", async () => {
  const onRetryError = jest.fn();
  retryMutationMock.mockRejectedValueOnce(new Error("response lost"));
  let resolveOldStatus!: (response: Response) => void;
  const oldStatus = new Promise<Response>((resolve) => {
    resolveOldStatus = resolve;
  });
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockReset()
    .mockReturnValueOnce(oldStatus)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        production_status: RpRegistrationStatus.Pending,
        staging_status: null,
      }),
    } as Response);
  const { result, unmount } = renderHook(() =>
    useRpRegistrationController({
      rpId: "rp_1234567890abcdef",
      initialProductionStatus: RpRegistrationStatus.Failed,
      initialStagingStatus: null,
      onRetryError,
    }),
  );
  let retryPromise!: Promise<void>;
  await act(async () => {
    retryPromise = result.current.retryRegistration("production");
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(onRetryError).not.toHaveBeenCalled();

  await act(async () => {
    resolveOldStatus({
      ok: true,
      json: async () => ({
        production_status: RpRegistrationStatus.Failed,
        staging_status: null,
      }),
    } as Response);
    await retryPromise;
  });

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(result.current.productionStatus).toBe(RpRegistrationStatus.Pending);
  expect(result.current.retryingEnvironment).toBeNull();
  expect(onRetryError).toHaveBeenCalledTimes(1);
  unmount();
});

// #region Status requests for an outdated RP
it("does not restart an old RP status request after an uncertain retry", async () => {
  retryMutationMock.mockRejectedValueOnce(new Error("response lost"));
  let resolveOldStatus!: (response: Response) => void;
  const oldStatus = new Promise<Response>((resolve) => {
    resolveOldStatus = resolve;
  });
  const onStatusReconciled = jest.fn();
  const fetchMock = jest
    .spyOn(global, "fetch")
    .mockReset()
    .mockReturnValueOnce(oldStatus)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        production_status: RpRegistrationStatus.Registered,
        staging_status: null,
      }),
    } as Response)
    .mockResolvedValue({
      ok: true,
      json: async () => ({
        production_status: RpRegistrationStatus.Failed,
        staging_status: null,
      }),
    } as Response);
  const { result, rerender, unmount } = renderHook(
    ({ rpId }) =>
      useRpRegistrationController({
        rpId,
        initialProductionStatus: RpRegistrationStatus.Failed,
        initialStagingStatus: null,
        onStatusReconciled,
      }),
    { initialProps: { rpId: "rp_1234567890abcdef" } },
  );
  let retryPromise!: Promise<void>;
  await act(async () => {
    retryPromise = result.current.retryRegistration("production");
  });
  await act(async () => {
    rerender({ rpId: "rp_fedcba0987654321" });
  });
  expect(result.current.productionStatus).toBe(RpRegistrationStatus.Registered);

  await act(async () => {
    resolveOldStatus({
      ok: true,
      json: async () => ({
        production_status: RpRegistrationStatus.Failed,
        staging_status: null,
      }),
    } as Response);
    await retryPromise;
  });

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(result.current.productionStatus).toBe(RpRegistrationStatus.Registered);
  expect(onStatusReconciled).toHaveBeenCalledTimes(1);
  unmount();
});

it("ignores an old RP response whose body resolves after the RP changes", async () => {
  let resolveOldBody!: (body: unknown) => void;
  const oldBody = new Promise((resolve) => {
    resolveOldBody = resolve;
  });
  const readOldBody = jest.fn(() => oldBody);
  const onStatusReconciled = jest.fn();
  jest
    .spyOn(global, "fetch")
    .mockReset()
    .mockResolvedValueOnce({
      ok: true,
      json: readOldBody,
    } as unknown as Response)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        production_status: RpRegistrationStatus.Registered,
        staging_status: null,
      }),
    } as Response);
  const { result, rerender, unmount } = renderHook(
    ({ rpId }) =>
      useRpRegistrationController({
        rpId,
        initialProductionStatus: RpRegistrationStatus.Failed,
        initialStagingStatus: null,
        onStatusReconciled,
      }),
    { initialProps: { rpId: "rp_1234567890abcdef" } },
  );
  await waitFor(() => expect(readOldBody).toHaveBeenCalledTimes(1));
  await act(async () => {
    rerender({ rpId: "rp_fedcba0987654321" });
  });
  expect(result.current.productionStatus).toBe(RpRegistrationStatus.Registered);

  await act(async () => {
    resolveOldBody({
      production_status: RpRegistrationStatus.Failed,
      staging_status: RpRegistrationStatus.Failed,
    });
  });

  expect(result.current.productionStatus).toBe(RpRegistrationStatus.Registered);
  expect(result.current.stagingStatus).toBeNull();
  expect(onStatusReconciled).toHaveBeenCalledTimes(1);
  unmount();
});
// #endregion
