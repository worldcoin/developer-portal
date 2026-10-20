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
  const [retryAttempt, setRetryAttempt] = useState<{
    rpId: string;
    environment: RpEnvironment;
  } | null>(null);
  const productionStatusRef = useRef(initialProductionStatus);
  const rpIdRef = useRef(rpId);
  const statusFetchInFlight = useRef<{
    rpId: string;
    promise: Promise<void>;
  } | null>(null);
  const onStatusReconciledRef = useRef(onStatusReconciled);
  const onRetryErrorRef = useRef(onRetryError);

  rpIdRef.current = rpId;
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
    if (rpIdRef.current !== rpId) return;
    if (statusFetchInFlight.current?.rpId === rpId) return;

    const request = { rpId, promise: Promise.resolve() };
    statusFetchInFlight.current = request;
    request.promise = (async () => {
      try {
        const response = await fetch(`/api/v4/rp-status/${rpId}`, {
          signal: AbortSignal.timeout(4000),
        });
        if (!response.ok || statusFetchInFlight.current !== request) return;

        const result = (await response.json()) as RpStatusResponse;
        if (
          rpIdRef.current !== rpId ||
          statusFetchInFlight.current !== request
        ) {
          return;
        }
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
        if (statusFetchInFlight.current === request) {
          statusFetchInFlight.current = null;
        }
      }
    })();
    await request.promise;
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
      const attempt = { rpId, environment };
      setRetryAttempt(attempt);
      try {
        const { data } = await retryRpMutation({
          variables: { rp_id: rpId, environment },
        });
        if (rpIdRef.current !== attempt.rpId) return;

        if (data?.retry_rp?.success) {
          if (environment === "production") {
            updateProductionStatus(RpRegistrationStatus.Pending);
          } else {
            setStagingStatus(RpRegistrationStatus.Pending);
          }
        }
      } catch {
        const inFlight = statusFetchInFlight.current;
        if (inFlight?.rpId === rpId) await inFlight.promise;
        await fetchStatus();
        if (rpIdRef.current === attempt.rpId) {
          onRetryErrorRef.current?.();
        }
      } finally {
        setRetryAttempt((current) => (current === attempt ? null : current));
      }
    },
    [retryRpMutation, rpId, updateProductionStatus, fetchStatus],
  );

  return {
    productionStatus,
    stagingStatus,
    retryingEnvironment:
      retryAttempt?.rpId === rpId ? retryAttempt.environment : null,
    retryRegistration,
    markProductionPending: () =>
      updateProductionStatus(RpRegistrationStatus.Pending),
  };
};
