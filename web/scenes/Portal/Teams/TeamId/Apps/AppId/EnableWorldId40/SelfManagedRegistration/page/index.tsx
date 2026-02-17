"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
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
  const [registrationError, setRegistrationError] = useState<string | null>(
    null,
  );
  const [registerRp, { loading }] = useRegisterRpMutation();

  useEffect(() => {
    let isMounted = true;

    if (registrationAttempted || rpId || !appId || !teamId) {
      return;
    }

    setRegistrationError(null);
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
          setRegistrationError("Unable to create registration record.");
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

        setRegistrationError("Unable to create registration record.");
      }
    };

    register();

    return () => {
      isMounted = false;
    };
  }, [appId, registerRp, router, rpId, teamId, registrationAttempted]);

  const onRetry = useCallback(() => {
    setRegistrationError(null);
    setRegistrationAttempted(false);
  }, []);

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
    if (registrationError && !loading) {
      return (
        <SizingWrapper gridClassName="grow flex justify-center items-center pb-10 pt-10">
          <div className="grid w-full max-w-[580px] gap-y-6">
            <Typography variant={TYPOGRAPHY.H6}>
              Unable to create registration
            </Typography>
            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-system-error-500"
            >
              {registrationError}
            </Typography>
            <div className="flex justify-end gap-x-3">
              <DecoratedButton
                type="button"
                variant="secondary"
                onClick={onBack}
              >
                Back
              </DecoratedButton>
              <DecoratedButton
                type="button"
                variant="primary"
                onClick={onRetry}
              >
                Retry
              </DecoratedButton>
            </div>
          </div>
        </SizingWrapper>
      );
    }

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
