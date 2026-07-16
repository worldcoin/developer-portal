"use client";

import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Input } from "@/components/Input";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getGraphQLErrorCode } from "@/lib/errors";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { FetchAppsDocument } from "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  ConfigureSignerKeyContent,
  SignerKeySetup,
} from "../../Teams/TeamId/Apps/AppId/ConfigureSignerKey/ConfigureSignerKeyContent";
import { EnableWorldId40Content } from "../../Teams/TeamId/Apps/AppId/EnableWorldId40/EnableWorldId40Content";
import { SelfManagedTransactionInfoContent } from "../../Teams/TeamId/Apps/AppId/EnableWorldId40/SelfManagedTransactionInfo/SelfManagedTransactionInfoContent";
import { GenerateNewKeyContent } from "../../Teams/TeamId/Apps/AppId/GenerateNewKey/GenerateNewKeyContent";
import { UseExistingKeyContent } from "../../Teams/TeamId/Apps/AppId/UseExistingKey/UseExistingKeyContent";
import { useRegisterRpMutation } from "@/scenes/common/layout/CreateAppDialog/client/register-rp.generated";
import {
  createAppSchemaV4,
  CreateAppSchemaV4,
} from "@/scenes/common/layout/CreateAppDialog/form-schema-v4";
import { validateAndInsertAppServerSideV4 } from "@/scenes/common/layout/CreateAppDialog/server/v4/submit";

type CreateDialogStep =
  | "create"
  | "enable-world-id-4-0"
  | "configure-signer-key"
  | "use-existing-key"
  | "generate-new-key"
  | "self-managed-transaction";

const STEP_TITLES: Record<CreateDialogStep, string> = {
  create: "Create a new app",
  "enable-world-id-4-0": "Enable World ID",
  "configure-signer-key": "Enable World ID",
  "use-existing-key": "Enable World ID",
  "generate-new-key": "Enable World ID",
  "self-managed-transaction": "Enable World ID",
};

type CreateAppDialogV4Props = DialogProps & {
  /** Starting step - use "enable-world-id-4-0" for existing apps */
  initialStep?: CreateDialogStep;
  /** App ID for existing apps (required when initialStep is not "create") */
  appId?: string;
  onComplete?: () => void;
};

export const CreateAppDialogV4 = ({
  initialStep = "create",
  appId: existingAppId,
  onComplete,
  ...props
}: CreateAppDialogV4Props) => {
  const { teamId } = useParams() as { teamId: string | undefined };
  const router = useRouter();
  // Self-Managed availability previously read the World ID 4.0 rollout flag,
  // but that gate was already true wherever this dialog could actually render
  // (the dialog itself was flag-gated). With the flag removed (v4 is the
  // default), hardcoding true preserves the existing behavior — it is not a new
  // self-managed product change.
  const isSelfManagedEnabled = true;
  const { refetch: refetchApps } = useRefetchQueries(FetchAppsDocument, {
    teamId: teamId,
  });

  const [registerRp, { loading: registeringRp }] = useRegisterRpMutation();

  const [step, setStep] = useState<CreateDialogStep>(initialStep);
  const [createdAppId, setCreatedAppId] = useState<string | null>(
    existingAppId ?? null,
  );
  const [worldIdMode, setWorldIdMode] = useState<"managed" | "self-managed">(
    "managed",
  );
  const [signerKeySetup, setSignerKeySetup] =
    useState<SignerKeySetup>("generate");

  const defaultValues: Partial<CreateAppSchemaV4> = useMemo(
    () => ({
      build: "production",
      verification: "cloud",
      is_miniapp: false,
    }),
    [],
  );

  const {
    register,
    formState: { isValid, errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<CreateAppSchemaV4>({
    mode: "onChange",
    resolver: yupResolver(createAppSchemaV4),
    defaultValues,
  });

  const submit = useCallback(
    async (values: CreateAppSchemaV4) => {
      if (!teamId) {
        return toast.error("Failed to create app");
      }
      const result = await validateAndInsertAppServerSideV4(values, teamId);
      if (!result.success) {
        toast.error(result.message);
        posthog.capture("app_creation_failed", {
          team_id: teamId,
          environment: values.build,
          engine: values.verification,
          error: result?.error,
        });
        return;
      }
      // Navigate using the id the server action returns — NOT a guess derived
      // from refetchApps(). On staging the user-facing read can lag the insert
      // (replica/cache), so the refetch-and-sort approach returned a stale list
      // and left users stranded on a stale apps page with no redirect/refresh.
      const newAppId =
        typeof result.app_id === "string" ? result.app_id : undefined;

      // Keep the client-side app list (AppSelector) fresh, but do not gate
      // navigation on it.
      await refetchApps();

      posthog.capture("app_creation_successful", {
        team_id: teamId,
        app_id: newAppId,
        environment: values.build,
        engine: values.verification,
      });

      // App creation is decoupled from World ID 4.0 onboarding: send the user
      // straight to the new app's dashboard. World ID 4.0 setup is launched
      // later, on demand, from the World ID tab — not automatically here.
      reset(defaultValues);
      props.onClose(false);
      // Always navigate + refresh. Fall back to the apps index (which
      // server-redirects to an existing app) so the user is never stranded if
      // the id is somehow missing.
      if (newAppId) {
        window.location.replace(`/teams/${teamId}/apps/${newAppId}`);
      } else {
        window.location.replace(`/teams/${teamId}`);
      }
    },
    [defaultValues, refetchApps, reset, teamId, props],
  );

  const onClose = useCallback(() => {
    reset(defaultValues);
    setStep(initialStep);
    setCreatedAppId(existingAppId ?? null);
    setWorldIdMode("managed");
    setSignerKeySetup("generate");
    props.onClose(false);
  }, [defaultValues, props, reset, initialStep, existingAppId]);

  const completeRpSetup = useCallback(() => {
    onComplete?.();

    if (!existingAppId && teamId && createdAppId) {
      router.replace(`/teams/${teamId}/apps/${createdAppId}`);
    }

    router.refresh();

    onClose();
  }, [createdAppId, existingAppId, onClose, onComplete, router, teamId]);

  const onEnableContinue = useCallback(
    (mode: "managed" | "self-managed") => {
      setWorldIdMode(mode);

      if (mode === "self-managed") {
        setStep("self-managed-transaction");
        return;
      }

      setStep("configure-signer-key");
    },
    [setWorldIdMode, setStep],
  );

  const onSelfManagedComplete = useCallback(async () => {
    if (!teamId || !createdAppId) {
      toast.error("Unable to complete setup. Please close and try again.");
      return;
    }

    try {
      const { data } = await registerRp({
        variables: {
          app_id: createdAppId,
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
        toast.error("Failed to create registration record");
        return;
      }

      toast.success("App configured successfully");
      completeRpSetup();
    } catch (error) {
      const code = getGraphQLErrorCode(error);

      if (code === "already_registered") {
        // Idempotent — treat as success
        toast.success("App configured successfully");
        completeRpSetup();
        return;
      }

      toast.error("Failed to create registration record");
    }
  }, [teamId, createdAppId, registerRp, completeRpSetup]);

  const onConfigureBack = useCallback(() => {
    setStep("enable-world-id-4-0");
  }, [setStep]);

  const onConfigureContinue = useCallback((setup: SignerKeySetup) => {
    setSignerKeySetup(setup);
    if (setup === "existing") {
      setStep("use-existing-key");
    } else {
      setStep("generate-new-key");
    }
  }, []);

  const onSignerKeyBack = useCallback(() => {
    setStep("configure-signer-key");
  }, []);

  const onSignerKeyContinue = useCallback(
    async (publicKey: string) => {
      if (!teamId || !createdAppId) {
        toast.error(
          "Failed to complete app setup. Please close this dialog and try again from your team's apps page.",
        );
        return;
      }

      try {
        const hasuraMode =
          worldIdMode === "self-managed" ? "self_managed" : "managed";
        const { data } = await registerRp({
          variables: {
            app_id: createdAppId,
            mode: hasuraMode,
            signer_address: publicKey,
          },
        });

        if (!data?.register_rp) {
          toast.error("Failed to register Relying Party");
          return;
        }

        toast.success("App configured successfully");
        completeRpSetup();
      } catch (error) {
        toast.error("Failed to register Relying Party");
      }
    },
    [teamId, createdAppId, worldIdMode, registerRp, completeRpSetup],
  );

  return (
    <Dialog open={props.open} onClose={onClose} className="z-50">
      <DialogPanel
        className={clsx("fixed inset-0 overflow-y-scroll p-0", props.className)}
      >
        <header className="fixed z-10 max-h-[56px] w-full border-b border-grey-100 bg-white py-4">
          <SizingWrapper>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                {step === initialStep && (
                  <>
                    <Button type="button" onClick={onClose} className="flex">
                      <CloseIcon className="size-4" />
                    </Button>
                    <span className="text-grey-200">|</span>
                  </>
                )}
                <Typography variant={TYPOGRAPHY.M4}>
                  {STEP_TITLES[step]}
                </Typography>
              </div>
              <LoggedUserNav />
            </div>
          </SizingWrapper>
        </header>
        <div className="relative mt-10 grid w-full grid-rows-auto/1fr items-center pb-4">
          <SizingWrapper
            gridClassName="overflow-y-auto"
            className="flex items-start justify-center"
          >
            {step === "create" && (
              <form
                onSubmit={handleSubmit(submit)}
                className="grid w-full max-w-[580px] gap-y-6 justify-self-center py-10"
              >
                <Typography variant={TYPOGRAPHY.H6}>Setup your app</Typography>

                <div className="grid gap-y-8">
                  <Input
                    register={register("name")}
                    label="App name"
                    placeholder="Display name (ex. Voting app)"
                    required
                    errors={errors.name}
                    data-testid="input-app-name"
                  />
                </div>

                <DecoratedButton
                  type="submit"
                  variant="primary"
                  className="justify-self-end py-3"
                  disabled={!isValid || isSubmitting}
                  testId="create-app"
                >
                  Create app
                </DecoratedButton>
              </form>
            )}
            {step === "enable-world-id-4-0" && (
              <EnableWorldId40Content
                onContinue={onEnableContinue}
                isSelfManagedEnabled={isSelfManagedEnabled}
                initialMode={worldIdMode}
                className="justify-self-center py-10"
              />
            )}
            {step === "self-managed-transaction" && (
              <>
                {!createdAppId ? (
                  <div className="flex items-center justify-center py-10">
                    <Typography variant={TYPOGRAPHY.R3}>Loading...</Typography>
                  </div>
                ) : (
                  <SelfManagedTransactionInfoContent
                    appId={createdAppId}
                    title="Self-Managed"
                    onBack={() => setStep("enable-world-id-4-0")}
                    onComplete={onSelfManagedComplete}
                    completionLoading={registeringRp}
                    className="justify-self-center py-10"
                  />
                )}
              </>
            )}
            {step === "configure-signer-key" && (
              <ConfigureSignerKeyContent
                onBack={onConfigureBack}
                onContinue={onConfigureContinue}
                initialSetup={signerKeySetup}
                className="justify-self-center py-10"
              />
            )}
            {step === "use-existing-key" && (
              <UseExistingKeyContent
                onBack={onSignerKeyBack}
                onContinue={onSignerKeyContinue}
                className="justify-self-center py-10"
                loading={registeringRp}
              />
            )}
            {step === "generate-new-key" && (
              <GenerateNewKeyContent
                onBack={onSignerKeyBack}
                onContinue={onSignerKeyContinue}
                className="justify-self-center py-10"
                loading={registeringRp}
              />
            )}
          </SizingWrapper>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
