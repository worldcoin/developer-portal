"use client";
import { useFetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { useGetActionsQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Actions/page/graphql/client/actions.generated";

/**
 * Capability flags that drive conditional nav (Mini App / Legacy actions).
 * Composes existing generated queries — Apollo cache dedupes them with the
 * pages that already run them. `loaded` gates rendering so conditional items
 * never flash in or out.
 * `loaded` additionally requires at least one query to have returned data — if both settle with no data (total failure), conditional nav items stay hidden (fail closed); core nav is unaffected.
 */
export const useAppCapabilities = (appId: string | null | undefined) => {
  const skip = !appId;
  const metadata = useFetchAppMetadataQuery({
    variables: { id: appId! },
    skip,
  });
  const legacy = useGetActionsQuery({ variables: { app_id: appId! }, skip });
  const loaded =
    !skip &&
    !metadata.loading &&
    !legacy.loading &&
    (!!metadata.data || !!legacy.data);
  return {
    isMiniApp:
      metadata.data?.app?.[0]?.app_metadata?.[0]?.app_mode === "mini-app",
    hasLegacyActions: (legacy.data?.actions?.length ?? 0) > 0,
    loaded,
  };
};
