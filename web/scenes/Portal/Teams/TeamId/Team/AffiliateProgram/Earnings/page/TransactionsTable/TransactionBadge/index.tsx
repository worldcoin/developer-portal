import { BankIcon } from "@/components/Icons/BankIcon";
import { FailedIcon } from "@/components/Icons/FailedIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { SuccessCheckIcon } from "@/components/Icons/SuccessCheckIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { AffiliateTransactionsResponse } from "@/lib/types";
import { clsx } from "clsx";
import { useMemo } from "react";

export const TransactionBadge = (props: {
  transaction: AffiliateTransactionsResponse["transactions"][0] | null;
  className?: string;
  iconClassName?: string;
  hideStatusIcon?: boolean;
}) => {
  const { transaction } = props;

  const icon = useMemo(() => {
    if (transaction?.type === "affiliateAccumulationOrb") {
      return <WorldIcon className={clsx("size-6", props.iconClassName)} />;
    } else if (transaction?.type === "affiliateAccumulationNfc") {
      return <WorldIcon className={clsx("size-6", props.iconClassName)} />;
    } else if (transaction?.type === "affiliateWithdrawal") {
      return <BankIcon className={clsx("size-6", props.iconClassName)} />;
    }
  }, [transaction, props.iconClassName]);

  const statusIcon = useMemo(() => {
    if (
      props.transaction?.type !== "affiliateWithdrawal" ||
      (props.hideStatusIcon && props.transaction?.status !== "pending")
    ) {
      return null;
    } else if (props.transaction?.status === "pending") {
      return <SpinnerIcon className="size-5 animate-spin" />;
    } else if (props.transaction?.status === "mined") {
      return <SuccessCheckIcon className="size-5 text-green-500" />;
    } else if (props.transaction?.status === "failed") {
      return <FailedIcon className="size-5" />;
    } else {
      return null;
    }
  }, [props.transaction?.status, props.transaction?.type, props.hideStatusIcon]);

  if (!icon || !transaction) return null;

  return (
    <div className="relative">
      <IconFrame className={clsx("bg-grey-100", props.className)}>
        {icon}
      </IconFrame>
      {statusIcon && (
        <div className="absolute -bottom-1 -right-1 rounded-full p-0.5">
          {statusIcon}
        </div>
      )}
    </div>
  );
};
