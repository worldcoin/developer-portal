"use client";

import { Checkbox } from "@/components/Checkbox";
import { CopyButton } from "@/components/CopyButton";
import { DecoratedButton } from "@/components/DecoratedButton";
import { EyeIcon } from "@/components/Icons/EyeIcon";
import { EyeSlashIcon } from "@/components/Icons/EyeSlashIcon";
import { Input } from "@/components/Input";
import { Notification } from "@/components/Notification";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
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
};

export const GenerateNewKeyContent = ({
  onBack,
  onContinue,
  className,
}: GenerateNewKeyContentProps) => {
  const [privateKey, setPrivateKey] = useState<string>("");
  const [publicKey, setPublicKey] = useState<string>("");
  const [isBlurred, setIsBlurred] = useState<boolean>(true);

  const defaultValues: FormValues = useMemo(() => ({ confirmed: false }), []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues,
  });

  const confirmed = watch("confirmed");

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

    const blob = new Blob([JSON.stringify(keyData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `signing-key-${publicKey.slice(0, 8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onSubmit = () => {
    onContinue(publicKey);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={clsx("grid w-full max-w-[580px] gap-y-6", className)}
    >
      <div className="grid gap-y-3">
        <Typography as="h1" variant={TYPOGRAPHY.H6}>
          Generate new key
        </Typography>
        <Typography as="p" variant={TYPOGRAPHY.R3} className="text-grey-500">
          We&apos;ve generated a secure signing key for your application. Save
          this key securely - you&apos;ll need it to sign operations in your
          app.
        </Typography>
      </div>

      <Input
        label="Private Key"
        value={privateKey}
        readOnly
        disabled
        addOnRight={
          <div className="flex items-center gap-x-2">
            <button
              type="button"
              onClick={() => setIsBlurred(!isBlurred)}
              className="flex items-center justify-center p-1 hover:opacity-70"
              aria-label={isBlurred ? "Show private key" : "Hide private key"}
            >
              {isBlurred ? (
                <EyeSlashIcon className="size-5 text-grey-900" />
              ) : (
                <EyeIcon className="size-5 text-grey-900" />
              )}
            </button>
            <CopyButton
              fieldName="Private key"
              fieldValue={privateKey}
              disabled={!privateKey}
            />
          </div>
        }
        style={{
          filter: isBlurred ? "blur(4px)" : "none",
          transition: "filter 0.2s ease",
        }}
        data-testid="input-private-key"
      />

      <Typography
        as="button"
        type="button"
        onClick={handleDownload}
        variant={TYPOGRAPHY.R3}
        className="text-left text-blue-600 underline hover:opacity-70"
        disabled={!privateKey}
      >
        Download Key File (.json)
      </Typography>

      <Notification variant="warning">
        <div className="max-w-[65ch] text-grey-900">
          <Typography as="p" variant={TYPOGRAPHY.S3} className="mb-2">
            Important
          </Typography>
          <Typography as="ul" variant={TYPOGRAPHY.R4} className="grid gap-y-2">
            <li className="pl-4 indent-[-1rem]">
              • Save this private key securely - it cannot be recovered if lost
            </li>
            <li className="pl-4 indent-[-1rem]">
              • Never share your private key or commit it to version control
            </li>
            <li className="pl-4 indent-[-1rem]">
              • Use environment variables to store the key in your application
            </li>
          </Typography>
        </div>
      </Notification>

      <label className="flex items-center gap-x-3">
        <Checkbox register={register("confirmed")} />
        <Typography as="span" variant={TYPOGRAPHY.R3} className="text-grey-900">
          I have saved my private key securely
        </Typography>
      </label>

      <div className="flex justify-end gap-x-4">
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-24 py-3"
          onClick={onBack}
          testId="generate-new-key-back"
        >
          Back
        </DecoratedButton>
        <DecoratedButton
          type="submit"
          variant="primary"
          className="w-24 py-3"
          disabled={!isValid || !confirmed}
          testId="generate-new-key-create"
        >
          Create
        </DecoratedButton>
      </div>
    </form>
  );
};
