import { redirectWithExplicitVersion } from "../../redirectWithExplicitVersion";

type Props = {
  params: {
    teamId: string;
    appId: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function LegacyPermissionsPage({
  params,
  searchParams,
}: Props) {
  redirectWithExplicitVersion(
    `/teams/${params.teamId}/apps/${params.appId}/mini-app/permissions`,
    searchParams,
  );
}
