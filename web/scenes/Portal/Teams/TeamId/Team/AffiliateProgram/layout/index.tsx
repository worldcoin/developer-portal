"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser, IdentityVerificationStatus } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkIfProduction, checkUserPermissions } from "@/lib/utils";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { getParameter } from "../common/server/getParameter";

type TeamIdLayoutProps = {
  children: ReactNode;
};

export const AffiliateProgramLayout = (props: TeamIdLayoutProps) => {
  const params = useParams();
  const teamId = params.teamId as string;
  const pathname = usePathname();
  const router = useRouter();
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const { data: metadata, loading: isMetadataLoading } =
    useGetAffiliateMetadata();

  const isProduction = checkIfProduction();
  const hasOwnerPermission = useMemo(
    () => checkUserPermissions(auth0User, teamId ?? "", [Role_Enum.Owner]),
    [auth0User, teamId],
  );
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    const fetchParameters = async () => {
      const isAffiliateProgramEnabled = await getParameter<boolean>(
        "/affiliate-program/enabled",
        false,
      );
      const enabledTeams = await getParameter<string[]>(
        "/affiliate-program/enabled",
        [],
      );
      console.log("fetched params", isAffiliateProgramEnabled, enabledTeams);
      if (
        isAffiliateProgramEnabled ||
        enabledTeams?.includes(teamId as string)
      ) {
        setIsEnabled(true);
      } else {
        router.push(urls.teams({ team_id: teamId }));
      }
    };
    fetchParameters();
  }, [teamId]);

  // Step 3: Define page types (deterministic categorization)
  const isVerifyPage = useMemo(
    () => pathname === urls.affiliateProgramVerify({ team_id: teamId }),
    [pathname, teamId],
  );
  const isWithdrawPage = useMemo(
    () => pathname === urls.affiliateWithdrawal({ team_id: teamId }),
    [pathname, teamId],
  );
  const isAccountPage = useMemo(
    () => pathname === urls.affiliateAccount({ team_id: teamId }),
    [pathname, teamId],
  );
  const isRewardsPage = useMemo(
    () => pathname === urls.affiliateRewards({ team_id: teamId }),
    [pathname, teamId],
  );
  const isOwnerOnlyPage = isWithdrawPage || isAccountPage;
  const hideTabs = isWithdrawPage || isRewardsPage;
  const isVerificationRequired = useMemo(
    () =>
      metadata?.identityVerificationStatus !==
      IdentityVerificationStatus.SUCCESS,
    [metadata?.identityVerificationStatus],
  );

  // Handle redirects client-side
  useEffect(() => {
    // Wait for metadata to load
    if (isMetadataLoading || !metadata) {
      return;
    }

    // Check owner permissions for owner-only pages (most restrictive check first)
    if (isOwnerOnlyPage && !hasOwnerPermission) {
      router.push(urls.affiliateProgram({ team_id: teamId }));
      return;
    }

    // Check verification status (but allow verify page itself)
    if (!isVerifyPage && isVerificationRequired) {
      router.push(urls.affiliateProgramVerify({ team_id: teamId }));
      return;
    }

    // If on verify page but already verified, redirect to overview
    if (isVerifyPage && !isVerificationRequired) {
      router.push(urls.affiliateProgram({ team_id: teamId }));
      return;
    }
  }, [
    isMetadataLoading,
    metadata,
    isProduction,
    isOwnerOnlyPage,
    hasOwnerPermission,
    isVerifyPage,
    isVerificationRequired,
    teamId,
    router,
  ]);

  if (!metadata || isMetadataLoading || !isEnabled) return null;

  return (
    <div className="flex flex-col">
      <div className="order-2 md:order-1 md:w-full md:border-b md:border-grey-100">
        {!hideTabs && (
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
              {hasOwnerPermission && (
                <Tab
                  className="md:py-4"
                  href={`/teams/${teamId}/affiliate-program/account`}
                  segment={"account"}
                  underlined
                >
                  <Typography variant={TYPOGRAPHY.R4}>Account</Typography>
                </Tab>
              )}
            </Tabs>
          </SizingWrapper>
        )}
      </div>

      {props.children}
    </div>
  );
};
