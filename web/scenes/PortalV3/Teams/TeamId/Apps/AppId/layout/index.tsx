import { ErrorPage } from "@/components/ErrorPage";
import { getIsUserAllowedToReadApp } from "@/lib/permissions";
import { ReactNode, Suspense } from "react";
import { AppIdChrome } from "./AppIdChrome";
import { AppWorldIdSubTabs } from "./AppWorldIdSubTabs";

type Params = {
  teamId?: string;
  appId?: string;
};

type AppIdLayoutProps = {
  params: Params;
  children: ReactNode;
};

/**
 * v3 app layout. Authorizes against the database (the session cookie's
 * `memberships` is not a trustworthy authorization source) and renders the v3
 * chrome, which drops the primary app nav in favor of the sidebar shell.
 *
 * The layout deliberately does NOT fetch app-env: doing so here would block
 * navigation on a GraphQL query before the route's `loading.tsx` skeleton could
 * appear (the layout sits above that Suspense boundary). Instead the dashboard
 * page owns the single `FetchAppEnv` round trip, and the World ID sub-tabs read
 * the same `cache()`-deduped fetch via `AppWorldIdSubTabs`, streamed in through
 * a <Suspense> boundary so it never blocks the shell.
 */
export const AppIdLayout = async (props: AppIdLayoutProps) => {
  const params = props.params;

  // Authorize against the database. Reading an app requires membership in the
  // app's owning team. A nonexistent app resolves to no permitted membership
  // here too, so this also covers the existence check that the app-env fetch
  // used to perform.
  if (!params.appId || !(await getIsUserAllowedToReadApp(params.appId))) {
    return <ErrorPage statusCode={404} title="App not found" />;
  }

  const worldIdTabs =
    params.teamId && params.appId ? (
      <Suspense fallback={null}>
        <AppWorldIdSubTabs teamId={params.teamId} appId={params.appId} />
      </Suspense>
    ) : null;

  return (
    <AppIdChrome params={params} worldIdTabs={worldIdTabs}>
      {props.children}
    </AppIdChrome>
  );
};
