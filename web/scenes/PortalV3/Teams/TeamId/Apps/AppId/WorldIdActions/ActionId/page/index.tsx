"use client";
import { use, useState } from "react";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Skeleton from "react-loading-skeleton";
import { useGetSingleActionV4Query } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/graphql/client/get-single-action-v4.generated";
import { TryAction } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Settings/TryAction";
import { VerifiedTable } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page/VerifiedTable";
import { adaptActionV4ForTryAction } from "../utils/adapt-action-v4";
import { adaptNullifierV4 } from "./utils/adapt-nullifier-v4";
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

  const { data, loading, error } = useGetSingleActionV4Query({
    variables: { action_id: actionId ?? "" },
  });

  const action = data?.action_v4_by_pk;

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

  const appId = action?.rp_registration.app_id ?? "";
  const isStaging = isStagingAppId(appId);

  return (
    <SizingWrapper gridClassName="order-1 pt-6 pb-6 md:pb-10">
      <div className="grid w-full grid-cols-1 items-start justify-between gap-y-10 lg:grid-cols-2 lg:gap-x-32">
        {/* Left: overview + tester + quickstart */}
        <div className="grid gap-y-6">
          <Typography className="block" variant={TYPOGRAPHY.H7}>
            Overview
          </Typography>

          {/* Primary affordance: scan-to-test QR. Same tester the Settings
              page uses, but in kiosk (QR) mode via the default enableKiosk. */}
          {loading ? (
            <Skeleton height={360} />
          ) : (
            <TryAction
              action={adaptActionV4ForTryAction({
                action: action!.action,
                description: action!.description,
                environment: isStaging ? "staging" : "production",
                rp_registration: { app_id: appId },
              })}
              is_v4_action={true}
            />
          )}

          {/* Integration quickstart, collapsed by default beneath the tester. */}
          {!loading && action && (
            <div className="grid gap-y-3">
              <button
                type="button"
                onClick={() => setShowQuickstart((v) => !v)}
                className="justify-self-start text-sm font-medium text-blue-500 hover:underline"
                aria-expanded={showQuickstart}
                data-testid="quickstart-toggle"
              >
                {showQuickstart
                  ? "Hide integration quickstart"
                  : "Show integration quickstart"}
              </button>
              {showQuickstart && (
                <Quickstart
                  appId={appId}
                  action={action.action}
                  isStaging={isStaging}
                />
              )}
            </div>
          )}
        </div>

        {/* Right: verified humans table */}
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
