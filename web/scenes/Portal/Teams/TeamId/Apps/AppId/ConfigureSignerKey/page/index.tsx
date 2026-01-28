"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ConfigureSignerKeyContent } from "../ConfigureSignerKeyContent";

export const ConfigureSignerKeyPage = () => {
  const { teamId, appId } = useParams() as {
    teamId: string;
    appId: string;
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") as
    | "configuration"
    | "actions"
    | null;

  const onBack = useCallback(() => {
    if (!teamId || !appId) return;
    router.push(
      urls.enableWorldId40({
        team_id: teamId,
        app_id: appId,
        next: nextParam ?? "configuration",
      }),
    );
  }, [teamId, appId, nextParam, router]);

  const onContinue = useCallback(() => {
    if (!teamId || !appId) return;
    const redirect =
      nextParam === "configuration"
        ? urls.configuration({ team_id: teamId, app_id: appId })
        : urls.actions({ team_id: teamId, app_id: appId });
    router.push(redirect);
  }, [teamId, appId, nextParam, router]);

  return (
    <SizingWrapper gridClassName="grow flex justify-center pb-10 pt-10">
      <ConfigureSignerKeyContent onBack={onBack} onContinue={onContinue} />
    </SizingWrapper>
  );
};
