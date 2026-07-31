// Deliberately not a "use server" module: only the server-rendered page calls
// this, and marking it would expose an unauthorized server action that answers
// app_mode for any app id. Same shape as layout/server/fetch-app-env.
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { logger } from "@/lib/logger";
import { getSdk as getAppModeSdk } from "@/scenes/common/Teams/TeamId/Apps/AppId/MiniApp/Transactions/page/graphql/server/get-app-mode.generated";

// `category` may be the "External" app-store category even for a Mini App, so
// the external check must look at app_mode only — never the category. Verified
// metadata wins, falling back to the autosaved draft when the app has no
// verified version, matching the notifications gate.
export const getIsExternalApp = async (appId: string) => {
  try {
    const { app } = await getAppModeSdk(
      await getAPIServiceGraphqlClient(),
    ).GetAppMode({ id: appId });

    const meta = app[0]?.verified_app_metadata[0] ?? app[0]?.app_metadata[0];
    return meta?.app_mode === "external";
  } catch (error) {
    logger.error("Failed to fetch app mode", { error, app_id: appId });
    return false;
  }
};
