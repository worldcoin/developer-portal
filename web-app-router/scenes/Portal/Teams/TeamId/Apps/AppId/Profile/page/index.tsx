"use client";
import { AppTopBar } from "../Components/AppTopBar";
import { useFetchAppMetadataQuery } from "../graphql/client/fetch-app-metadata.generated";
import { BasicInformation } from "./BasicInformation";
import Error from "next/error";

type AppProfilePageProps = {
  params: Record<string, string> | null | undefined;
  searchParams: Record<string, string> | null | undefined;
};

export const AppProfilePage = ({
  params,
  searchParams,
}: AppProfilePageProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;

  const { data, loading } = useFetchAppMetadataQuery({
    variables: {
      id: appId,
    },
    context: { headers: { team_id: teamId } },
  });
  const app = data?.app[0];

  if (loading) return <></>;
  else if (!app) {
    <Error statusCode={404} title="Action not found" />;
  } else {
    return (
      <div className="py-8 gap-y-4 grid">
        <AppTopBar appId={appId} teamId={teamId} app={app} />
        <hr className="my-5 w-full text-grey-200 border-dashed" />
        <BasicInformation appId={appId} teamId={teamId} app={app} />
      </div>
    );
  }
};
