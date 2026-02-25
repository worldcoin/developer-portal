"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { isWorldId40Enabled, worldId40Atom } from "@/lib/feature-flags";
import { urls } from "@/lib/urls";
import { useAtomValue } from "jotai";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { EnableWorldId40Content } from "../EnableWorldId40Content";
import type { WorldId40Mode } from "../EnableWorldId40Content";

export const EnableWorldId40Page = () => {
  const { teamId, appId } = useParams() as {
    teamId: string;
    appId: string;
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const worldId40Config = useAtomValue(worldId40Atom);
  const isSelfManagedEnabled = isWorldId40Enabled(worldId40Config, teamId);
  const nextParamRaw = searchParams.get("next");
  const nextParam =
    nextParamRaw === "configuration" || nextParamRaw === "actions"
      ? nextParamRaw
      : null;

  const onContinue = useCallback(() => {
    if (!teamId || !appId) return;
    router.push(
      urls.configureSignerKey({
        team_id: teamId,
        app_id: appId,
        next: nextParam ?? "configuration",
      }),
    );
  }, [teamId, appId, nextParam, router]);

  const onContinueByMode = useCallback(
    (mode: WorldId40Mode) => {
      if (!teamId || !appId) return;

      if (mode === "self-managed") {
        router.push(
          urls.selfManagedRegistration({
            team_id: teamId,
            app_id: appId,
            next: nextParam ?? undefined,
          }),
        );
        return;
      }

      onContinue();
    },
    [teamId, appId, nextParam, onContinue, router],
  );

  return (
    <SizingWrapper gridClassName="grow flex justify-center pb-10 pt-10">
      <EnableWorldId40Content
        onContinue={onContinueByMode}
        isSelfManagedEnabled={isSelfManagedEnabled}
      />
    </SizingWrapper>
  );
};
