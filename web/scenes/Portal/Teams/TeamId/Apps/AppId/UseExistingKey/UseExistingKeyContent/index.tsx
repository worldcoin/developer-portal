"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { isAddress } from "ethers";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

type FormValues = {
  public_key: string;
};

const formSchema = yup.object({
  public_key: yup
    .string()
    .required("Public key is required")
    .transform((value) => {
      // Auto-add 0x prefix if missing
      if (!value) return value;
      return value.startsWith("0x") ? value : `0x${value}`;
    })
    .test(
      "is-address",
      "Invalid key. Must be 40 hex characters (0x followed by 40 characters)",
      (value) => (value ? isAddress(value) : false),
    ),
});

export type UseExistingKeyContentProps = {
  onBack: () => void;
  onContinue: (publicKey: string) => void;
  className?: string;
  loading?: boolean;
};

export const UseExistingKeyContent = ({
  onBack,
  onContinue,
  className,
  loading = false,
}: UseExistingKeyContentProps) => {
  const defaultValues: FormValues = useMemo(() => ({ public_key: "" }), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    mode: "onChange",
    resolver: yupResolver(formSchema),
    defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    onContinue(values.public_key);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={clsx("grid w-full max-w-[580px] gap-y-6", className)}
    >
      <div className="grid gap-y-3">
        <Typography as="h1" variant={TYPOGRAPHY.H6}>
          Use Existing Key
        </Typography>
        <Typography as="p" variant={TYPOGRAPHY.R3} className="text-grey-500">
          Provide a secp256k1 public key you control (e.g. Ethereum address)
        </Typography>
      </div>

      <div className="mt-[0.84rem]">
        <Input
          register={register("public_key")}
          label="Public Key"
          placeholder="0x1234...abcd"
          required
          errors={errors.public_key}
          data-testid="input-public-key"
        />
      </div>

      <div className="flex justify-between gap-x-4">
        <DecoratedButton
          type="button"
          variant="secondary"
          className="py-3"
          onClick={onBack}
          testId="use-existing-key-back"
        >
          Back
        </DecoratedButton>
        <DecoratedButton
          type="submit"
          variant="primary"
          className="py-3"
          disabled={!isValid || loading}
          loading={loading}
          testId="use-existing-key-create"
        >
          {loading ? <SpinnerIcon className="size-5 animate-spin" /> : "Create"}
        </DecoratedButton>
      </div>
    </form>
  );
};
