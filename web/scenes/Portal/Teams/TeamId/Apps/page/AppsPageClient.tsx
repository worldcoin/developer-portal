"use client";

import { isWorldId40Enabled, worldId40Atom } from "@/lib/feature-flags";
import { useAtom } from "jotai";
import { useMemo } from "react";
import { ClientPage } from "./ClientPage";
import { NewClientPage } from "./NewClientPage";

export const AppsPageClient = (props: { teamId: string }) => {
  const { teamId } = props;
  const [worldId40Config] = useAtom(worldId40Atom);

  const useNewPage = useMemo(
    () => isWorldId40Enabled(worldId40Config, teamId),
    [worldId40Config, teamId],
  );

  return useNewPage ? <NewClientPage /> : <ClientPage />;
};
