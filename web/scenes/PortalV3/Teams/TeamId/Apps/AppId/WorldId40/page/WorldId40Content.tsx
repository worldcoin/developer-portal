"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Notification } from "@/components/Notification";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  type RpEnvironment,
  type RpStatus,
  useRpRegistrationController,
} from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/use-rp-registration-controller";
import { useRouter } from "next/navigation";
import { WorldId40Settings } from "./WorldId40Settings";

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

type WorldId40ContentProps = {
  appId: string;
  rpId: string;
  initialStatus: RpStatus;
  initialStagingStatus: RpStatus | null;
  mode: string;
  createdAt: string;
  canManageWorldId: boolean;
};

export const WorldId40Content = (props: WorldId40ContentProps) => {
  const router = useRouter();
  const {
    productionStatus,
    stagingStatus,
    retryingEnvironment,
    retryRegistration,
    markProductionPending,
  } = useRpRegistrationController({
    rpId: props.rpId,
    initialProductionStatus: props.initialStatus,
    initialStagingStatus: props.initialStagingStatus,
  });

  const formattedDate = new Date(props.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const renderStatusRow = (
    label: string,
    status: RpStatus,
    environment: RpEnvironment,
  ) => {
    const info = statusConfig[status];
    const isRetrying = retryingEnvironment === environment;

    return (
      <div className="flex flex-col gap-0.5">
        <Typography variant={TYPOGRAPHY.B4} className="text-gray-500">
          {label}
        </Typography>
        <div className="flex items-center justify-between rounded-xl">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center rounded-full p-1 ${info.bgColor}`}
            >
              <div className={`size-2 rounded-full ${info.dotColor}`} />
            </div>
            <Typography variant={TYPOGRAPHY.B3} className={info.color}>
              {info.label}
            </Typography>
          </div>
          {status === "failed" && props.canManageWorldId ? (
            <DecoratedButton
              type="button"
              variant="primary"
              className="h-8 rounded-full px-4 py-0 text-xs"
              disabled={isRetrying}
              onClick={() => void retryRegistration(environment)}
            >
              {isRetrying ? "Retrying..." : "Try again"}
            </DecoratedButton>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <SizingWrapper className="py-10">
      <div className="flex max-w-[580px] flex-col gap-y-8">
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

        <Notification variant="info" className="items-start">
          <div className="text-blue-700">
            <Typography
              as="p"
              variant={TYPOGRAPHY.S3}
              className="text-blue-800"
            >
              Preview notice
            </Typography>
            <Typography as="p" variant={TYPOGRAPHY.S4} className="mt-1">
              World ID 4.0 is currently in preview for early adopters. Once
              World ID 4.0 is generally available, we may ask developers to
              rotate their signer key.
            </Typography>
          </div>
        </Notification>

        <WorldId40Settings
          appId={props.appId}
          rpId={props.rpId}
          mode={props.mode}
          productionStatus={productionStatus}
          variant="standalone"
          canManageWorldId={props.canManageWorldId}
          statusContent={
            <>
              {renderStatusRow(
                "Production Status",
                productionStatus,
                "production",
              )}
              {renderStatusRow(
                "Staging Status",
                stagingStatus ?? "pending",
                "staging",
              )}
            </>
          }
          onProductionPending={markProductionPending}
          onModeSwitchSuccess={() => router.refresh()}
        />
      </div>
    </SizingWrapper>
  );
};
