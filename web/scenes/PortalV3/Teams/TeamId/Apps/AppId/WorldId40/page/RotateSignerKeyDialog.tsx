"use client";

import { FormDialog } from "@/components/FormDialog";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import {
  ConfigureSignerKeyContent,
  SignerKeySetup,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/ConfigureSignerKey/ConfigureSignerKeyContent";
import { GenerateNewKeyContent } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/GenerateNewKey/GenerateNewKeyContent";
import { UseExistingKeyContent } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/UseExistingKey/UseExistingKeyContent";
import { useMutation } from "@apollo/client/react";
import { RotateSignerKeyDocument } from "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId40/page/graphql/client/rotate-signer-key.generated";

type RotateStep = "configure" | "generate-new" | "use-existing";

type RotateSignerKeyDialogProps = {
  open: boolean;
  onClose: () => void;
  appId: string;
  onSuccess?: () => void;
};

export const RotateSignerKeyDialog = ({
  open,
  onClose,
  appId,
  onSuccess,
}: RotateSignerKeyDialogProps) => {
  const [step, setStep] = useState<RotateStep>("configure");
  const [signerKeySetup, setSignerKeySetup] =
    useState<SignerKeySetup>("generate");

  const [rotateSignerKey, { loading }] = useMutation(RotateSignerKeyDocument);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const afterLeave = useCallback(() => {
    setStep("configure");
    setSignerKeySetup("generate");
  }, []);

  const onConfigureContinue = useCallback((setup: SignerKeySetup) => {
    setSignerKeySetup(setup);
    if (setup === "existing") {
      setStep("use-existing");
    } else {
      setStep("generate-new");
    }
  }, []);

  const onSignerKeyBack = useCallback(() => {
    setStep("configure");
  }, []);

  const onSignerKeyContinue = useCallback(
    async (publicKey: string) => {
      try {
        const { data } = await rotateSignerKey({
          variables: {
            app_id: appId,
            new_signer_address: publicKey,
          },
        });

        if (!data?.rotate_signer_key) {
          toast.error("Failed to rotate signer key");
          return;
        }

        toast.success("Signer key rotation initiated");
        onSuccess?.();
        handleClose();
      } catch (error) {
        console.error("[onSignerKeyContinue] Error:", error);
        toast.error("Failed to rotate signer key");
      }
    },
    [appId, rotateSignerKey, onSuccess, handleClose],
  );

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      afterLeave={afterLeave}
      dismissable={!loading}
      title="Rotate signer key"
      closeLabel="Close rotate signer key dialog"
    >
      {step === "configure" && (
        <ConfigureSignerKeyContent
          onBack={handleClose}
          onContinue={onConfigureContinue}
          initialSetup={signerKeySetup}
          description="Choose how you want to configure your new signer key."
          notice={
            <Notification variant="warning">
              <div className="text-system-warning-800">
                <Typography as="p" variant={TYPOGRAPHY.S3}>
                  After rotation:
                </Typography>
                <Typography as="ul" variant={TYPOGRAPHY.S4} className="mt-0.5">
                  <li>• The old signer key will stop working immediately</li>
                  <li>• Update your application before rotating</li>
                  <li>
                    • It may take up to 10 minutes for the change to propagate
                    fully
                  </li>
                </Typography>
              </div>
            </Notification>
          }
        />
      )}

      {step === "generate-new" && (
        <GenerateNewKeyContent
          onBack={onSignerKeyBack}
          onContinue={onSignerKeyContinue}
          loading={loading}
          loadingLabel="Rotating…"
          hideTitle
        />
      )}

      {step === "use-existing" && (
        <UseExistingKeyContent
          onBack={onSignerKeyBack}
          onContinue={onSignerKeyContinue}
          loading={loading}
          loadingLabel="Rotating…"
          hideTitle
        />
      )}
    </FormDialog>
  );
};
