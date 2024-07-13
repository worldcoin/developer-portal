"use client";
import clsx from "clsx";
import Error from "next/error";
import Skeleton from "react-loading-skeleton";
import { AppTopBar } from "../PageComponents/AppTopBar";
import { FormSkeleton } from "../PageComponents/AppTopBar/FormSkeleton";
import { useFetchAppMetadataQuery } from "../graphql/client/fetch-app-metadata.generated";
import { BasicInformation } from "./BasicInformation";
import { useFetchTeamNameQuery } from "./graphql/client/fetch-team-name.generated";
import { SizingWrapper } from "@/components/SizingWrapper";

type AppProfilePageProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfilePage = ({ params }: AppProfilePageProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  const { data, loading, error } = useFetchAppMetadataQuery({
    variables: {
      id: appId,
    },
  });

  const { data: teamData } = useFetchTeamNameQuery({
    variables: {
      id: teamId,
    },
  });

  const app = data?.app[0];
  const teamName = teamData?.team[0]?.name;

  if (!loading && (error || !app)) {
    return <Error statusCode={404} title="App not found" />;
  } else {
    return (
      <>
        <SizingWrapper gridClassName="order-1 pt-8">
          {loading ? (
            <Skeleton count={2} height={50} />
          ) : (
            <AppTopBar appId={appId} teamId={teamId} app={app!} />
          )}

          <hr className="my-5 w-full border-dashed text-grey-200" />
        </SizingWrapper>

        <SizingWrapper gridClassName="order-2 pb-8 pt-4">
          {loading ? (
            <FormSkeleton count={4} />
          ) : (
            <BasicInformation
              appId={appId}
              teamId={teamId}
              app={app!}
              teamName={teamName ?? ""}
            />
          )}
        </SizingWrapper>
      </>
    );
  }
};
