"use client";

import { isWorldId40Enabled, worldId40Atom } from "@/lib/feature-flags";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ClientPage } from "./ClientPage";
import { NewClientPage } from "./NewClientPage";

type AppsPageClientProps = {
  enabledTeams: string[];
};

export const AppsPageClient = (props: AppsPageClientProps) => {
  const { enabledTeams } = props;
  const [worldId40Config, setWorldId40Config] = useAtom(worldId40Atom);
  const { teamId } = useParams() as { teamId: string | undefined };

  // Hydrate the atom with server-fetched data on first load
  useEffect(() => {
    if (!worldId40Config.isFetched) {
      setWorldId40Config({
        isFetched: true,
        enabledTeams,
      });
    }
  }, [enabledTeams, worldId40Config.isFetched, setWorldId40Config]);

  // Use atom to determine which page to show
  const useNewPage = isWorldId40Enabled(worldId40Config, teamId);

  return useNewPage ? <NewClientPage /> : <ClientPage />;
};
