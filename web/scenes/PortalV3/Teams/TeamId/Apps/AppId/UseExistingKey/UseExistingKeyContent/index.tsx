"use client";

import {
  formDialogErrorClassName,
  formDialogInputClassName,
  formDialogLabelClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
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
  loadingLabel?: string;
  /** Skip the internal heading when a dialog header already carries it. */
  hideTitle?: boolean;
};

export const UseExistingKeyContent = ({
  onBack,
  onContinue,
  className,
  loading = false,
  loadingLabel,
  hideTitle,
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
      className={clsx("grid w-full gap-y-6", className)}
    >
      {!hideTitle && (
        <h2 className="font-world text-15 leading-[1.2] font-medium text-portal-ink">
          Use existing key
        </h2>
      )}
      <p className="font-world text-14 leading-[1.5] text-portal-muted">
        Provide a secp256k1 public key you control (e.g. an Ethereum address).
      </p>

      <div>
        <label
          htmlFor="use-existing-key-public-key"
          className={formDialogLabelClassName}
        >
          Public key *
        </label>
        <input
          id="use-existing-key-public-key"
          required
          {...register("public_key")}
          className={formDialogInputClassName}
          placeholder="0x1234...abcd"
          data-testid="input-public-key"
          aria-invalid={Boolean(errors.public_key)}
          aria-describedby={
            errors.public_key ? "use-existing-key-public-key-error" : undefined
          }
        />
        {errors.public_key?.message && (
          <p
            id="use-existing-key-public-key-error"
            className={formDialogErrorClassName}
          >
            {errors.public_key.message}
          </p>
        )}
      </div>

      <div className="grid w-full gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          data-testid="button-use-existing-key-back"
          className={`${formDialogSecondaryActionClassName} order-2 md:order-none`}
        >
          Back
        </button>
        <InkButton
          type="submit"
          disabled={!isValid}
          loading={loading}
          data-testid="button-use-existing-key-create"
          className="order-1 h-11 w-full md:order-none"
        >
          {loading && loadingLabel ? loadingLabel : "Create"}
        </InkButton>
      </div>
    </form>
  );
};
