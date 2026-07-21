"use client";

import { ChevronLeftIcon } from "@/components/Icons/ChevronLeftIcon";
import { ErrorPage } from "@/components/ErrorPage";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useQuery } from "@apollo/client/react";
import { FetchAppMetadataDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import Link from "next/link";
import { useParams } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import { DangerZoneSection } from "./DangerZoneSection";

type AppDangerZonePageProps = {
  params: Record<string, string> | null | undefined;
};

export const AppDangerZonePage = ({ params }: AppDangerZonePageProps) => {
  const routeParams = useParams<{ appId: `app_${string}`; teamId: string }>();
  const appId = (params?.appId || routeParams?.appId) as `app_${string}`;
  const teamId = (params?.teamId || routeParams?.teamId) as `team_${string}`;
  const { data, loading, error } = useQuery(FetchAppMetadataDocument, {
    variables: { id: appId },
  });

  const app = data?.app[0];
  const appMetadata = app?.app_metadata?.[0] ?? app?.verified_app_metadata?.[0];

  if (loading) {
    return (
      <SizingWrapper variant="nav" gridClassName="order-1 py-10">
        <div className="max-w-3xl">
          <Skeleton count={3} height={44} />
        </div>
      </SizingWrapper>
    );
  }

  if (error || !app || !appMetadata) {
    return (
      <SizingWrapper variant="nav" gridClassName="order-1 md:order-2">
        <ErrorPage statusCode={404} title="App not found" />
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper variant="nav" gridClassName="order-1">
      <main className="grid max-w-3xl gap-y-8 py-10">
        <Link
          href={urls.configuration({ team_id: teamId, app_id: appId })}
          className="flex w-fit items-center gap-x-1 text-grey-500 transition-colors hover:text-grey-900"
        >
          <ChevronLeftIcon className="size-5" />
          <Typography variant={TYPOGRAPHY.R4}>Back to configuration</Typography>
        </Link>

        <div className="grid gap-y-2">
          <Typography as="h1" variant={TYPOGRAPHY.H5} className="text-grey-900">
            Danger zone
          </Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Destructive app settings are kept separate from everyday
            configuration.
          </Typography>
        </div>

        <DangerZoneSection
          appId={appId}
          teamId={teamId}
          appName={appMetadata.name}
        />
      </main>
    </SizingWrapper>
  );
};
