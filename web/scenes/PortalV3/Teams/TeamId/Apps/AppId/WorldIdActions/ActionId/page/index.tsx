"use client";
import { use, useEffect, useRef, useState } from "react";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import posthog from "posthog-js";
import Skeleton from "react-loading-skeleton";
import { useGetSingleActionV4Query } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/graphql/client/get-single-action-v4.generated";
import { VerifiedTable } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page/VerifiedTable";
import { adaptNullifierV4 } from "./utils/adapt-nullifier-v4";
import { FirstProofIndicator } from "./FirstProofIndicator";
import { Quickstart } from "./Quickstart";

type WorldIdActionIdPageProps = {
  params: Promise<Record<string, string>>;
};

// Mirrors `getKioskEnvironment` in
// Actions/ActionId/Components/Kiosk/useLegacyKioskRequest.ts — the
// GetSingleActionV4 query does not carry an `environment` field, so staging
// is derived from the `app_staging_` app_id prefix, same as the kiosk flow.
const isStagingAppId = (appId: string): boolean =>
  appId.startsWith("app_staging_");

export const WorldIdActionIdPage = (props: WorldIdActionIdPageProps) => {
  const params = use(props.params);
  const actionId = params?.actionId;
  const [showQuickstart, setShowQuickstart] = useState(false);

  const { data, loading, error, startPolling, stopPolling } =
    useGetSingleActionV4Query({
      variables: { action_id: actionId ?? "" },
      // The action was just created on another page and proofs arrive from
      // outside the app — revalidate on mount rather than trusting cache.
      fetchPolicy: "cache-and-network",
    });

  const action = data?.action_v4_by_pk;
  const verificationCount = Number(
    action?.nullifiers_aggregate?.aggregate?.count ?? 0,
  );

  const waitingForFirstProof = !!action && verificationCount === 0;

  // Poll only while waiting for the first proof, so the indicator flips live
  // when a verification lands without a manual refresh; stop once it arrives.
  useEffect(() => {
    if (waitingForFirstProof) {
      startPolling(5000);
      return () => stopPolling();
    }
    stopPolling();
  }, [waitingForFirstProof, startPolling, stopPolling]);

  // "First proof received!" is a one-time live crossing, not a steady banner:
  // only celebrate if this page actually observed the waiting state before the
  // proof appeared — arriving on an already-verified action shows nothing.
  const hasObservedWaiting = useRef(false);
  const [justReceivedFirst, setJustReceivedFirst] = useState(false);
  useEffect(() => {
    if (waitingForFirstProof) {
      hasObservedWaiting.current = true;
      return;
    }
    if (verificationCount > 0 && hasObservedWaiting.current) {
      setJustReceivedFirst(true);
      posthog.capture("v3_first_proof_received", { action_id: actionId });
      const timer = setTimeout(() => setJustReceivedFirst(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [waitingForFirstProof, verificationCount, actionId]);

  if (error) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={500} title="Failed to load action" />
      </SizingWrapper>
    );
  }

  if (!loading && !action) {
    return (
      <SizingWrapper gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="Action not found" />
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper gridClassName="order-1 pt-6 pb-6 md:pb-10">
      <div className="grid w-full grid-cols-1 items-start justify-between gap-y-10 lg:grid-cols-2 lg:gap-x-32">
        {/* Left: Stats overview */}
        <div className="grid gap-y-6">
          <Typography className="block" variant={TYPOGRAPHY.H7}>
            Overview
          </Typography>

          {/* Stats summary */}
          <div className="flex flex-col gap-y-6">
            {/* Verifications stat */}
            <div>
              <div className="grid grid-cols-auto/1fr items-center gap-x-1">
                <div className="size-1.5 rounded-[1px] bg-blue-500" />
                <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
                  Verifications
                </Typography>
              </div>
              <div className="mt-1 flex items-center gap-x-2">
                <Typography variant={TYPOGRAPHY.H6} className="text-grey-700">
                  {loading ? (
                    <Skeleton width={100} />
                  ) : (
                    verificationCount.toLocaleString()
                  )}
                </Typography>
              </div>
            </div>
          </div>

          {/* The first-proof moment lives here, beside the integration
              snippet the developer just used — waiting → ✓ received, in place. */}
          {!loading &&
            action &&
            (waitingForFirstProof || justReceivedFirst) && (
              <FirstProofIndicator
                variant={justReceivedFirst ? "received" : "waiting"}
              />
            )}

          {/* Quickstart: shown inline when the action has no verifications
              yet, otherwise collapsed behind a toggle so it doesn't crowd
              out the analytics/table once the action is in real use. */}
          {!loading && action && verificationCount === 0 && (
            <Quickstart
              appId={action.rp_registration.app_id}
              action={action.action}
              isStaging={isStagingAppId(action.rp_registration.app_id)}
            />
          )}

          {!loading && action && verificationCount > 0 && (
            <div>
              {!showQuickstart ? (
                <button
                  type="button"
                  onClick={() => setShowQuickstart(true)}
                  className="text-sm font-medium text-blue-500 hover:underline"
                >
                  Show quickstart
                </button>
              ) : (
                <Quickstart
                  appId={action.rp_registration.app_id}
                  action={action.action}
                  isStaging={isStagingAppId(action.rp_registration.app_id)}
                />
              )}
            </div>
          )}

          {/* Placeholder for future graph */}
          <div className="pointer-events-none grid aspect-[580/350] w-full select-none content-center justify-center justify-items-center gap-y-1 rounded-2xl border border-grey-200">
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-500">
              Detailed analytics coming soon
            </Typography>
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
              Verification trends will show up here
            </Typography>
          </div>
        </div>

        {/* Right: Verified humans table */}
        {loading ? (
          <div>
            <Skeleton count={5} />
          </div>
        ) : (
          <VerifiedTable
            columns={["human", "time"]}
            nullifiers={adaptNullifierV4(action?.nullifiers ?? [])}
          />
        )}
      </div>
    </SizingWrapper>
  );
};
