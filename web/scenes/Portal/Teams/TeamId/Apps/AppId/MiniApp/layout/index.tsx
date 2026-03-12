import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { fetchAppEnvCached } from "../../layout/server/fetch-app-env";

type MiniAppLayoutProps = {
  children: ReactNode;
  params: {
    teamId?: string;
    appId?: string;
  };
};

export const MiniAppLayout = async (props: MiniAppLayoutProps) => {
  const { appId, teamId } = props.params;

  if (appId && teamId) {
    const { app } = await fetchAppEnvCached(appId);
    const activeMetadata =
      app[0]?.app_metadata[0] ?? app[0]?.verified_app_metadata[0];

    if (activeMetadata?.app_mode !== "mini-app") {
      redirect(
        urls.configuration({
          team_id: teamId,
          app_id: appId,
        }),
      );
    }
  }

  return (
    <div>
      <SizingWrapper variant="nav" className="w-full">
        {props.children}
      </SizingWrapper>
    </div>
  );
};
