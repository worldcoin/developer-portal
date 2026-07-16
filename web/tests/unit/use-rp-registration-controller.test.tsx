/** @jest-environment jsdom */
import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import { useRpRegistrationController } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/use-rp-registration-controller";
import { renderHook, waitFor } from "@testing-library/react";

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/graphql/client/retry-rp.generated",
  () => ({ useRetryRpMutation: () => [jest.fn()] }),
);

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
