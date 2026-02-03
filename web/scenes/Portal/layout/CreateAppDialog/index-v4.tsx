"use client";

import { Button } from "@/components/Button";
import { CategorySelector } from "@/components/Category";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { Input } from "@/components/Input";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { useParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import {
  ConfigureSignerKeyContent,
  SignerKeySetup,
} from "../../Teams/TeamId/Apps/AppId/ConfigureSignerKey/ConfigureSignerKeyContent";
import { EnableWorldId40Content } from "../../Teams/TeamId/Apps/AppId/EnableWorldId40/EnableWorldId40Content";
import { UseExistingKeyContent } from "../../Teams/TeamId/Apps/AppId/UseExistingKey/UseExistingKeyContent";
import { FetchAppsDocument } from "../AppSelector/graphql/client/fetch-apps.generated";
import { MiniappToggleSection } from "./MiniappToggleSection";
import { useRegisterRpMutation } from "./client/register-rp.generated";
import { createAppSchemaV4, CreateAppSchemaV4 } from "./form-schema-v4";
import { validateAndInsertAppServerSideV4 } from "./server/v4/submit";

type CreateDialogStep =
  | "create"
  | "enable-world-id-4-0"
  | "configure-signer-key"
  | "use-existing-key";

const STEP_TITLES: Record<CreateDialogStep, string> = {
  create: "Create a new app",
  "enable-world-id-4-0": "Enable World ID 4.0",
  "configure-signer-key": "Enable World ID 4.0",
  "use-existing-key": "Use Existing Key",
};

type CreateAppDialogV4Props = DialogProps & {
  /** Starting step - use "enable-world-id-4-0" for existing apps */
  initialStep?: CreateDialogStep;
  /** App ID for existing apps (required when initialStep is not "create") */
  appId?: string;
};

export const CreateAppDialogV4 = ({
  initialStep = "create",
  appId: existingAppId,
  ...props
}: CreateAppDialogV4Props) => {
  const { teamId } = useParams() as { teamId: string | undefined };
  const router = useRouter();
  const { refetch: refetchApps } = useRefetchQueries(FetchAppsDocument, {
    teamId: teamId,
  });

  const [registerRp, { loading: registeringRp }] = useRegisterRpMutation();

  const [step, setStep] = useState<CreateDialogStep>(initialStep);
  const [createdAppId, setCreatedAppId] = useState<string | null>(
    existingAppId ?? null,
  );
  const [nextDest, setNextDest] = useState<"configuration" | "actions" | null>(
    null,
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
    control,
    reset,
  } = useForm<CreateAppSchemaV4>({
    mode: "onChange",
    resolver: yupResolver(createAppSchemaV4),
    defaultValues,
  });

  const isMiniapp = useWatch({
    control: control,
    name: "is_miniapp",
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
      const [refetched] = await refetchApps();

      const latestApp = refetched.data.app.toSorted(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

      const next = values.is_miniapp ? "configuration" : "actions";

      posthog.capture("app_creation_successful", {
        team_id: teamId,
        app_id: latestApp?.id,
        environment: values.build,
        engine: values.verification,
      });

      setCreatedAppId(latestApp?.id ?? null);
      setNextDest(next);
      setStep("enable-world-id-4-0");
      reset(defaultValues);
    },
    [
      defaultValues,
      refetchApps,
      reset,
      teamId,
      setCreatedAppId,
      setNextDest,
      setStep,
    ],
  );

  const onClose = useCallback(() => {
    reset(defaultValues);
    setStep(initialStep);
    setCreatedAppId(existingAppId ?? null);
    setNextDest(null);
    props.onClose(false);
  }, [defaultValues, props, reset, initialStep, existingAppId]);

  const onEnableContinue = useCallback(
    (mode: "managed" | "self-managed") => {
      setWorldIdMode(mode);
      setStep("configure-signer-key");
    },
    [setStep],
  );

  const onConfigureBack = useCallback(() => {
    setStep("enable-world-id-4-0");
  }, [setStep]);

  const onConfigureContinue = useCallback(
    (setup: SignerKeySetup) => {
      setSignerKeySetup(setup);
      if (setup === "existing") {
        setStep("use-existing-key");
      } else {
        // Handle "generate" flow - for now, redirect to app page
        if (!teamId || !createdAppId) {
          toast.error(
            "Failed to complete app setup. Please close this dialog and try again from your team's apps page.",
          );
          return;
        }
        const redirect =
          nextDest === "configuration"
            ? urls.configuration({ team_id: teamId, app_id: createdAppId })
            : urls.actions({ team_id: teamId, app_id: createdAppId });
        router.push(redirect);
        onClose();
      }
    },
    [teamId, createdAppId, nextDest, router, onClose],
  );

  const onUseExistingKeyBack = useCallback(() => {
    setStep("configure-signer-key");
  }, []);

  const onUseExistingKeyContinue = useCallback(
    async (publicKey: string) => {
      if (!teamId || !createdAppId) {
        toast.error(
          "Failed to complete app setup. Please close this dialog and try again from your team's apps page.",
        );
        return;
      }

      try {
        const { data } = await registerRp({
          variables: {
            app_id: createdAppId,
            signer_address: publicKey,
          },
        });

        if (!data?.register_rp) {
          toast.error("Failed to register Relying Party");
          return;
        }

        // Success - redirect to app
        const redirect =
          nextDest === "configuration"
            ? urls.configuration({ team_id: teamId, app_id: createdAppId })
            : urls.actions({ team_id: teamId, app_id: createdAppId });

        toast.success("App configured successfully");
        router.push(redirect);
        onClose();
      } catch (error) {
        console.error("[onUseExistingKeyContinue] Error:", error);
        toast.error("Failed to register Relying Party");
      }
    },
    [teamId, createdAppId, nextDest, router, onClose, registerRp],
  );

  return (
    <Dialog open={props.open} onClose={onClose} className="z-50 ">
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
                  <Input
                    register={register("integration_url")}
                    label="App URL"
                    placeholder="URL where users can access your app (ex. https://example.com)"
                    errors={errors.integration_url}
                  />
                  <Controller
                    name="is_miniapp"
                    control={control}
                    render={({ field }) => (
                      <MiniappToggleSection
                        checked={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {isMiniapp && (
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => {
                        return (
                          <CategorySelector
                            value={field.value}
                            required
                            disabled={false}
                            onChange={field.onChange}
                            errors={errors.category}
                            label="Category"
                            data-testid="category-selector"
                          />
                        );
                      }}
                    />
                  )}
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
                className="justify-self-center py-10"
              />
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
                onBack={onUseExistingKeyBack}
                onContinue={onUseExistingKeyContinue}
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
