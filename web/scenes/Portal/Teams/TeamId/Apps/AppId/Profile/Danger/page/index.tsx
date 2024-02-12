"use client";
import { useAtom } from "jotai";
import { unverifiedImageAtom, viewModeAtom } from "../../layout";
import { useFetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { useFetchImagesQuery } from "../../graphql/client/fetch-images.generated";
import { AppTopBar } from "../../PageComponents/AppTopBar";
import clsx from "clsx";
import Error from "next/error";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { DecoratedButton } from "@/components/DecoratedButton";

import { useMemo, useState } from "react";
import { DeleteModal } from "./DeleteModal";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import { Role_Enum } from "@/graphql/graphql";

type AppProfileDangerPageProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfileDangerPage = ({ params }: AppProfileDangerPageProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [viewMode] = useAtom(viewModeAtom);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [_, setUnverifiedImages] = useAtom(unverifiedImageAtom);
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

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
  const appMetaData = useMemo(() => {
    if (viewMode === "verified") {
      return app?.verified_app_metadata[0];
    } else {
      // Null check in case app got verified and has no unverified metadata
      return app?.app_metadata?.[0] ?? app?.verified_app_metadata[0];
    }
  }, [app, viewMode]);

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
          appName={appMetaData?.name ?? ""}
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
                {appMetaData?.name ?? ""}
              </Typography>{" "}
              and its data for everyone. This cannot be undone.
            </Typography>
          </div>
          <DecoratedButton
            type="button"
            variant="danger"
            onClick={() => setOpenDeleteModal(true)}
            className={clsx("bg-system-error-100 w-fit ", {
              hidden: !isEnoughPermissions,
            })}
          >
            <Typography variant={TYPOGRAPHY.R3}>Delete app</Typography>
          </DecoratedButton>
        </div>
      </div>
    );
  }
};
