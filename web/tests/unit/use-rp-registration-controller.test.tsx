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

it("publishes a reconciled production status before the overview refetch", async () => {
  const onStatusReconciled = jest.fn();
  Object.defineProperty(AbortSignal, "timeout", {
    configurable: true,
    value: jest.fn(() => new AbortController().signal),
  });
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
