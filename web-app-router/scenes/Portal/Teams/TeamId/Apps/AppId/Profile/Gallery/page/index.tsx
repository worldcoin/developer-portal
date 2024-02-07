"use client";
import { useAtom } from "jotai";
import { AppTopBar } from "../../PageComponents/AppTopBar";
import { unverifiedImageAtom } from "../../layout";
import { ImageForm } from "./ImageForm";
import { useFetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import Error from "next/error";

type AppProfileGalleryProps = {
  params: Record<string, string> | null | undefined;
};
export const AppProfileGalleryPage = ({ params }: AppProfileGalleryProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
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

  const {} = useFetchImagesQuery({
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
  if (loading) return <div></div>;
  else if (error || !app) {
    return <Error statusCode={404} title="App not found" />;
  } else {
    return (
      <div className="py-8 gap-y-4 grid pb-14">
        <AppTopBar appId={appId} teamId={teamId} app={app} />
        <hr className="my-5 w-full text-grey-200 border-dashed " />
        <div className="grid grid-cols-1 max-w-[600px]">
          <ImageForm
            appId={appId}
            teamId={teamId}
            appMetadataId={app.app_metadata[0].id}
            app={app}
          />
        </div>
      </div>
    );
  }
};
