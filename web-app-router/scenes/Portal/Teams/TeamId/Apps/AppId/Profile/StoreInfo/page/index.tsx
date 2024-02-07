"use client";

import { useFetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import { useAtom } from "jotai";
import { unverifiedImageAtom, viewModeAtom } from "../../layout";
import { AppTopBar } from "../../PageComponents/AppTopBar";
import Error from "next/error";
import clsx from "clsx";
import { UpdateStoreInfoForm } from "./UpdateStoreInfoForm";

type AppProfileStoreInfoProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfileStoreInfoPage = ({
  params,
}: AppProfileStoreInfoProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [viewMode] = useAtom(viewModeAtom);

  const [_, setUnverifiedImages] = useAtom(unverifiedImageAtom);

  const { data, loading } = useFetchAppMetadataQuery({
    variables: {
      id: appId,
    },
    context: { headers: { team_id: teamId } },
  });

  const { loading: imageLoading } = useFetchImagesQuery({
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
  else if (!app) {
    return <Error statusCode={404} title="App not found" />;
  } else {
    return (
      <div
        className={clsx("py-8 gap-y-4 grid", {
          hidden: loading || imageLoading,
        })}
      >
        <AppTopBar appId={appId} teamId={teamId} app={app} />
        <hr className="my-5 w-full text-grey-200 border-dashed" />
        <div className="grid grid-cols-1 max-w-[600px]">
          <UpdateStoreInfoForm
            app={appMetaData}
            teamId={teamId}
            appId={appId}
          />
        </div>
      </div>
    );
  }
};
