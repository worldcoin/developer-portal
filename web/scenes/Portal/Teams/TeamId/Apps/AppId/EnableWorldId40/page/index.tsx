"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { urls } from "@/lib/urls";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { EnableWorldId40Content } from "../EnableWorldId40Content";

export const EnableWorldId40Page = () => {
  const { teamId, appId } = useParams() as {
    teamId: string;
    appId: string;
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next") as "configuration" | "actions" | null;

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

  return (
    <SizingWrapper gridClassName="grow flex justify-center pb-10 pt-10">
      <EnableWorldId40Content onContinue={onContinue} />
    </SizingWrapper>
  );
};
