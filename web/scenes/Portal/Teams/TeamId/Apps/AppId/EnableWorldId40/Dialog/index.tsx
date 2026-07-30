"use client";

import { Button } from "@/components/Button";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { getGraphQLErrorCode } from "@/lib/errors";
import { RegisterRpDocument } from "@/scenes/common/layout/CreateAppDialog/client/register-rp.generated";
import { useMutation } from "@apollo/client/react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import {
  ConfigureSignerKeyContent,
  SignerKeySetup,
} from "../../ConfigureSignerKey/ConfigureSignerKeyContent";
import { EnableWorldId40Content } from "../EnableWorldId40Content";
import { SelfManagedTransactionInfoContent } from "../SelfManagedTransactionInfo/SelfManagedTransactionInfoContent";

const GenerateNewKeyContent = dynamic(() =>
  import("../../GenerateNewKey/GenerateNewKeyContent").then(
    (module) => module.GenerateNewKeyContent,
  ),
);

const UseExistingKeyContent = dynamic(() =>
  import("../../UseExistingKey/UseExistingKeyContent").then(
    (module) => module.UseExistingKeyContent,
  ),
);

type EnableWorldIdDialogStep =
  | "enable-world-id-4-0"
  | "configure-signer-key"
  | "use-existing-key"
  | "generate-new-key"
  | "self-managed-transaction";

const STEP_TITLES: Record<EnableWorldIdDialogStep, string> = {
  "enable-world-id-4-0": "Enable World ID 4.0",
  "configure-signer-key": "Enable World ID 4.0",
  "use-existing-key": "Enable World ID 4.0",
  "generate-new-key": "Enable World ID 4.0",
  "self-managed-transaction": "Enable World ID 4.0",
};

type EnableWorldIdDialogProps = DialogProps & {
  appId: string;
};

export const EnableWorldIdDialog = ({
  appId,
  ...props
}: EnableWorldIdDialogProps) => {
  const { teamId } = useParams() as { teamId: string | undefined };
  const router = useRouter();
  // Self-Managed availability previously read the World ID 4.0 rollout flag,
  // but that gate was already true wherever this dialog could actually render
  // (the dialog itself was flag-gated). With the flag removed (v4 is the
  // default), hardcoding true preserves the existing behavior — it is not a new
  // self-managed product change.
  const isSelfManagedEnabled = true;

  const [registerRp, { loading: registeringRp }] =
    useMutation(RegisterRpDocument);

  const [step, setStep] = useState<EnableWorldIdDialogStep>(
    "enable-world-id-4-0",
  );
  const [worldIdMode, setWorldIdMode] = useState<"managed" | "self-managed">(
    "managed",
  );
  const [signerKeySetup, setSignerKeySetup] =
    useState<SignerKeySetup>("generate");

  const onClose = useCallback(() => {
    setStep("enable-world-id-4-0");
    setWorldIdMode("managed");
    setSignerKeySetup("generate");
    props.onClose(false);
  }, [props]);

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
    if (!teamId) {
      toast.error("Unable to complete setup. Please close and try again.");
      return;
    }

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
        toast.error("Failed to create registration record");
        return;
      }

      toast.success("App configured successfully");
      const redirect = `/teams/${teamId}/apps/${appId}`;
      router.replace(redirect);
      router.refresh();
      onClose();
    } catch (error) {
      const code = getGraphQLErrorCode(error);

      if (code === "already_registered") {
        // Idempotent — treat as success
        toast.success("App configured successfully");
        const redirect = `/teams/${teamId}/apps/${appId}`;
        router.replace(redirect);
        router.refresh();
        onClose();
        return;
      }

      toast.error("Failed to create registration record");
    }
  }, [teamId, registerRp, appId, router, onClose]);

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
      if (!teamId) {
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
            app_id: appId,
            mode: hasuraMode,
            signer_address: publicKey,
          },
        });

        if (!data?.register_rp) {
          toast.error("Failed to register Relying Party");
          return;
        }

        // Success - redirect to app dashboard
        const redirect = `/teams/${teamId}/apps/${appId}`;

        toast.success("App configured successfully");
        // Refresh server components to pick up the new rp_registration row
        router.replace(redirect);
        router.refresh();
        onClose();
      } catch (error) {
        toast.error("Failed to register Relying Party");
      }
    },
    [teamId, worldIdMode, router, onClose, registerRp, appId],
  );

  return (
    <Dialog open={props.open} onClose={onClose} className="z-50">
      <DialogPanel
        className={clsx("fixed inset-0 overflow-y-scroll p-0", props.className)}
      >
        <header className="fixed z-10 max-h-[56px] w-full border-b border-grey-100 bg-grey-0 py-4">
          <SizingWrapper>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                {step === "enable-world-id-4-0" && (
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
            {step === "enable-world-id-4-0" && (
              <EnableWorldId40Content
                onContinue={onEnableContinue}
                isSelfManagedEnabled={isSelfManagedEnabled}
                initialMode={worldIdMode}
                className="justify-self-center py-10"
              />
            )}
            {step === "self-managed-transaction" && (
              <SelfManagedTransactionInfoContent
                appId={appId}
                title="Self-Managed"
                onBack={() => setStep("enable-world-id-4-0")}
                onComplete={onSelfManagedComplete}
                completionLoading={registeringRp}
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
