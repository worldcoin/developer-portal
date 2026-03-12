"use client";

import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useFetchAppMetadataQuery } from "../../Configuration/graphql/client/fetch-app-metadata.generated";
import { getMiniAppNavState } from "../../versioning";
import { SectionSubTabs } from "../../common/SectionSubTabs";

export const MiniAppSubTabs = () => {
  const params = useParams<{ teamId: string; appId: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data } = useFetchAppMetadataQuery({
    variables: { id: params?.appId ?? "" },
    skip: !params?.appId,
  });
  const app = data?.app[0];
  const miniAppNav = getMiniAppNavState({
    teamId: params?.teamId ?? "",
    appId: params?.appId ?? "",
    pathname,
    searchParams,
    hasDraft: (app?.app_metadata.length ?? 0) > 0,
    hasVerified: (app?.verified_app_metadata.length ?? 0) > 0,
    preserveRequestedVersion: app === undefined,
  });

  return (
    <SectionSubTabs
      items={[
        {
          label: "Permissions",
          href: miniAppNav.permissionsPath,
          segment: "mini-app",
          active: miniAppNav.isPermissionsActive,
        },
        {
          label: "Transactions",
          href: miniAppNav.transactionsPath,
          segment: "mini-app",
          active: miniAppNav.isTransactionsActive,
        },
        {
          label: "Notifications",
          href: miniAppNav.notificationsPath,
          segment: "mini-app",
          active: miniAppNav.isNotificationsActive,
        },
      ]}
    />
  );
};
