import { TeamIdPage } from "@/scenes/PortalV3/Teams/TeamId/Team/page";

type AppsPageProps = {
  params: Promise<Record<string, string>>;
};

/**
 * Compatibility wrapper for code that still imports the former V3 apps index.
 * The route itself redirects to the canonical team overview.
 */
export const AppsPage = async (props: AppsPageProps) =>
  TeamIdPage({
    params: await props.params,
    searchParams: {},
  });
