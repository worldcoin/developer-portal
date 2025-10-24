"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { AffiliateBalanceResponse } from "@/lib/types";
import { parseTokenAmount } from "@/lib/utils";
import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { WithdrawFormData } from "../common/types";

export type Props = {
  balance: AffiliateBalanceResponse;
  onConfirm: () => void;
};

export const EnterAmount = (props: Props) => {
  const availableBalance = useMemo(
    () => parseTokenAmount(props.balance.availableBalance, "WLD"),
    [props.balance.availableBalance],
  );

  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<WithdrawFormData>();

  const amount = watch("amount");
  const isAmountValid = amount && !errors.amount;

  return (
    <div className="grid w-full max-w-[380px] place-items-center justify-self-center py-8">
      <Typography variant={TYPOGRAPHY.H5}>Enter amount</Typography>

      <Typography variant={TYPOGRAPHY.R4} className="mt-2 text-gray-500">
        Enter amount that you want to withdraw
      </Typography>

      <Input
        type="number"
        register={register("amount")}
        label="Amount"
        errors={errors.amount}
        className="mt-10"
        formNoValidate={true}
      />

      <div className="mt-4 flex w-full gap-3">
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() =>
            setValue("amount", 25, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        >
          25 WLD
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() =>
            setValue("amount", 50, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        >
          50 WLD
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() =>
            setValue("amount", availableBalance, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
        >
          Max
        </DecoratedButton>
      </div>

      <DecoratedButton
        type="button"
        variant="primary"
        className="mt-8 w-full"
        disabled={!isAmountValid}
        onClick={props.onConfirm}
      >
        Confirm
      </DecoratedButton>
    </div>
  );
};
