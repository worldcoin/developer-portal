"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import {
  AffiliateBalanceResponse,
  AffiliateMetadataResponse,
} from "@/lib/types";
import { convertAmountToWei } from "@/lib/utils";
import { useFormContext } from "react-hook-form";
import Skeleton from "react-loading-skeleton";
import { WithdrawFormData } from "../common/types";

export type Props = {
  balance: AffiliateBalanceResponse["result"] | null;
  metadata: AffiliateMetadataResponse["result"] | null;
  onConfirm: () => void;
  loading: boolean;
};

export const EnterAmount = (props: Props) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<WithdrawFormData>();

  const amount = watch("amount");
  const isAllowedToWithdraw =
    !!amount && !errors.amount && !!props.balance && !!props.metadata;

  const setAmount = (wld: number, wldWei: string) => {
    setValue("amountInWld", wldWei);
    setValue("amount", wld, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="grid w-full max-w-[380px] place-items-center justify-self-center py-8">
      <Typography variant={TYPOGRAPHY.H5}>Enter amount</Typography>

      <Typography variant={TYPOGRAPHY.R4} className="mt-2 text-grey-500">
        Enter amount that you want to withdraw
      </Typography>

      <Input
        type="number"
        register={register("amount", {
          onChange: (e) => {
            const wldWei =
              convertAmountToWei(parseFloat(e.target.value), "WLD") ?? "";
            setValue("amountInWld", wldWei);
          },
        })}
        label="Amount"
        errors={errors.amount}
        className="mt-10"
        formNoValidate={true}
        disabled={props.loading}
      />

      <div className="mt-4 flex w-full gap-3">
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setAmount(25, convertAmountToWei(25, "WLD")!)}
          disabled={props.loading}
        >
          25 WLD
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setAmount(50, convertAmountToWei(50, "WLD")!)}
          disabled={props.loading}
        >
          50 WLD
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            if (!props.balance) {
              return;
            }
            setAmount(
              props.balance.availableBalance.inCurrency,
              props.balance.availableBalance.inWLD,
            );
          }}
          disabled={props.loading || !props.balance}
        >
          Max
        </DecoratedButton>
      </div>

      {props.loading ? (
        <Skeleton height={48} width={380} className="mt-8 rounded-xl" />
      ) : (
        <DecoratedButton
          type="button"
          variant="primary"
          className="mt-8 w-full"
          disabled={!isAllowedToWithdraw}
          onClick={props.onConfirm}
        >
          Confirm
        </DecoratedButton>
      )}
    </div>
  );
};
