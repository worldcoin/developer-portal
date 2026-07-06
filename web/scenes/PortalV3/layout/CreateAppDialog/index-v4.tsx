"use client";

import { Button } from "@/components/Button";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { Input } from "@/components/Input";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { Notification } from "@/components/Notification";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getGraphQLErrorCode } from "@/lib/errors";
import { useRefetchQueries } from "@/lib/use-refetch-queries";
import { FetchAppsDocument } from "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { Wallet } from "ethers";
import { useParams, useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useRegisterRpMutation } from "@/scenes/common/layout/CreateAppDialog/client/register-rp.generated";
import {
  createAppSchemaV4,
  CreateAppSchemaV4,
} from "@/scenes/common/layout/CreateAppDialog/form-schema-v4";
import { validateAndInsertAppServerSideV4 } from "@/scenes/common/layout/CreateAppDialog/server/v4/submit";

type CreateDialogStep =
  | "create"
  | "registering"
  | "key-ready"
  | "register-failed";

const STEP_TITLES: Record<CreateDialogStep, string> = {
  create: "Create a new app",
  registering: "Setting up World ID",
  "key-ready": "Save your signing key",
  "register-failed": "Finish setting up World ID",
};

// Dialog is create-only in v3: existing-app RP recovery is owned by the
// dashboard setup strip, and self-managed/custom-key flows live on the
// Advanced page. There is no non-create entry mode.
type CreateAppDialogV4Props = DialogProps;

export const CreateAppDialogV4 = (props: CreateAppDialogV4Props) => {
  const { teamId } = useParams() as { teamId: string | undefined };
  const router = useRouter();
  const { refetch: refetchApps } = useRefetchQueries(FetchAppsDocument, {
    teamId: teamId,
  });

  const [registerRp] = useRegisterRpMutation();

  const [step, setStep] = useState<CreateDialogStep>("create");
  const [createdAppId, setCreatedAppId] = useState<string | null>(null);
  // Kept only in memory, shown once on the key-ready step. Never logged,
  // never sent to posthog — only the derived address leaves the client.
  const [signerKey, setSignerKey] = useState<{
    address: string;
    privateKey: string;
  } | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

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

  // Generates a fresh managed signer key and registers the RP for the app.
  // Runs automatically after create, and again from "Retry registration".
  const runRegistration = useCallback(
    async (appId: string) => {
      setRegisterError(null);
      setStep("registering");

      const wallet = Wallet.createRandom();
      setSignerKey({ address: wallet.address, privateKey: wallet.privateKey });

      try {
        const { data } = await registerRp({
          variables: {
            app_id: appId,
            mode: "managed",
            signer_address: wallet.address,
          },
        });

        if (!data?.register_rp?.rp_id) {
          posthog.capture("v3_auto_rp_failed", {
            app_id: appId,
            detail: "register_rp returned no rp_id",
          });
          setRegisterError("Registration did not return a confirmation.");
          setStep("register-failed");
          return;
        }

        posthog.capture("v3_auto_rp_registered", { app_id: appId });
        setStep("key-ready");
      } catch (error) {
        const code = getGraphQLErrorCode(error);

        if (code === "already_registered") {
          // Idempotent — treat as success (same precedent as the v2 dialog).
          posthog.capture("v3_auto_rp_registered", { app_id: appId });
          setStep("key-ready");
          return;
        }

        const detail =
          error instanceof Error ? error.message : "Registration failed";
        posthog.capture("v3_auto_rp_failed", { app_id: appId, detail });
        setRegisterError(detail);
        setStep("register-failed");
      }
    },
    [registerRp],
  );

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
      // Use the id the server action returns — NOT a guess derived from
      // refetchApps(). On staging the user-facing read can lag the insert
      // (replica/cache), so a refetch-and-sort approach returned a stale list.
      const newAppId =
        typeof result.app_id === "string" ? result.app_id : undefined;

      // Keep the client-side app list (AppSelector) fresh, but do not gate
      // the flow on it.
      await refetchApps();

      posthog.capture("app_creation_successful", {
        team_id: teamId,
        app_id: newAppId,
        environment: values.build,
        engine: values.verification,
      });

      if (!newAppId) {
        // Degenerate: insert succeeded but no id came back — we can neither
        // register the RP nor open the app page. Fall back to the apps index
        // (which server-redirects to an existing app); the dashboard setup
        // strip owns RP recovery from there.
        posthog.capture("v3_auto_rp_failed", {
          team_id: teamId,
          detail: "app_id missing from insert result",
        });
        reset(defaultValues);
        props.onClose(false);
        window.location.replace(`/teams/${teamId}`);
        return;
      }

      // Do not navigate yet: register the RP invisibly, then gate navigation
      // behind the explicit "I saved my key" confirmation.
      setCreatedAppId(newAppId);
      await runRegistration(newAppId);
    },
    [defaultValues, refetchApps, reset, teamId, props, runRegistration],
  );

  const onClose = useCallback(() => {
    reset(defaultValues);
    setStep("create");
    setCreatedAppId(null);
    setSignerKey(null);
    setRegisterError(null);
    props.onClose(false);
  }, [defaultValues, props, reset]);

  // Single exit for key-ready ("I saved my key") and register-failed
  // ("Continue without setup"): the app page owns everything from here.
  const goToApp = useCallback(() => {
    if (!teamId || !createdAppId) {
      toast.error(
        "Failed to open the app. Please navigate from your team's apps page.",
      );
      return;
    }
    router.replace(`/teams/${teamId}/apps/${createdAppId}`);
    router.refresh();
    props.onClose(false);
  }, [teamId, createdAppId, router, props]);

  const handleDownloadKey = useCallback(() => {
    if (!signerKey) {
      return;
    }
    const keyData = {
      privateKey: signerKey.privateKey,
      publicKey: signerKey.address,
      warning:
        "IMPORTANT: Keep this private key secure. Never share it or commit it to version control.",
    };

    const jsonString = JSON.stringify(keyData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(jsonString);
    const link = document.createElement("a");
    link.href = dataUri;
    link.download = `signing-key-${signerKey.address.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [signerKey]);

  return (
    <Dialog open={props.open} onClose={onClose} className="z-50 ">
      <DialogPanel
        className={clsx("fixed inset-0 overflow-y-scroll p-0", props.className)}
      >
        <header className="fixed z-10 max-h-[56px] w-full border-b border-grey-100 bg-white py-4">
          <SizingWrapper>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                {step === "create" && (
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
            {step === "registering" && (
              <div className="flex flex-col items-center justify-center gap-y-4 py-20">
                <SpinnerIcon className="size-8 animate-spin text-grey-500" />
                <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                  Setting up World ID…
                </Typography>
              </div>
            )}
            {step === "key-ready" && signerKey && (
              <div className="grid w-full max-w-[580px] gap-y-8 justify-self-center py-10">
                <div className="grid gap-y-3">
                  <Typography variant={TYPOGRAPHY.H6}>
                    Save your signing key
                  </Typography>
                  <Typography
                    as="p"
                    variant={TYPOGRAPHY.R3}
                    className="text-grey-500"
                  >
                    Your app is registered for World ID. This private key signs
                    operations for your app — save it securely before
                    continuing.
                  </Typography>
                </div>

                <div className="flex items-center justify-between gap-x-2 rounded-lg border border-grey-200 bg-grey-50 p-4">
                  <p
                    className="break-all font-mono text-sm text-grey-900"
                    data-testid="private-key-value"
                  >
                    {signerKey.privateKey}
                  </p>
                  <CopyButton
                    fieldName="Private key"
                    fieldValue={signerKey.privateKey}
                  />
                </div>

                <Typography
                  as="button"
                  type="button"
                  onClick={handleDownloadKey}
                  variant={TYPOGRAPHY.R3}
                  className="text-left text-blue-600 underline hover:opacity-70"
                >
                  Download Key File (.json)
                </Typography>

                <Notification variant="warning">
                  <div className="max-w-[65ch] text-system-warning-800">
                    <Typography as="p" variant={TYPOGRAPHY.S3}>
                      Important
                    </Typography>
                    <Typography
                      as="ul"
                      variant={TYPOGRAPHY.S4}
                      className="grid"
                    >
                      <li className="pl-4 indent-[-1rem]">
                        • This key will not be shown again — save it now
                      </li>
                      <li className="pl-4 indent-[-1rem]">
                        • Never share your private key or commit it to version
                        control
                      </li>
                      <li className="pl-4 indent-[-1rem]">
                        • Use environment variables to store the key in your
                        application
                      </li>
                    </Typography>
                  </div>
                </Notification>

                <DecoratedButton
                  type="button"
                  variant="primary"
                  className="justify-self-end py-3"
                  onClick={goToApp}
                  testId="key-saved-continue"
                >
                  I saved my key — go to my app
                </DecoratedButton>
              </div>
            )}
            {step === "register-failed" && (
              <div className="grid w-full max-w-[580px] gap-y-6 justify-self-center py-10">
                <div className="grid gap-y-3">
                  <Typography variant={TYPOGRAPHY.H6}>
                    {"World ID setup didn't finish"}
                  </Typography>
                  <Typography
                    as="p"
                    variant={TYPOGRAPHY.R3}
                    className="text-grey-500"
                  >
                    Your app was created, but World ID registration failed. You
                    can retry now, or finish setup later from your app.
                  </Typography>
                </div>

                {registerError && (
                  <Notification variant="warning">
                    <Typography
                      as="p"
                      variant={TYPOGRAPHY.R4}
                      className="max-w-[65ch] break-words text-system-warning-800"
                    >
                      {registerError}
                    </Typography>
                  </Notification>
                )}

                <div className="flex justify-end gap-x-4">
                  <DecoratedButton
                    type="button"
                    variant="secondary"
                    className="py-3"
                    onClick={goToApp}
                    testId="continue-without-setup"
                  >
                    Continue without setup
                  </DecoratedButton>
                  <DecoratedButton
                    type="button"
                    variant="primary"
                    className="py-3"
                    onClick={() =>
                      createdAppId && runRegistration(createdAppId)
                    }
                    testId="retry-registration"
                  >
                    Retry registration
                  </DecoratedButton>
                </div>
              </div>
            )}
          </SizingWrapper>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
