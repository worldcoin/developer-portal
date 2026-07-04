import { SizingWrapper } from "@/components/SizingWrapper";
import { logger } from "@/lib/logger";
import { urls } from "@/lib/urls";
import { SectionSubTabs } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/common/SectionSubTabs";
import { fetchAppEnvCached } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";

/**
 * World ID section sub-tabs (World ID 4.0 / Actions / World ID 3.0 Legacy).
 *
 * Server component so tab visibility is derived from the app's real state. It
 * reads app-env through `fetchAppEnvCached`, which is React `cache()`-wrapped,
 * so it shares the single FetchAppEnv round trip with the dashboard page within
 * a request instead of adding a second one. `AppIdChrome` renders it inside a
 * <Suspense> boundary, so it streams in without blocking the layout shell or
 * the route's `loading.tsx` skeleton.
 *
 * The sub-tabs are non-critical chrome: if the app-env fetch fails we log and
 * render nothing (degraded mode) rather than failing the whole app section —
 * the page owns surfacing a hard error for its own data.
 */
export const AppWorldIdSubTabs = async (props: {
  teamId: string;
  appId: string;
}) => {
  const { teamId, appId } = props;

  let hasRpRegistration = false;
  let hasLegacyActions = false;

  try {
    const { app, action } = await fetchAppEnvCached(appId);
    hasRpRegistration = (app?.[0]?.rp_registration?.length ?? 0) > 0;
    hasLegacyActions = action.length > 0;
  } catch (error) {
    logger.warn("AppWorldIdSubTabs: FetchAppEnv failed, hiding sub-tabs", {
      error,
      appId,
      teamId,
    });
    return null;
  }

  if (!hasRpRegistration && !hasLegacyActions) {
    return null;
  }

  return (
    <div className="md:border-b md:border-grey-100 md:bg-grey-50">
      <SizingWrapper variant="nav">
        <SectionSubTabs
          items={[
            {
              label: "World ID 4.0",
              href: `/teams/${teamId}/apps/${appId}/world-id-4-0`,
              segment: "world-id-4-0",
              hidden: !hasRpRegistration,
            },
            {
              label: "Actions",
              href: `/teams/${teamId}/apps/${appId}/world-id-actions`,
              segment: "world-id-actions",
              hidden: !hasRpRegistration,
            },
            {
              label: "World ID 3.0 Legacy",
              href: urls.actions({ team_id: teamId, app_id: appId }),
              segment: "actions",
              hidden: !hasLegacyActions,
            },
          ]}
        />
      </SizingWrapper>
    </div>
  );
};
