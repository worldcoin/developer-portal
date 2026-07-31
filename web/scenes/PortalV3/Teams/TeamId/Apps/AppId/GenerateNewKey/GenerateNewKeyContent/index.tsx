"use client";

import { Checkbox } from "@/components/Checkbox";
import { CopyButton } from "@/components/CopyButton";
import {
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogPrimaryActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { EyeIcon } from "@/components/Icons/EyeIcon";
import { EyeSlashIcon } from "@/components/Icons/EyeSlashIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import clsx from "clsx";
import { Wallet } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type FormValues = {
  confirmed: boolean;
};

export type GenerateNewKeyContentProps = {
  onBack: () => void;
  onContinue: (publicKey: string) => void;
  className?: string;
  loading?: boolean;
  /** Skip the internal heading when a dialog header already carries it. */
  hideTitle?: boolean;
};

export const GenerateNewKeyContent = ({
  onBack,
  onContinue,
  className,
  loading,
  hideTitle,
}: GenerateNewKeyContentProps) => {
  const [privateKey, setPrivateKey] = useState<string>("");
  const [publicKey, setPublicKey] = useState<string>("");
  const [isBlurred, setIsBlurred] = useState<boolean>(true);

  const defaultValues: FormValues = useMemo(() => ({ confirmed: false }), []);

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues,
  });

  // Generate key on mount
  useEffect(() => {
    try {
      const wallet = Wallet.createRandom();
      setPrivateKey(wallet.privateKey);
      setPublicKey(wallet.address);
    } catch (error) {
      // Handle error gracefully without logging private key
      console.error("Failed to generate key");
    }
  }, []);

  const handleDownload = () => {
    const keyData = {
      privateKey,
      publicKey,
      warning:
        "IMPORTANT: Keep this private key secure. Never share it or commit it to version control.",
    };

    const jsonString = JSON.stringify(keyData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(jsonString);
    const link = document.createElement("a");
    link.href = dataUri;
    link.download = `signing-key-${publicKey.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSubmit = () => {
    onContinue(publicKey);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={clsx("grid w-full gap-y-6", className)}
    >
      {!hideTitle && (
        <h2 className="font-world text-15 leading-[1.2] font-medium text-portal-ink">
          Generate new key
        </h2>
      )}
      <p className="font-world text-14 leading-[1.5] text-portal-muted">
        We&apos;ve generated a secure signing key for your application. Save
        this key securely. You&apos;ll need it to sign operations in your app.
      </p>

      <div>
        <label
          htmlFor="generate-new-key-private-key"
          className={formDialogLabelClassName}
        >
          Private key
        </label>
        <div className="relative">
          <input
            id="generate-new-key-private-key"
            value={privateKey}
            readOnly
            disabled
            className={`${formDialogInputClassName} pr-20`}
            style={{
              filter: isBlurred ? "blur(4px)" : "none",
              transition: "filter 0.2s ease",
            }}
            data-testid="input-private-key"
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-x-1 pr-3">
            <button
              type="button"
              onClick={() => setIsBlurred(!isBlurred)}
              className="flex size-7 items-center justify-center rounded-8 text-portal-muted transition-colors hover:bg-portal-border hover:text-portal-text"
              aria-label={isBlurred ? "Show private key" : "Hide private key"}
            >
              {isBlurred ? (
                <EyeIcon className="size-5" />
              ) : (
                <EyeSlashIcon className="size-5" />
              )}
            </button>
            <CopyButton
              fieldName="Private key"
              fieldValue={privateKey}
              disabled={!privateKey}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownload}
        disabled={!privateKey}
        className="justify-self-start font-world text-13 font-medium text-portal-blue underline underline-offset-2 transition-colors hover:text-portal-ink disabled:cursor-not-allowed disabled:text-portal-faint"
      >
        Download key file (.json)
      </button>

      <div className="rounded-[10px] bg-system-warning-75 p-4">
        <p className="font-world text-13 leading-[1.4] font-medium text-system-warning-650">
          Important
        </p>
        <ul className="mt-1 grid gap-y-1 font-world text-13 leading-[1.4] font-[350] text-system-warning-650">
          <li className="pl-4 -indent-4">
            • Save this private key securely. It cannot be recovered if lost
          </li>
          <li className="pl-4 -indent-4">
            • Never share your private key or commit it to version control
          </li>
          <li className="pl-4 -indent-4">
            • Use environment variables to store the key in your application
          </li>
        </ul>
      </div>

      <label className="flex items-center gap-x-3">
        <Checkbox register={register("confirmed", { required: true })} />
        <span className="font-world text-13 leading-[1.4] text-portal-text select-none">
          I have saved my private key securely
        </span>
      </label>

      <div className="grid w-full gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          data-testid="button-generate-new-key-back"
          className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!isValid || loading}
          data-testid="button-generate-new-key-create"
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
