"use client";

import { FormDialog } from "@/components/FormDialog";
import { getGraphQLErrorCode } from "@/lib/errors";
import { RegisterRpDocument } from "@/scenes/common/layout/CreateAppDialog/client/register-rp.generated";
import { useMutation } from "@apollo/client/react";
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
  "enable-world-id-4-0": "Enable World ID",
  "configure-signer-key": "Configure signer key",
  "use-existing-key": "Use existing key",
  "generate-new-key": "Generate new key",
  "self-managed-transaction": "Self-managed registration",
};

type EnableWorldIdDialogProps = {
  open: boolean;
  onClose: (value: boolean) => void;
  appId: string;
  onComplete?: () => void;
};

export const EnableWorldIdDialog = ({
  appId,
  onComplete,
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
    props.onClose(false);
  }, [props]);

  // Reset only after the leave transition: the dialog keeps rendering while it
  // fades out, so resetting in onClose would snap the content back to step one
  // mid-fade.
  const afterLeave = useCallback(() => {
    setStep("enable-world-id-4-0");
    setWorldIdMode("managed");
    setSignerKeySetup("generate");
  }, []);

  const completeRpSetup = useCallback(() => {
    onComplete?.();
    router.refresh();
    onClose();
  }, [onClose, onComplete, router]);

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
  }, [teamId, registerRp, appId, completeRpSetup]);

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

        toast.success("App configured successfully");
        completeRpSetup();
      } catch (error) {
        toast.error("Failed to register Relying Party");
      }
    },
    [teamId, worldIdMode, registerRp, appId, completeRpSetup],
  );

  return (
    <FormDialog
      open={props.open}
      onClose={onClose}
      afterLeave={afterLeave}
      dismissable={!registeringRp}
      // This dialog lazy-mounts already open behind a loading overlay that
      // mimics the backdrop; animating the first mount would un-dim the page
      // between the overlay unmounting and the fade-in.
      appear={false}
      title={STEP_TITLES[step]}
      closeLabel="Close World ID setup dialog"
      // The self-managed step lists full contract addresses and a function
      // signature — widen the panel so they fit, and let the body scroll on
      // short viewports instead of clipping.
      panelClassName={
        step === "self-managed-transaction"
          ? "max-h-[calc(100dvh-2rem)] md:w-[544px] md:max-w-[calc(100vw-2rem)]"
          : undefined
      }
      bodyClassName={
        step === "self-managed-transaction"
          ? "min-h-0 overflow-y-auto"
          : undefined
      }
    >
      {step === "enable-world-id-4-0" && (
        <EnableWorldId40Content
          onContinue={onEnableContinue}
          onCancel={onClose}
          isSelfManagedEnabled={isSelfManagedEnabled}
          initialMode={worldIdMode}
        />
      )}
      {step === "self-managed-transaction" && (
        <SelfManagedTransactionInfoContent
          appId={appId}
          onBack={() => setStep("enable-world-id-4-0")}
          onComplete={onSelfManagedComplete}
          completionLoading={registeringRp}
        />
      )}
      {step === "configure-signer-key" && (
        <ConfigureSignerKeyContent
          onBack={onConfigureBack}
          onContinue={onConfigureContinue}
          initialSetup={signerKeySetup}
        />
      )}
      {step === "use-existing-key" && (
        <UseExistingKeyContent
          onBack={onSignerKeyBack}
          onContinue={onSignerKeyContinue}
          loading={registeringRp}
          hideTitle
        />
      )}
      {step === "generate-new-key" && (
        <GenerateNewKeyContent
          onBack={onSignerKeyBack}
          onContinue={onSignerKeyContinue}
          loading={registeringRp}
          hideTitle
        />
      )}
    </FormDialog>
  );
};
