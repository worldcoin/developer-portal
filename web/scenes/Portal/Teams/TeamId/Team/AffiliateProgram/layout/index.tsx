"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser, IdentityVerificationStatus } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkIfProduction, checkUserPermissions } from "@/lib/utils";
import { affiliateEnabledAtom } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/affiliate-enabled-atom";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtom } from "jotai/index";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo } from "react";

type TeamIdLayoutProps = {
  children: ReactNode;
};

export const AffiliateProgramLayout = (props: TeamIdLayoutProps) => {
  const params = useParams();
  const teamId = params.teamId as string;
  const pathname = usePathname();
  const router = useRouter();
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const [affiliateEnabled] = useAtom(affiliateEnabledAtom);
  
  // Skip fetching metadata if affiliate program is not enabled
  const { data: metadata, loading: isMetadataLoading } =
    useGetAffiliateMetadata({ 
      skip: !affiliateEnabled.isFetched || !affiliateEnabled.value
    });

  const isProduction = checkIfProduction();
  const hasOwnerPermission = useMemo(
    () => checkUserPermissions(auth0User, teamId ?? "", [Role_Enum.Owner]),
    [auth0User, teamId],
  );

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
  const hideTabs = isWithdrawPage || isRewardsPage || isVerifyPage;
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

    if (affiliateEnabled.isFetched && !affiliateEnabled.value) {
      return router.push(urls.teams({ team_id: teamId }));
    }

    // Check owner permissions for owner-only pages (most restrictive check first)
    if (isOwnerOnlyPage && !hasOwnerPermission) {
      return router.push(urls.affiliateProgram({ team_id: teamId }));
    }

    // Check verification status (but allow verify page itself)
    if (!isVerifyPage && isVerificationRequired) {
      return router.push(urls.affiliateProgramVerify({ team_id: teamId }));
    }

    // If on verify page but already verified, redirect to overview
    if (isVerifyPage && !isVerificationRequired) {
      return router.push(urls.affiliateProgram({ team_id: teamId }));
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
    affiliateEnabled,
  ]);

  if (
    !metadata ||
    isMetadataLoading ||
    !affiliateEnabled?.value || !affiliateEnabled.isFetched ||
    (!isVerifyPage && isVerificationRequired) 
  )
    return null;

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
