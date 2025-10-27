"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { useFormContext } from "react-hook-form";
import { WithdrawFormData } from "../common/types";
import Skeleton from "react-loading-skeleton";

export type Props = {
  onConfirm: () => void;
  loading: boolean;
};

export const EnterWalletAddress = (props: Props) => {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<WithdrawFormData>();
  const walletAddress = watch("walletAddress");
  const isWalletAddressValid = walletAddress && !errors.walletAddress;

  return (
    <div className="grid w-full max-w-[380px] place-items-center justify-self-center pt-8">
      <Typography variant={TYPOGRAPHY.H5}>Enter wallet address</Typography>

      <Typography variant={TYPOGRAPHY.R4} className="mt-2 text-gray-500">
        Enter address where you want to receive your assets
      </Typography>

      <Input
        register={register("walletAddress")}
        label="Wallet address"
        errors={errors.walletAddress}
        className="mt-10"
        placeholder="0x..."
      />

      {props.loading ? (
        <Skeleton height={48} width={380} className="mt-8 rounded-xl" />
      ) : (
        <DecoratedButton
          type="button"
          variant="primary"
          className="mt-8 w-full"
          disabled={!isWalletAddressValid}
          onClick={props.onConfirm}
        >
          Confirm
        </DecoratedButton>
      )}
    </div>
  );
};
