"use client";

import { RpRegistrationStatus } from "@/lib/rp-registration-status";
import { useMutation } from "@apollo/client/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RetryRpDocument } from "./graphql/client/retry-rp.generated";

export type RpEnvironment = "production" | "staging";

type Options = {
  rpId: string;
  initialProductionStatus: RpRegistrationStatus;
  initialStagingStatus: RpRegistrationStatus | null;
  onStatusReconciled?: (status: RpRegistrationStatus) => void;
  onRetryError?: () => void;
};

type RpStatusResponse = {
  production_status: RpRegistrationStatus;
  staging_status: RpRegistrationStatus | null;
};

export const useRpRegistrationController = ({
  rpId,
  initialProductionStatus,
  initialStagingStatus,
  onStatusReconciled,
  onRetryError,
}: Options) => {
  const [retryRpMutation] = useMutation(RetryRpDocument);
  const [productionStatus, setProductionStatus] = useState(
    initialProductionStatus,
  );
  const [stagingStatus, setStagingStatus] = useState(initialStagingStatus);
  const [retryingEnvironment, setRetryingEnvironment] =
    useState<RpEnvironment | null>(null);
  const productionStatusRef = useRef(initialProductionStatus);
  const statusFetchInFlight = useRef<string | null>(null);
  const onStatusReconciledRef = useRef(onStatusReconciled);
  const onRetryErrorRef = useRef(onRetryError);

  onStatusReconciledRef.current = onStatusReconciled;
  onRetryErrorRef.current = onRetryError;

  const updateProductionStatus = useCallback((status: RpRegistrationStatus) => {
    productionStatusRef.current = status;
    setProductionStatus(status);
  }, []);

  useEffect(() => {
    updateProductionStatus(initialProductionStatus);
    setStagingStatus(initialStagingStatus);
  }, [
    initialProductionStatus,
    initialStagingStatus,
    rpId,
    updateProductionStatus,
  ]);

  const fetchStatus = useCallback(async () => {
    if (statusFetchInFlight.current === rpId) return;

    statusFetchInFlight.current = rpId;
    try {
      const response = await fetch(`/api/v4/rp-status/${rpId}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok || statusFetchInFlight.current !== rpId) return;

      const result = (await response.json()) as RpStatusResponse;
      const productionChanged =
        result.production_status !== productionStatusRef.current;

      updateProductionStatus(result.production_status);
      setStagingStatus(result.staging_status);

      if (productionChanged) {
        onStatusReconciledRef.current?.(result.production_status);
      }
    } catch {
      // Retain the last known status when reconciliation is unavailable.
    } finally {
      if (statusFetchInFlight.current === rpId) {
        statusFetchInFlight.current = null;
      }
    }
  }, [rpId, updateProductionStatus]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (
      productionStatus !== RpRegistrationStatus.Pending &&
      stagingStatus !== RpRegistrationStatus.Pending
    ) {
      return;
    }

    const interval = setInterval(() => {
      if (!document.hidden) void fetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchStatus, productionStatus, stagingStatus]);

  const retryRegistration = useCallback(
    async (environment: RpEnvironment) => {
      setRetryingEnvironment(environment);
      try {
        const { data } = await retryRpMutation({
          variables: { rp_id: rpId, environment },
        });

        if (data?.retry_rp?.success) {
          if (environment === "production") {
            updateProductionStatus(RpRegistrationStatus.Pending);
          } else {
            setStagingStatus(RpRegistrationStatus.Pending);
          }
        }
      } catch {
        onRetryErrorRef.current?.();
      } finally {
        setRetryingEnvironment(null);
      }
    },
    [retryRpMutation, rpId, updateProductionStatus],
  );

  return {
    productionStatus,
    stagingStatus,
    retryingEnvironment,
    retryRegistration,
    markProductionPending: () =>
      updateProductionStatus(RpRegistrationStatus.Pending),
  };
};
