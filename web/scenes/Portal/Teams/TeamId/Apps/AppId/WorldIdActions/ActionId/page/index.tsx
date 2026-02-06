"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ActionsHeader } from "@/components/ActionsHeader";
import { urls } from "@/lib/urls";

type WorldIdActionIdPageProps = {
  params: Record<string, string> | null | undefined;
};

export const WorldIdActionIdPage = ({ params }: WorldIdActionIdPageProps) => {
  const actionId = params?.actionId;
  const teamId = params?.teamId;
  const appId = params?.appId;

  return (
    <>
      <SizingWrapper gridClassName="order-1 pt-6 md:pt-10">
        <ActionsHeader
          displayText={actionId ?? "Action"}
          backText="Back to Actions"
          backUrl={urls.worldIdActions({
            team_id: teamId ?? "",
            app_id: appId,
          })}
          isLoading={false}
          analyticsContext={{
            teamId,
            appId,
            actionId,
            location: "world-id-actions",
          }}
        />

        <hr className="mt-5 w-full border-dashed text-grey-200" />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 pt-2 pb-6 md:pb-10">
        <div className="grid w-full gap-y-6">
          <Typography variant={TYPOGRAPHY.H7}>Overview</Typography>

          <div className="rounded-lg border border-grey-200 bg-grey-50 p-8 text-center">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              Overview content coming soon...
            </Typography>
          </div>
        </div>
      </SizingWrapper>
    </>
  );
};
