"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Input } from "@/components/Input";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import {
  AffiliateBalanceResponse,
  AffiliateMetadataResponse,
} from "@/lib/types";
import { parseTokenAmount } from "@/lib/utils";
import { useMemo } from "react";
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
  const availableBalance = useMemo(
    () =>
      props.balance
        ? parseTokenAmount(props.balance.availableBalance.inWLD, "WLD")
        : null,
    [props.balance],
  );

  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<WithdrawFormData>();

  const amount = watch("amount");
  const isAllowedToWithdraw =
    !!amount && !errors.amount && !!props.balance && !!props.metadata;

  return (
    <div className="grid w-full max-w-[380px] place-items-center justify-self-center py-8">
      <Typography variant={TYPOGRAPHY.H5}>Enter amount</Typography>

      <Typography variant={TYPOGRAPHY.R4} className="mt-2 text-grey-500">
        Enter amount that you want to withdraw
      </Typography>

      <Input
        type="number"
        register={register("amount")}
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
          onClick={() =>
            setValue("amount", 25, {
              shouldValidate: true,
              shouldDirty: true,
            })
          }
          disabled={props.loading}
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
          disabled={props.loading}
        >
          50 WLD
        </DecoratedButton>
        <DecoratedButton
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => {
            if (!availableBalance) {
              return;
            }
            setValue("amount", availableBalance, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }}
          disabled={props.loading || !availableBalance}
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
