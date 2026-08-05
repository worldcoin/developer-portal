"use client";

import {
  formDialogPrimaryActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import clsx from "clsx";
import { ReactNode, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { WorldId40OptionCard } from "../../EnableWorldId40/WorldId40OptionCard";

export type SignerKeySetup = "generate" | "existing";

type FormValues = {
  signer_key_setup: SignerKeySetup;
};

const GENERATE_BULLETS = [
  { text: "Quick setup", variant: "check" as const },
  { text: "No existing infrastructure needed", variant: "check" as const },
];

export type ConfigureSignerKeyContentProps = {
  onBack: () => void;
  onContinue: (setup: SignerKeySetup) => void;
  initialSetup?: SignerKeySetup;
  className?: string;
  description?: ReactNode;
  notice?: ReactNode;
};

export const ConfigureSignerKeyContent = ({
  onBack,
  onContinue,
  initialSetup = "generate",
  className,
  description,
  notice,
}: ConfigureSignerKeyContentProps) => {
  const [loading, startTransition] = useTransition();
  const defaultValues: FormValues = useMemo(
    () => ({ signer_key_setup: initialSetup }),
    [initialSetup],
  );

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    startTransition(() => onContinue(values.signer_key_setup));
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={clsx("grid w-full gap-y-6", className)}
    >
      <p className="font-world text-14 leading-[1.5] text-portal-muted">
        {description ?? (
          <>
            Your signer key is used to sign proof requests. Choose how you want
            to set up your key.
          </>
        )}
      </p>

      <div className="grid gap-y-3">
        <WorldId40OptionCard
          register={register("signer_key_setup")}
          option={{ value: "generate", label: "Generate new key" }}
          subtitle="We'll generate a secure key in your browser. You'll download the private key to use in your application."
          stampText="Recommended"
          bullets={GENERATE_BULLETS}
          testId="generate"
        />
        <WorldId40OptionCard
          register={register("signer_key_setup")}
          option={{ value: "existing", label: "Use Existing Key" }}
          subtitle="Provide a secp256k1 public key you control (e.g. Ethereum address)"
          bullets={[]}
          testId="existing"
        />
      </div>

      {notice}

      <div className="grid w-full gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          data-testid="button-configure-signer-key-back"
          className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          aria-label={loading ? "Loading signer key step" : undefined}
          data-testid="button-configure-signer-key-continue"
          className={`${formDialogPrimaryActionClassName} order-1 md:order-none`}
        >
          {loading ? (
            <SpinnerIcon className="size-5 animate-spin" />
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </form>
  );
};
