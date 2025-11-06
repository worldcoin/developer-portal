import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { checkIfProduction } from "@/lib/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { getAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/server/getAffiliateMetadata";
import {
  AffiliateMetadataResponse,
  IdentityVerificationStatus,
} from "@/lib/types";

type Params = {
  teamId?: string;
};

type TeamIdLayoutProps = {
  params: Params;
  children: ReactNode;
};

export const AffiliateProgramLayout = async (props: TeamIdLayoutProps) => {
  const params = props.params;
  const teamId = params.teamId!;
  const isProduction = checkIfProduction();
  const headersList = headers();
  const path = headersList.get("x-current-path");
  const result = await getAffiliateMetadata();
  if (!result.success) {
    return redirect(urls.teams({ team_id: teamId }));
  }
  const metadata = result.data as AffiliateMetadataResponse;

  // Disable affiliate program for production
  if (isProduction) {
    return redirect(urls.teams({ team_id: teamId }));
  }

  if (
    !path?.includes("/verify") &&
    metadata.identityVerificationStatus !== IdentityVerificationStatus.SUCCESS
  ) {
    return redirect(urls.affiliateProgramVerify({ team_id: teamId }));
  }

  if (
    path?.includes("/verify") &&
    metadata.identityVerificationStatus === IdentityVerificationStatus.SUCCESS
  ) {
    return redirect(urls.affiliateProgram({ team_id: teamId }));
  }

  if (
    metadata.identityVerificationStatus !==
      IdentityVerificationStatus.SUCCESS ||
    path === urls.affiliateWithdrawal({ team_id: teamId }) ||
    path === urls.affiliateRewards({ team_id: teamId })
  ) {
    return props.children;
  }

  return (
    <div className="flex flex-col">
      <div className="order-2 md:order-1 md:w-full md:border-b md:border-grey-100">
        <SizingWrapper variant="nav">
          <Tabs className="px-6 py-4 font-gta md:py-0">
            <Tab
              className="md:py-4"
              href={`/teams/${teamId}/affiliate-program`}
              segment={null}
              underlined
            >
              <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
            </Tab>
            <Tab
              className="md:py-4"
              href={`/teams/${teamId}/affiliate-program/earnings`}
              segment={"earnings"}
              underlined
            >
              <Typography variant={TYPOGRAPHY.R4}>Earnings</Typography>
            </Tab>
            <Tab
              className="md:py-4"
              href={`/teams/${teamId}/affiliate-program/how-it-works`}
              segment={"how-it-works"}
              underlined
            >
              <Typography variant={TYPOGRAPHY.R4}>How it works</Typography>
            </Tab>
            <Tab
              className="md:py-4"
              href={`/teams/${teamId}/affiliate-program/account`}
              segment={"account"}
              underlined
            >
              <Typography variant={TYPOGRAPHY.R4}>Account</Typography>
            </Tab>
          </Tabs>
        </SizingWrapper>
      </div>

      {props.children}
    </div>
  );
};
