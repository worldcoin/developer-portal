"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions, truncateString } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtom } from "jotai";
import Error from "next/error";
import { useMemo, useState } from "react";
import { AppTopBar } from "../../AppTopBarRefactored";
import { useFetchAppMetadataQuery } from "../../graphql/client/fetch-app-metadata.generated";
import { viewModeAtom } from "../../layout/ImagesProvider";
import { DeleteModal } from "./DeleteModal";

type AppProfileDangerPageProps = {
  params: Record<string, string> | null | undefined;
};

export const AppProfileDangerPage = ({ params }: AppProfileDangerPageProps) => {
  const appId = params?.appId as `app_${string}`;
  const teamId = params?.teamId as `team_${string}`;
  const [viewMode] = useAtom(viewModeAtom);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
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

  if (loading) {
    return <div></div>;
  } else if (!app) {
    return <Error statusCode={404} title="App not found" />;
  } else {
    return (
      <>
        <SizingWrapper gridClassName="order-1 pt-8">
          <AppTopBar appId={appId} teamId={teamId} app={app} />

          <hr className="my-5 w-full border-dashed text-grey-200 " />
        </SizingWrapper>

        <SizingWrapper gridClassName="order-2 pb-8 pt-4">
          <div className="grid grid-cols-1 gap-y-10 md:w-1/2">
            <div className="grid gap-y-2">
              <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
                Danger Zone
              </Typography>

              <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                This will immediately and permanently delete the app{" "}
                <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
                  {truncateString(appMetaData?.name, 30)}
                </Typography>{" "}
                and its data for everyone. This cannot be undone.
              </Typography>
            </div>

            <DecoratedButton
              type="button"
              variant="danger"
              onClick={() => setOpenDeleteModal(true)}
              className={clsx("w-fit bg-system-error-100 ", {
                hidden: !isEnoughPermissions,
              })}
            >
              <Typography variant={TYPOGRAPHY.R3}>Delete app</Typography>
            </DecoratedButton>
          </div>
        </SizingWrapper>

        <DeleteModal
          appName={appMetaData?.name ?? ""}
          appId={appId}
          teamId={teamId}
          openDeleteModal={openDeleteModal}
          setOpenDeleteModal={setOpenDeleteModal}
        />
      </>
    );
  }
};
