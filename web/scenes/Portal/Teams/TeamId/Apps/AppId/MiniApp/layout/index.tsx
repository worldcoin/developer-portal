import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { getUrlFromHeaders } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { fetchAppEnvCached } from "../../layout/server/fetch-app-env";
import { appendVersionParam, getSelectedAppVersion } from "../../versioning";

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
    const hasDraftMiniApp = app[0]?.app_metadata[0]?.app_mode === "mini-app";
    const hasVerifiedMiniApp =
      app[0]?.verified_app_metadata[0]?.app_mode === "mini-app";
    const requestUrl = getUrlFromHeaders() || "";
    const url = new URL(requestUrl || "/", "https://world.test");
    const selectedVersion = getSelectedAppVersion({
      hasDraft: Boolean(app[0]?.app_metadata[0]),
      hasVerified: Boolean(app[0]?.verified_app_metadata[0]),
      searchParams: url.searchParams,
    });
    const isMiniAppEnabled =
      selectedVersion === "approved" ? hasVerifiedMiniApp : hasDraftMiniApp;

    if (!isMiniAppEnabled) {
      redirect(
        appendVersionParam({
          path: urls.configuration({
            team_id: teamId,
            app_id: appId,
          }),
          version: selectedVersion,
          hasDraft: Boolean(app[0]?.app_metadata[0]),
          hasVerified: Boolean(app[0]?.verified_app_metadata[0]),
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
