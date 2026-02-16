"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getGraphQLErrorCode } from "@/lib/errors";
import { urls } from "@/lib/urls";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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

  const [rpId, setRpId] = useState<string | null>(null);
  const [registrationAttempted, setRegistrationAttempted] = useState(false);
  const [registerRp, { loading }] = useRegisterRpMutation();

  useEffect(() => {
    let isMounted = true;

    if (registrationAttempted || rpId || !appId || !teamId) {
      return;
    }

    setRegistrationAttempted(true);

    const register = async () => {
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

        if (!isMounted) return;

        if (!data?.register_rp?.rp_id) {
          toast.error("Failed to create registration record");
          router.push(
            urls.enableWorldId40({
              team_id: teamId,
              app_id: appId,
              next: nextParam ?? undefined,
            }),
          );
          return;
        }

        setRpId(data.register_rp.rp_id);
      } catch (error) {
        if (!isMounted) return;

        const code = getGraphQLErrorCode(error);

        if (code === "already_registered") {
          toast.info("Registration already exists for this app");
          router.push(urls.worldId40({ team_id: teamId, app_id: appId }));
          return;
        }

        toast.error("Failed to create registration record");
        router.push(
          urls.enableWorldId40({
            team_id: teamId,
            app_id: appId,
            next: nextParam ?? undefined,
          }),
        );
      }
    };

    register();

    return () => {
      isMounted = false;
    };
  }, [
    appId,
    nextParam,
    registerRp,
    router,
    rpId,
    teamId,
    registrationAttempted,
  ]);

  const onBack = useCallback(() => {
    router.push(
      urls.enableWorldId40({
        team_id: teamId,
        app_id: appId,
        next: nextParam ?? undefined,
      }),
    );
  }, [teamId, appId, nextParam, router]);

  const onComplete = useCallback(() => {
    router.replace(urls.worldId40({ team_id: teamId, app_id: appId }));
    router.refresh();
  }, [teamId, appId, router]);

  if (!rpId || loading) {
    return (
      <SizingWrapper gridClassName="grow flex justify-center items-center pb-10 pt-10">
        <Typography variant={TYPOGRAPHY.R3}>
          Creating registration...
        </Typography>
      </SizingWrapper>
    );
  }

  return (
    <SizingWrapper gridClassName="grow flex justify-center pb-10 pt-10">
      <SelfManagedTransactionInfoContent
        appId={appId}
        rpId={rpId}
        onBack={onBack}
        onComplete={onComplete}
      />
    </SizingWrapper>
  );
};
