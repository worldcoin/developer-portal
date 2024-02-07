"use client";
import { useAtom } from "jotai";
import { useFetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import { unverifiedImageAtom, viewModeAtom } from "../../layout";
import Error from "next/error";
import { AppTopBar } from "../../PageComponents/AppTopBar";
import clsx from "clsx";
import { LinksForm } from "./LinksForm";

type AppProfileLinksProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfileLinksPage = ({ params }: AppProfileLinksProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [viewMode] = useAtom(viewModeAtom);
  const [_, setUnverifiedImages] = useAtom(unverifiedImageAtom);

<<<<<<< HEAD
  const { data, loading } = useFetchAppMetadataQuery({
=======
  const { data, loading, error } = useFetchAppMetadataQuery({
>>>>>>> andywang-wid-711-app-profile-overview-2
    variables: {
      id: appId,
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
  const appMetaData =
    viewMode === "verified"
      ? app?.verified_app_metadata[0]
      : app?.app_metadata[0];

  if (loading) return <div></div>;
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
        <div className="grid grid-cols-1 max-w-[600px]">
          <LinksForm appId={appId} teamId={teamId} app={appMetaData} />
        </div>
      </div>
    );
  }
};
