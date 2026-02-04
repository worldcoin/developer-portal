"use client";

import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { LoggedUserNav } from "@/components/LoggedUserNav";
import { Notification } from "@/components/Notification";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { SignerKeySetup } from "../../ConfigureSignerKey/ConfigureSignerKeyContent";
import { GenerateNewKeyContent } from "../../GenerateNewKey/GenerateNewKeyContent";
import { UseExistingKeyContent } from "../../UseExistingKey/UseExistingKeyContent";
import { useRotateSignerKeyMutation } from "./graphql/client/rotate-signer-key.generated";

type RotateStep = "configure" | "generate-new" | "use-existing";

const STEP_TITLES: Record<RotateStep, string> = {
  configure: "Rotate signer key",
  "generate-new": "Rotate signer key",
  "use-existing": "Rotate signer key",
};

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

  const [rotateSignerKey, { loading }] = useRotateSignerKeyMutation();

  const handleClose = useCallback(() => {
    setStep("configure");
    setSignerKeySetup("generate");
    onClose();
  }, [onClose]);

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
    <Dialog open={open} onClose={handleClose} className="z-50">
      <DialogPanel className="fixed inset-0 overflow-y-scroll p-0">
        <header className="fixed z-10 max-h-[56px] w-full border-b border-grey-100 bg-white py-4">
          <SizingWrapper>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-x-3">
                <Button type="button" onClick={handleClose} className="flex">
                  <CloseIcon className="size-4" />
                </Button>
                <span className="text-grey-200">|</span>
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
            {step === "configure" && (
              <div className="grid w-full max-w-[580px] gap-y-6 justify-self-center py-10">
                <div className="grid gap-y-3">
                  <Typography as="h1" variant={TYPOGRAPHY.H6}>
                    Rotate signer key
                  </Typography>
                </div>

                <RotateConfigureContent
                  onContinue={onConfigureContinue}
                  initialSetup={signerKeySetup}
                />
              </div>
            )}

            {step === "generate-new" && (
              <GenerateNewKeyContent
                onBack={onSignerKeyBack}
                onContinue={onSignerKeyContinue}
                className="justify-self-center py-10"
              />
            )}

            {step === "use-existing" && (
              <UseExistingKeyContent
                onBack={onSignerKeyBack}
                onContinue={onSignerKeyContinue}
                className="justify-self-center py-10"
                loading={loading}
              />
            )}
          </SizingWrapper>
        </div>
      </DialogPanel>
    </Dialog>
  );
};

// Simplified configure content with warning for rotation
type RotateConfigureContentProps = {
  onContinue: (setup: SignerKeySetup) => void;
  initialSetup?: SignerKeySetup;
};

const RotateConfigureContent = ({
  onContinue,
  initialSetup = "generate",
}: RotateConfigureContentProps) => {
  const [setup, setSetup] = useState<SignerKeySetup>(initialSetup);

  return (
    <div className="grid gap-y-6">
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setSetup("generate")}
          className={clsx(
            "rounded-xl border p-4 text-left transition-colors",
            setup === "generate"
              ? "border-grey-900 bg-grey-50"
              : "border-grey-200 hover:border-grey-300",
          )}
        >
          <div className="flex items-start justify-between">
            <Typography variant={TYPOGRAPHY.S2}>Generate New Key</Typography>
            <div
              className={clsx(
                "flex size-5 items-center justify-center rounded-full border-2",
                setup === "generate"
                  ? "border-grey-900 bg-grey-900"
                  : "border-grey-300",
              )}
            >
              {setup === "generate" && (
                <svg
                  className="size-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 12 12"
                >
                  <path d="M10.28 2.28L4.5 8.06 1.72 5.28a.75.75 0 00-1.06 1.06l3.5 3.5a.75.75 0 001.06 0l6.5-6.5a.75.75 0 00-1.06-1.06z" />
                </svg>
              )}
            </div>
          </div>
          <Typography variant={TYPOGRAPHY.B3} className="mt-1 text-grey-500">
            Generate a new key in your browser and download it.
          </Typography>
        </button>

        <button
          type="button"
          onClick={() => setSetup("existing")}
          className={clsx(
            "rounded-xl border p-4 text-left transition-colors",
            setup === "existing"
              ? "border-grey-900 bg-grey-50"
              : "border-grey-200 hover:border-grey-300",
          )}
        >
          <div className="flex items-start justify-between">
            <Typography variant={TYPOGRAPHY.S2}>Use Existing Key</Typography>
            <div
              className={clsx(
                "flex size-5 items-center justify-center rounded-full border-2",
                setup === "existing"
                  ? "border-grey-900 bg-grey-900"
                  : "border-grey-300",
              )}
            >
              {setup === "existing" && (
                <svg
                  className="size-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 12 12"
                >
                  <path d="M10.28 2.28L4.5 8.06 1.72 5.28a.75.75 0 00-1.06 1.06l3.5 3.5a.75.75 0 001.06 0l6.5-6.5a.75.75 0 00-1.06-1.06z" />
                </svg>
              )}
            </div>
          </div>
          <Typography variant={TYPOGRAPHY.B3} className="mt-1 text-grey-500">
            Provide the address of a key you already control.
          </Typography>
        </button>
      </div>

      <Notification variant="warning">
        <div className="text-system-warning-800">
          <Typography as="p" variant={TYPOGRAPHY.S3}>
            After rotation:
          </Typography>
          <Typography as="ul" variant={TYPOGRAPHY.S4} className="mt-0.5">
            <li>• The old signer key will stop working immediately</li>
            <li>• Update your application before rotating</li>
          </Typography>
        </div>
      </Notification>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onContinue(setup)}
          className="rounded-full bg-grey-900 px-6 py-3 text-white hover:opacity-90"
        >
          <Typography variant={TYPOGRAPHY.M4}>Continue</Typography>
        </button>
      </div>
    </div>
  );
};
