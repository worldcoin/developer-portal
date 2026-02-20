"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { getGraphQLErrorCode } from "@/lib/errors";
import { urls } from "@/lib/urls";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { useRegisterRpMutation } from "@/scenes/Portal/layout/CreateAppDialog/client/register-rp.generated";
import { SelfManagedTransactionInfoContent } from "../../SelfManagedTransactionInfo/SelfManagedTransactionInfoContent";

export const SelfManagedRegistrationPage = () => {
  const { teamId, appId } = useParams() as {
    teamId: string;
    appId: string;
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParamRaw = searchParams.get("next");
  const nextParam =
    nextParamRaw === "configuration" || nextParamRaw === "actions"
      ? nextParamRaw
      : null;

  const [registerRp, { loading }] = useRegisterRpMutation();

  const onBack = useCallback(() => {
    router.push(
      urls.enableWorldId40({
        team_id: teamId,
        app_id: appId,
        next: nextParam ?? undefined,
      }),
    );
  }, [teamId, appId, nextParam, router]);

  const onComplete = useCallback(async () => {
    try {
      const { data } = await registerRp({
        variables: {
          app_id: appId,
          mode: "self_managed",
          signer_address: null,
        },
        context: {
          fetchOptions: {
            timeout: 30000,
          },
        },
      });

      if (!data?.register_rp?.rp_id) {
        toast.error("Unable to complete registration.");
        return;
      }

      toast.success("App configured successfully");
      router.replace(urls.worldId40({ team_id: teamId, app_id: appId }));
      router.refresh();
    } catch (error) {
      const code = getGraphQLErrorCode(error);

      if (code === "already_registered") {
        // Idempotent for self-managed — treat as success
        toast.success("App configured successfully");
        router.replace(urls.worldId40({ team_id: teamId, app_id: appId }));
        router.refresh();
        return;
      }

      toast.error("Unable to complete registration. Please try again.");
    }
  }, [appId, teamId, registerRp, router]);

  return (
    <SizingWrapper gridClassName="grow flex justify-center pb-10 pt-10">
      <SelfManagedTransactionInfoContent
        appId={appId}
        onBack={onBack}
        onComplete={onComplete}
        completionLoading={loading}
      />
    </SizingWrapper>
  );
};
