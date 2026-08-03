"use client";

import { FormDialog } from "@/components/FormDialog";
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

type RegisterRpDialogStep =
  | "configure-signer-key"
  | "use-existing-key"
  | "generate-new-key";

const STEP_TITLES: Record<RegisterRpDialogStep, string> = {
  "configure-signer-key": "Configure signer key",
  "use-existing-key": "Use existing key",
  "generate-new-key": "Generate new key",
};

type RegisterRpDialogProps = {
  open: boolean;
  onClose: (value: boolean) => void;
  appId: string;
  onComplete?: () => void;
};

export const RegisterRpDialog = ({
  appId,
  onComplete,
  open,
  onClose: onCloseDialog,
}: RegisterRpDialogProps) => {
  const { teamId } = useParams() as { teamId: string | undefined };
  const router = useRouter();

  const [registerRp, { loading: registeringRp }] =
    useMutation(RegisterRpDocument);

  const [step, setStep] = useState<RegisterRpDialogStep>(
    "configure-signer-key",
  );
  const [signerKeySetup, setSignerKeySetup] =
    useState<SignerKeySetup>("generate");

  const onClose = useCallback(() => {
    onCloseDialog(false);
  }, [onCloseDialog]);

  // Reset only after the leave transition: the dialog keeps rendering while it
  // fades out, so resetting in onClose would snap the content back to step one
  // mid-fade.
  const afterLeave = useCallback(() => {
    setStep("configure-signer-key");
    setSignerKeySetup("generate");
  }, []);

  const completeRpSetup = useCallback(() => {
    onComplete?.();
    router.refresh();
    onClose();
  }, [onClose, onComplete, router]);

  const onConfigureBack = useCallback(() => {
    onClose();
  }, [onClose]);

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
        const { data } = await registerRp({
          variables: {
            app_id: appId,
            mode: "managed",
            signer_address: publicKey,
          },
        });

        if (!data?.register_rp) {
          toast.error("Failed to register Relying Party");
          return;
        }

        toast.success("App configured successfully");
        completeRpSetup();
      } catch {
        toast.error("Failed to register Relying Party");
      }
    },
    [teamId, registerRp, appId, completeRpSetup],
  );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      afterLeave={afterLeave}
      dismissable={!registeringRp}
      // This dialog lazy-mounts already open behind a loading overlay that
      // mimics the backdrop; animating the first mount would un-dim the page
      // between the overlay unmounting and the fade-in.
      appear={false}
      title={STEP_TITLES[step]}
      closeLabel="Close RP registration dialog"
    >
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
