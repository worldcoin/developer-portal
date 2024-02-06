"use client";
import { useAtom } from "jotai";
import { unverifiedImageAtom } from "../../layout";
import { useFetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import { AppTopBar } from "../../PageComponents/AppTopBar";
import clsx from "clsx";
import Error from "next/error";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { DecoratedButton } from "@/components/DecoratedButton";

import { useState } from "react";
import { DeleteModal } from "./DeleteModal";

type AppProfileDangerPageProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfileDangerPage = ({ params }: AppProfileDangerPageProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [_, setUnverifiedImages] = useAtom(unverifiedImageAtom);

  const { data, loading } = useFetchAppMetadataQuery({
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

  if (loading) return <div></div>;
  else if (!app) {
    return <Error statusCode={404} title="App not found" />;
  } else {
    return (
      <div
        className={clsx("py-8 gap-y-4 grid", {
          hidden: loading || loadingImages,
        })}
      >
        <DeleteModal
          app={app}
          appId={appId}
          teamId={teamId}
          openDeleteModal={openDeleteModal}
          setOpenDeleteModal={setOpenDeleteModal}
        />
        <AppTopBar appId={appId} teamId={teamId} app={app} />
        <hr className="my-5 w-full text-grey-200 border-dashed" />
        <div className="w-1/2 grid grid-cols-1 gap-y-10">
          <div className="grid gap-y-2">
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
              Danger Zone
            </Typography>
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              This will immediately and permanently delete{" "}
              <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
                {app?.app_metadata[0].name ?? ""}
              </Typography>{" "}
              and its data for everyone. This cannot be undone.
            </Typography>
          </div>
          <DecoratedButton
            type="button"
            variant="danger"
            onClick={() => setOpenDeleteModal(true)}
            // disabled={deleteActionLoading}
            className="bg-system-error-100 w-fit "
          >
            <Typography variant={TYPOGRAPHY.R3}>Delete app</Typography>
          </DecoratedButton>
        </div>
      </div>
    );
  }
};
