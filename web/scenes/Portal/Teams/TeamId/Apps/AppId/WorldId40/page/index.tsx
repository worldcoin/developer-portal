import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getSdk } from "./graphql/server/fetch-rp-registration.generated";

type Props = {
  params: {
    teamId: string;
    appId: string;
  };
};

type RpStatus = "pending" | "registered" | "failed" | "deactivated";

const statusConfig: Record<
  RpStatus,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-500",
    bgColor: "bg-yellow-50",
    dotColor: "bg-amber-500",
  },
  registered: {
    label: "Active",
    color: "text-green-500",
    bgColor: "bg-green-50",
    dotColor: "bg-green-500",
  },
  failed: {
    label: "Rejected",
    color: "text-system-error-500",
    bgColor: "bg-red-50",
    dotColor: "bg-system-error-500",
  },
  deactivated: {
    label: "Deactivated",
    color: "text-grey-500",
    bgColor: "bg-grey-100",
    dotColor: "bg-grey-500",
  },
};

export const WorldId40Page = async ({ params }: Props) => {
  const { appId } = params;

  const client = await getAPIServiceGraphqlClient();
  const { rp_registration } = await getSdk(client).FetchRpRegistration({
    appId,
  });

  const rpData = rp_registration[0];

  if (!rpData) {
    return (
      <SizingWrapper className="flex flex-col gap-y-8 py-10">
        <Typography variant={TYPOGRAPHY.H3} className="text-grey-900">
          World ID 4.0
        </Typography>
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          No RP registration found for this app.
        </Typography>
      </SizingWrapper>
    );
  }

  const status = rpData.status as RpStatus;
  const statusInfo = statusConfig[status] || statusConfig.pending;

  const { isActive, isFailed, isPending, isDeactivated } = {
    isActive: status === "registered",
    isFailed: status === "failed",
    isPending: status === "pending",
    isDeactivated: status === "deactivated",
  };

  const formattedDate = new Date(rpData.created_at).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );

  const modeLabel =
    rpData.mode === "managed" ? "Portal-Managed" : "Self-Managed";

  return (
    <SizingWrapper className="py-10">
      <div className="flex max-w-[580px] flex-col gap-y-8">
        {/* Header */}
        <div className="flex flex-col gap-y-3">
          <Typography
            variant={TYPOGRAPHY.H6}
            className="text-2xl font-semibold"
          >
            World ID 4.0
          </Typography>
          <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
            Registered {formattedDate}
          </Typography>
        </div>

        {/* RP ID */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
              RP ID
            </Typography>
            <Typography variant={TYPOGRAPHY.B3} className="text-grey-900">
              {rpData.rp_id}
            </Typography>
          </div>
          <CopyButton
            fieldName="RP ID"
            fieldValue={rpData.rp_id}
            className="text-grey-500"
          />
        </div>

        {/* Management Mode */}
        <div className="flex flex-col gap-0.5">
          <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
            Management Mode
          </Typography>
          <Typography variant={TYPOGRAPHY.B3} className="text-grey-900">
            {modeLabel}
          </Typography>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-0.5">
          <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
            Status
          </Typography>
          <div className="flex items-center gap-2">
            <div
              className={`p-1 ${statusInfo.bgColor} flex items-center justify-center rounded-full`}
            >
              <div className={`size-2 ${statusInfo.dotColor} rounded-full`} />
            </div>
            <Typography variant={TYPOGRAPHY.B3} className={statusInfo.color}>
              {statusInfo.label}
            </Typography>
            {isFailed && (
              <DecoratedButton
                type="button"
                variant="primary"
                className="ml-4 h-8 rounded-full px-4 py-0 text-xs"
              >
                Try again
              </DecoratedButton>
            )}
          </div>
        </div>

        {/* Key Section */}
        <div className="mt-4 flex flex-col gap-4">
          <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
            Key
          </Typography>

          <div className="rounded-xl border border-grey-100 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
                  Reset signer key
                </Typography>
                <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                  This will create a new signer key and disable the existing key
                </Typography>
              </div>
              <DecoratedButton
                type="button"
                variant="secondary"
                disabled={!isActive}
                className="h-8 rounded-full px-4 py-0 text-xs"
              >
                Reset
              </DecoratedButton>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-4 flex flex-col gap-y-6">
          <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
            Danger zone
          </Typography>

          <div className="rounded-xl border border-grey-100 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
                  Deactivate RP
                </Typography>
                <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                  Deactivate this RP and stop all related activity
                </Typography>
              </div>
              <DecoratedButton
                type="button"
                variant={isActive ? "danger" : "secondary"}
                disabled={!isActive}
                className="h-8 rounded-full px-4 py-0 text-xs"
              >
                Deactivate
              </DecoratedButton>
            </div>
          </div>

          <div className="rounded-xl border border-grey-100 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Typography variant={TYPOGRAPHY.S2} className="text-gray-900">
                  Switch to Self-Managed
                </Typography>
                <Typography variant={TYPOGRAPHY.B3} className="text-grey-500">
                  Move this RP to a self-managed configuration
                </Typography>
              </div>
              <DecoratedButton
                type="button"
                variant={isActive ? "danger" : "secondary"}
                disabled={!isActive}
                className="h-8 rounded-full px-4 py-0 text-xs"
              >
                Switch
              </DecoratedButton>
            </div>
          </div>
        </div>
      </div>
    </SizingWrapper>
  );
};
