"use client";
import clsx from "clsx";
import { AppTopBar } from "../PageComponents/AppTopBar";
import { useFetchAppMetadataQuery } from "../graphql/client/fetch-app-metadata.generated";
import { BasicInformation } from "./BasicInformation";
import Error from "next/error";
import { unverifiedImageAtom, viewModeAtom } from "../layout";
import { useAtom } from "jotai";
import { useFetchImagesQuery } from "../graphql/client/fetch-images.generated";
import { useFetchTeamNameQuery } from "./graphql/client/fetch-team-name.generated";

type AppProfilePageProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfilePage = ({ params }: AppProfilePageProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [_, setUnverifiedImages] = useAtom(unverifiedImageAtom);

  const { data, loading, error } = useFetchAppMetadataQuery({
    variables: {
      id: appId,
    },
    context: { headers: { team_id: teamId } },
  });

  const { data: teamData } = useFetchTeamNameQuery({
    variables: {
      id: teamId,
    },
    context: { headers: { team_id: teamId } },
  });

  const { loading: loadingImages } = useFetchImagesQuery({
    variables: {
      id: appId,
    },
    context: { headers: { team_id: teamId } },
    onCompleted: (data) => {
      setUnverifiedImages({
        logo_img_url: data?.unverified_images?.logo_img_url ?? "",
        hero_image_url: data?.unverified_images?.hero_image_url ?? "",
        showcase_image_urls: data?.unverified_images?.showcase_img_urls,
      });
    },
  });

  const app = data?.app[0];
  const teamName = teamData?.team[0]?.name;
  if (loading) return <div>Loading...</div>;
  else if (error || !app) {
    return <Error statusCode={404} title="App not found" />;
  } else {
    return (
      <div
        className={clsx("py-8 gap-y-4 grid", {
          hidden: loading || loadingImages,
        })}
      >
        <AppTopBar appId={appId} teamId={teamId} app={app} />
        <hr className="my-5 w-full text-grey-200 border-dashed" />
        <BasicInformation
          appId={appId}
          teamId={teamId}
          app={app}
          teamName={teamName ?? ""}
        />
      </div>
    );
  }
};
